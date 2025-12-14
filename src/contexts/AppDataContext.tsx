import React, { createContext, useContext, useMemo, useState } from "react";
import type {
  Attendance,
  Customer,
  Expense,
  ExpenseCategory,
  Item,
  PurchaseOrder,
  RestaurantTable,
  Sale,
  Staff,
  StaffPayment,
  Supplier,
  SupplierTransaction,
  VatEntry,
} from "@/types";
import {
  attendanceRecords as seedAttendance,
  customers as seedCustomers,
  expenseCategories as seedExpenseCategories,
  expenses as seedExpenses,
  items as seedItems,
  purchaseOrders as seedPurchaseOrders,
  recentSales as seedSales,
  restaurantTables as seedTables,
  staffMembers as seedStaff,
  staffPayments as seedStaffPayments,
  suppliers as seedSuppliers,
  supplierTransactions as seedSupplierTransactions,
  vatEntries as seedVatEntries,
  tableOrders as seedTableOrders,
} from "@/data/mockData";
import { delay, newId } from "@/services/placeholderApi";

export type TableOrder = (typeof seedTableOrders)[number];

type AppData = {
  // Core data
  items: Item[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  purchaseOrders: PurchaseOrder[];
  sales: Sale[];
  customers: Customer[];
  staff: Staff[];
  staffPayments: StaffPayment[];
  attendance: Attendance[];
  vatEntries: VatEntry[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  tables: RestaurantTable[];
  tableOrders: TableOrder[];

  // Placeholder APIs (async) - mutate local state only
  createSupplier: (input: Omit<Supplier, "id" | "createdAt" | "dueBalance"> & Partial<Pick<Supplier, "dueBalance">>) => Promise<Supplier>;
  addSupplierTransaction: (input: Omit<SupplierTransaction, "id" | "createdAt">) => Promise<SupplierTransaction>;
  createPurchaseOrder: (input: Omit<PurchaseOrder, "id" | "createdAt">) => Promise<PurchaseOrder>;
  markPurchaseOrderReceived: (poId: string) => Promise<void>;

  saveTableOrder: (tableId: string, items: TableOrder["items"]) => Promise<void>;
  finalizeTableBill: (tableId: string, paymentMethod: Sale["paymentMethod"]) => Promise<Sale>;

  upsertAttendance: (input: { staffId: string; date: string; status: Attendance["status"]; checkIn?: string; checkOut?: string; notes?: string }) => Promise<void>;

  createStaffPayment: (input: Omit<StaffPayment, "id" | "createdAt">) => Promise<StaffPayment>;
  createStaff: (input: Omit<Staff, "id">) => Promise<Staff>;
  updateStaff: (staffId: string, updates: Partial<Omit<Staff, "id">>) => Promise<void>;

  updateSaleTotalWithAudit: (saleId: string, input: { newTotal: number; editedBy: string; reason: string }) => Promise<void>;
  replaceSale: (sale: Sale) => void; // used for undo/redo in UI

  createExpense: (input: Omit<Expense, "id" | "createdAt">) => Promise<Expense>;
  createVatEntry: (input: Omit<VatEntry, "id" | "createdAt" | "vatAmount">) => Promise<VatEntry>;

  upsertItem: (input: Item) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<Omit<Item, "id">>) => Promise<void>;
};

const AppDataContext = createContext<AppData | undefined>(undefined);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Item[]>(seedItems);
  const [suppliers, setSuppliers] = useState<Supplier[]>(seedSuppliers);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(seedSupplierTransactions);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(seedPurchaseOrders);
  const [sales, setSales] = useState<Sale[]>(seedSales);
  const [customers] = useState<Customer[]>(seedCustomers);
  const [staff, setStaff] = useState<Staff[]>(seedStaff);
  const [staffPayments, setStaffPayments] = useState<StaffPayment[]>(seedStaffPayments);
  const [attendance, setAttendance] = useState<Attendance[]>(seedAttendance);
  const [vatEntries, setVatEntries] = useState<VatEntry[]>(seedVatEntries);
  const [expenses, setExpenses] = useState<Expense[]>(seedExpenses);
  const [expenseCategories] = useState<ExpenseCategory[]>(seedExpenseCategories);
  const [tables, setTables] = useState<RestaurantTable[]>(seedTables);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>(seedTableOrders as TableOrder[]);

  const value = useMemo<AppData>(
    () => ({
      items,
      suppliers,
      supplierTransactions,
      purchaseOrders,
      sales,
      customers,
      staff,
      staffPayments,
      attendance,
      vatEntries,
      expenses,
      expenseCategories,
      tables,
      tableOrders,

      createSupplier: async (input) => {
        await delay();
        const created: Supplier = {
          id: newId("SUP"),
          name: input.name,
          phone: input.phone,
          email: input.email,
          address: input.address,
          dueBalance: input.dueBalance ?? 0,
          createdAt: todayISO(),
        };
        setSuppliers((prev) => [created, ...prev]);
        return created;
      },

      addSupplierTransaction: async (input) => {
        await delay();
        const created: SupplierTransaction = {
          id: newId("ST"),
          ...input,
          createdAt: input.createdAt ?? todayISO(),
        };
        setSupplierTransactions((prev) => [created, ...prev]);
        setSuppliers((prev) =>
          prev.map((s) => {
            if (s.id !== input.supplierId) return s;
            const delta = input.type === "purchase" ? input.amount : -input.amount;
            return { ...s, dueBalance: Math.max(0, s.dueBalance + delta) };
          })
        );
        return created;
      },

      createPurchaseOrder: async (input) => {
        await delay();
        const created: PurchaseOrder = {
          ...input,
          id: input.id || newId("PO"),
          createdAt: todayISO(),
        };
        setPurchaseOrders((prev) => [created, ...prev]);

        // Record as supplier purchase transaction (ledger)
        const tx: SupplierTransaction = {
          id: newId("ST"),
          supplierId: created.supplierId,
          type: "purchase",
          amount: created.total,
          description: `Purchase Order ${created.id}`,
          invoiceNo: created.invoiceNo,
          date: created.date,
          createdAt: todayISO(),
        };
        setSupplierTransactions((prev) => [tx, ...prev]);
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === created.supplierId ? { ...s, dueBalance: Math.max(0, s.dueBalance + created.total) } : s
          )
        );

        return created;
      },

      markPurchaseOrderReceived: async (poId) => {
        await delay();
        const po = purchaseOrders.find((p) => p.id === poId);
        if (!po) return;
        if (po.status !== "pending") return;

        // Update PO status
        setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? { ...p, status: "received" } : p)));

        // Increase stock for each item (best-effort matching by itemId)
        setItems((prev) =>
          prev.map((it) => {
            const line = po.items.find((x) => x.itemId === it.id);
            if (!line) return it;
            return { ...it, stockQty: it.stockQty + line.quantity };
          })
        );
      },

      saveTableOrder: async (tableId, orderItems) => {
        await delay(150);
        let orderId: string | undefined;
        setTableOrders((prev) => {
          const existingOrderIdx = prev.findIndex((o) => o.tableId === tableId && o.status !== "completed");
          const subtotal = orderItems.reduce((s, i) => s + i.total, 0);
          const vatAmount = subtotal * 0.05;
          const total = subtotal + vatAmount;
          const nowIso = new Date().toISOString();

          if (existingOrderIdx >= 0) {
            const existing = prev[existingOrderIdx];
            const updated: TableOrder = {
              ...existing,
              items: orderItems,
              subtotal,
              vatAmount,
              total,
              updatedAt: nowIso,
            };
            orderId = updated.id;
            const next = [...prev];
            next[existingOrderIdx] = updated;
            return next;
          }

          const table = tables.find((t) => t.id === tableId);
          const created: TableOrder = {
            id: newId("TO"),
            tableId,
            tableNo: table?.tableNo || tableId,
            items: orderItems,
            subtotal,
            vatAmount,
            serviceCharge: 0,
            discount: 0,
            total,
            status: "active",
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          orderId = created.id;
          return [created, ...prev];
        });

        // Update table status + currentOrderId
        setTables((prev) =>
          prev.map((t) => {
            if (t.id !== tableId) return t;
            return {
              ...t,
              status: "occupied",
              currentOrderId: orderId ?? t.currentOrderId,
            };
          })
        );
      },

      finalizeTableBill: async (tableId, paymentMethod) => {
        await delay(250);
        const table = tables.find((t) => t.id === tableId);
        const order = table?.currentOrderId
          ? tableOrders.find((o) => o.id === table.currentOrderId)
          : tableOrders.find((o) => o.tableId === tableId && o.status !== "completed");
        if (!table || !order) throw new Error("No active order for this table");

        // Mark order completed + clear table
        setTableOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: "completed", updatedAt: new Date().toISOString() } : o))
        );
        setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: "empty", currentOrderId: undefined } : t)));

        const sale: Sale = {
          id: newId("S"),
          createdAt: new Date().toISOString(),
          items: order.items.map((i) => ({
            itemId: i.itemId,
            itemName: i.itemName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            total: i.total,
          })),
          subtotal: order.subtotal,
          vatAmount: order.vatAmount,
          discount: order.discount,
          total: order.total,
          paymentMethod,
          orderType: "dine-in",
          tableNo: table.tableNo,
          status: "completed",
        };
        setSales((prev) => [sale, ...prev]);
        return sale;
      },

      upsertAttendance: async ({ staffId, date, status, checkIn, checkOut, notes }) => {
        await delay(120);
        setAttendance((prev) => {
          const idx = prev.findIndex((a) => a.staffId === staffId && a.date === date);
          const nextRecord: Attendance = {
            id: idx >= 0 ? prev[idx].id : newId("ATT"),
            staffId,
            date,
            status,
            checkIn,
            checkOut,
            notes,
          };
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = nextRecord;
            return next;
          }
          return [nextRecord, ...prev];
        });
      },

      createStaffPayment: async (input) => {
        await delay(200);
        const created: StaffPayment = {
          ...input,
          id: newId("SP"),
          createdAt: input.createdAt ?? todayISO(),
        };
        setStaffPayments((prev) => [created, ...prev]);
        return created;
      },

      createStaff: async (input) => {
        await delay(200);
        const created: Staff = { ...input, id: newId("STF") };
        setStaff((prev) => [created, ...prev]);
        return created;
      },

      updateStaff: async (staffId, updates) => {
        await delay(150);
        setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, ...updates } : s)));
      },

      updateSaleTotalWithAudit: async (saleId, { newTotal, editedBy, reason }) => {
        await delay(250);
        setSales((prev) =>
          prev.map((s) => {
            if (s.id !== saleId) return s;
            const edit = {
              id: newId("E"),
              editedAt: new Date().toISOString(),
              editedBy,
              previousTotal: s.total,
              newTotal,
              reason,
            };
            return {
              ...s,
              total: newTotal,
              editHistory: [edit, ...(s.editHistory ?? [])],
            };
          })
        );
      },

      replaceSale: (sale) => {
        setSales((prev) => prev.map((s) => (s.id === sale.id ? sale : s)));
      },

      createExpense: async (input) => {
        await delay(200);
        const created: Expense = { ...input, id: newId("EXP"), createdAt: input.createdAt ?? todayISO() };
        setExpenses((prev) => [created, ...prev]);
        return created;
      },

      createVatEntry: async (input) => {
        await delay(200);
        const vatAmount = input.amount * (input.vatRate / 100);
        const created: VatEntry = {
          ...input,
          id: newId("VAT"),
          vatAmount,
          createdAt: input.createdAt ?? todayISO(),
        };
        setVatEntries((prev) => [created, ...prev]);
        return created;
      },

      upsertItem: async (input) => {
        await delay(120);
        setItems((prev) => {
          const idx = prev.findIndex((x) => x.id === input.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = input;
            return next;
          }
          return [input, ...prev];
        });
      },

      updateItem: async (itemId, updates) => {
        await delay(120);
        setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it)));
      },
    }),
    [
      attendance,
      customers,
      expenseCategories,
      expenses,
      items,
      purchaseOrders,
      sales,
      staff,
      staffPayments,
      supplierTransactions,
      suppliers,
      tableOrders,
      tables,
      vatEntries,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}


