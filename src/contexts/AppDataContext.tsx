import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  Attendance,
  Customer,
  Expense,
  ExpenseCategory,
  Category,
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
  categories as seedCategories,
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
import { apiClient, API_ORIGIN } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";

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
  categories: Category[];
  tables: RestaurantTable[];
  tableOrders: TableOrder[];

  // Placeholder APIs (async) - mutate local state only
  createSupplier: (input: Omit<Supplier, "id" | "createdAt" | "dueBalance"> & Partial<Pick<Supplier, "dueBalance">>) => Promise<Supplier>;
  addSupplierTransaction: (
    input: Omit<SupplierTransaction, "id" | "createdAt"> & Partial<Pick<SupplierTransaction, "createdAt">>
  ) => Promise<SupplierTransaction>;
  createPurchaseOrder: (
    input: Omit<PurchaseOrder, "id" | "createdAt"> & Partial<Pick<PurchaseOrder, "id" | "createdAt">>
  ) => Promise<PurchaseOrder>;
  markPurchaseOrderReceived: (poId: string) => Promise<void>;

  saveTableOrder: (tableId: string, items: TableOrder["items"], opts?: { kotItems?: TableOrder["items"] }) => Promise<void>;
  finalizeTableBill: (tableId: string, paymentMethod: Sale["paymentMethod"]) => Promise<Sale>;
  ensureTableSession: (tableId: string) => Promise<TableOrder>;
  markTableBilling: (tableId: string) => Promise<void>;

  upsertAttendance: (input: { staffId: string; date: string; status: Attendance["status"]; checkIn?: string; checkOut?: string; notes?: string }) => Promise<void>;

  createStaffPayment: (
    input: Omit<StaffPayment, "id" | "createdAt"> & Partial<Pick<StaffPayment, "createdAt">>
  ) => Promise<StaffPayment>;
  createStaff: (input: Omit<Staff, "id">) => Promise<Staff>;
  updateStaff: (staffId: string, updates: Partial<Omit<Staff, "id">>) => Promise<void>;

  updateSaleTotalWithAudit: (saleId: string, input: { newTotal: number; editedBy: string; reason: string }) => Promise<void>;
  replaceSale: (sale: Sale) => void; // used for undo/redo in UI

  createExpense: (input: Omit<Expense, "id" | "createdAt"> & Partial<Pick<Expense, "createdAt">>) => Promise<Expense>;
  createVatEntry: (
    input: Omit<VatEntry, "id" | "createdAt" | "vatAmount"> & Partial<Pick<VatEntry, "createdAt">>
  ) => Promise<VatEntry>;

  upsertItem: (input: Item, file?: File | null) => Promise<Item>;
  updateItem: (itemId: string, updates: Partial<Omit<Item, "id">>) => Promise<void>;
  addCategory: (input: Omit<Category, "id" | "itemCount"> & Partial<Pick<Category, "itemCount">>) => Promise<Category>;
  removeCategory: (categoryId: string) => Promise<void>;
  
  completeSale: (input: Omit<Sale, "id">) => Promise<Sale>;
};

const AppDataContext = createContext<AppData | undefined>(undefined);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>(apiClient.token ? [] : seedItems);
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
  const [categories, setCategories] = useState<Category[]>(apiClient.token ? [] : seedCategories);
  const [tables, setTables] = useState<RestaurantTable[]>(seedTables);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>(seedTableOrders as TableOrder[]);

  useEffect(() => {
    if (!user?.token) return;
    const load = async () => {
      try {
        const [cats, prods] = await Promise.all([
          categoriesApi.list(),
          productsApi.list(),
        ]);
        setCategories(
          cats.map((c) => ({
            id: c.id,
            name: c.name,
            nameBn: c.name_bn ?? undefined,
            icon: c.icon ?? "🍽️",
            itemCount: c.item_count ?? 0,
          }))
        );
        setItems(
          prods.map((p) => ({
            id: String(p.id),
            name: p.name,
            nameBn: p.name_bn ?? undefined,
            sku: p.sku,
            categoryId: p.category_id,
            price: Number(p.price),
            cost: Number(p.cost),
            stockQty: Number(p.stock_qty ?? 0),
            unit: (p.unit as Item["unit"]) || "pcs",
            imageUrl: p.image_url
              ? p.image_url.startsWith("http")
                ? p.image_url
                : `${API_ORIGIN}${p.image_url}`
              : undefined,
            isActive: Boolean(p.is_active),
            isPackaged: Boolean(p.is_packaged),
            vatRate: p.vat_rate != null ? Number(p.vat_rate) : undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }))
        );
      } catch (err) {
        console.error("API load failed, falling back to seeds", err);
        setCategories(seedCategories);
        setItems(seedItems);
      }
    };
    load();
  }, [user?.token]);

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
      categories,
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

      saveTableOrder: async (tableId, orderItems, opts) => {
        await delay(150);
        const { kotItems } = opts ?? {};
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
              kots:
                kotItems && kotItems.length > 0
                  ? [...(existing.kots ?? []), { id: newId("KOT"), items: kotItems, createdAt: nowIso }]
                  : existing.kots,
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
            kots:
              kotItems && kotItems.length > 0
                ? [{ id: newId("KOT"), items: kotItems, createdAt: nowIso }]
                : [],
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
              status: t.status === "billing" ? "billing" : "occupied",
              currentOrderId: orderId ?? t.currentOrderId,
            };
          })
        );
      },

      ensureTableSession: async (tableId) => {
        await delay(80);
        const existing = tableOrders.find((o) => o.tableId === tableId && o.status !== "completed");
        if (existing) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === tableId
                ? {
                    ...t,
                    status: t.status === "empty" || t.status === "reserved" ? "occupied" : t.status,
                    currentOrderId: existing.id,
                  }
                : t
            )
          );
          return existing;
        }

        const table = tables.find((t) => t.id === tableId);
        const nowIso = new Date().toISOString();
        const created: TableOrder = {
          id: newId("TO"),
          tableId,
          tableNo: table?.tableNo || tableId,
          items: [],
          subtotal: 0,
          vatAmount: 0,
          serviceCharge: 0,
          discount: 0,
          total: 0,
          status: "active",
          createdAt: nowIso,
          updatedAt: nowIso,
          kots: [],
        };
        setTableOrders((prev) => [created, ...prev]);
        setTables((prev) =>
          prev.map((t) => (t.id === tableId ? { ...t, status: "occupied", currentOrderId: created.id } : t))
        );
        return created;
      },

      markTableBilling: async (tableId) => {
        await delay(80);
        setTableOrders((prev) =>
          prev.map((o) => (o.tableId === tableId && o.status !== "completed" ? { ...o, status: "billing" } : o))
        );
        setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: "billing" } : t)));
      },

      finalizeTableBill: async (tableId, paymentMethod) => {
        await delay(250);
        const table = tables.find((t) => t.id === tableId);
        const order = table?.currentOrderId
          ? tableOrders.find((o) => o.id === table.currentOrderId)
          : tableOrders.find((o) => o.tableId === tableId && o.status !== "completed");
        if (!table || !order) throw new Error("No active order for this table");
        if (order.status === "completed") throw new Error("Bill already completed");

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
          serviceCharge: order.serviceCharge,
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

      upsertItem: async (input, file = null) => {
        if (user?.token) {
          const payload = {
            name: input.name,
            name_bn: input.nameBn,
            category_id: input.categoryId,
            price: input.price,
            cost: input.cost,
            unit: input.unit,
            is_packaged: input.isPackaged,
            stock_qty: input.isPackaged ? input.stockQty ?? 0 : 0,
            is_active: input.isActive,
            sku: input.sku,
            vat_rate: input.vatRate,
            description: undefined as string | undefined,
          };
          const exists = items.find((x) => x.id === input.id);
          const saved = exists
            ? await productsApi.update(input.id, payload, file)
            : await productsApi.create(payload, file);
          // Ensure freshness by refetching list (handles server defaults, ids, and media paths)
          const refreshed = await productsApi.list();
          setItems(
            refreshed.map((p) => ({
              id: String(p.id),
              name: p.name,
              nameBn: p.name_bn ?? undefined,
              sku: p.sku,
              categoryId: p.category_id,
              price: Number(p.price),
              cost: Number(p.cost),
              stockQty: Number(p.stock_qty ?? 0),
              unit: (p.unit as Item["unit"]) || "pcs",
              imageUrl: p.image_url
                ? p.image_url.startsWith("http")
                  ? p.image_url
                  : `${API_ORIGIN}${p.image_url}`
                : undefined,
              isActive: Boolean(p.is_active),
              isPackaged: Boolean(p.is_packaged),
              vatRate: p.vat_rate != null ? Number(p.vat_rate) : undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }))
          );
          const mapped: Item = {
            id: String(saved.id),
            name: saved.name,
            nameBn: saved.name_bn ?? undefined,
            sku: saved.sku,
            categoryId: saved.category_id,
            price: Number(saved.price),
            cost: Number(saved.cost),
            stockQty: Number(saved.stock_qty ?? 0),
            unit: (saved.unit as Item["unit"]) || "pcs",
            imageUrl: saved.image_url
              ? saved.image_url.startsWith("http")
                ? saved.image_url
                : `${API_ORIGIN}${saved.image_url}`
              : undefined,
            isActive: Boolean(saved.is_active),
            isPackaged: Boolean(saved.is_packaged),
            vatRate: saved.vat_rate != null ? Number(saved.vat_rate) : undefined,
            createdAt: input.createdAt,
            updatedAt: new Date().toISOString(),
          };
          setItems((prev) => {
            const idx = prev.findIndex((x) => x.id === mapped.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = mapped;
              return next;
            }
            return [mapped, ...prev];
          });
          return mapped;
        }
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
        return input;
      },

      updateItem: async (itemId, updates) => {
        if (user?.token) {
          await productsApi.update(itemId, {
            name: updates.name,
            name_bn: updates.nameBn,
            category_id: updates.categoryId,
            price: updates.price,
            cost: updates.cost,
            unit: updates.unit,
            is_packaged: updates.isPackaged,
            stock_qty: updates.stockQty,
            is_active: updates.isActive,
            vat_rate: updates.vatRate,
          });
        } else {
          await delay(120);
        }
        setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...updates } : it)));
      },
      addCategory: async (input) => {
        if (user?.token) {
          const created = await categoriesApi.create({
            name: input.name,
            name_bn: input.nameBn,
            icon: input.icon,
          });
          const mapped: Category = {
            id: created.id,
            name: created.name,
            nameBn: created.name_bn ?? undefined,
            icon: created.icon ?? "🍽️",
            itemCount: created.item_count ?? input.itemCount ?? 0,
          };
          setCategories((prev) => [mapped, ...prev]);
          return mapped;
        }
        await delay(100);
        const category: Category = {
          id: newId("CAT"),
          itemCount: input.itemCount ?? 0,
          ...input,
        };
        setCategories((prev) => [category, ...prev]);
        return category;
      },
      removeCategory: async (categoryId) => {
        if (user?.token) {
          try {
            await categoriesApi.delete(categoryId);
          } catch (err) {
            console.error(err);
            throw err;
          }
        } else {
          await delay(80);
        }
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      },

      completeSale: async (input) => {
        await delay(200);
        
        // Check stock availability ONLY for packaged items
        for (const item of input.items) {
          const inventoryItem = items.find(i => i.id === item.itemId);
          if (!inventoryItem) {
            throw new Error(`Item ${item.itemName} not found in inventory`);
          }
          // Only check stock for packaged items (ice cream, coke, etc.)
          // Cooked items (biryani, curry) don't need stock tracking
          if (inventoryItem.isPackaged && inventoryItem.stockQty < item.quantity) {
            throw new Error(`Insufficient stock for ${item.itemName}. Available: ${inventoryItem.stockQty}, Required: ${item.quantity}`);
          }
        }
        
        // Deduct stock ONLY for packaged items
        setItems(prev =>
          prev.map(item => {
            const saleItem = input.items.find(si => si.itemId === item.id);
            if (!saleItem || !item.isPackaged) return item;
            return { ...item, stockQty: item.stockQty - saleItem.quantity };
          })
        );
        
        // Create sale
        const sale: Sale = {
          ...input,
          id: newId("S"),
        };
        
        setSales(prev => [sale, ...prev]);
        return sale;
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


