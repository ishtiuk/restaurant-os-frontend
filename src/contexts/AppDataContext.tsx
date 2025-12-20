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
import { salesApi, type SaleDto } from "@/lib/api/sales";
import { tablesApi, type TableDto, type TableOrderDto } from "@/lib/api/tables";
import { staffApi } from "@/lib/api/staff";

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
  finalizeTableBill: (
    tableId: string,
    paymentMethod: Sale["paymentMethod"],
    options?: { discount?: number; serviceCharge?: number }
  ) => Promise<Sale>;
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
  refreshCategories: () => Promise<void>;
  
  completeSale: (input: Omit<Sale, "id">) => Promise<Sale>;
  refreshTables: () => Promise<void>;
};

const AppDataContext = createContext<AppData | undefined>(undefined);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Initialize with empty arrays if token exists (will be loaded by useEffect)
  // Otherwise use seed data for demo/offline mode
  const hasToken = apiClient.token || (typeof window !== "undefined" && localStorage.getItem("restaurant-os.auth.user"));
  const [items, setItems] = useState<Item[]>(hasToken ? [] : seedItems);
  const [suppliers, setSuppliers] = useState<Supplier[]>(seedSuppliers);
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(seedSupplierTransactions);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(seedPurchaseOrders);
  const [sales, setSales] = useState<Sale[]>(hasToken ? [] : seedSales);
  const [customers] = useState<Customer[]>(seedCustomers);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [staffPayments, setStaffPayments] = useState<StaffPayment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>(seedAttendance);
  const [vatEntries, setVatEntries] = useState<VatEntry[]>(seedVatEntries);
  const [expenses, setExpenses] = useState<Expense[]>(seedExpenses);
  const [expenseCategories] = useState<ExpenseCategory[]>(seedExpenseCategories);
  const [categories, setCategories] = useState<Category[]>(hasToken ? [] : seedCategories);
  const [tables, setTables] = useState<RestaurantTable[]>(hasToken ? [] : seedTables);
  const [tableOrders, setTableOrders] = useState<TableOrder[]>(hasToken ? [] : (seedTableOrders as TableOrder[]));

  // Load items and categories when user/tenant changes
  useEffect(() => {
    // Check both user token and apiClient token (for reload scenarios)
    const token = user?.token || apiClient.token;
    if (!token) {
      // No token: use seed data
      setCategories(seedCategories);
      setItems(seedItems);
      return;
    }

    // Ensure apiClient has the token and tenantId (for reload scenarios)
    if (user?.token && !apiClient.token) {
      apiClient.token = user.token;
    }
    if (user?.tenantId && !apiClient.tenantId) {
      apiClient.tenantId = user.tenantId;
    }

    const load = async () => {
      try {
        const [cats, prods, salesResponse, tablesData, activeOrdersData, staffData, paymentsData] = await Promise.all([
          categoriesApi.list(),
          productsApi.list(),
          salesApi.list(100, 0).catch(() => ({ data: [], total: 0 })), // Load sales, but don't fail if endpoint doesn't exist yet
          tablesApi.list().catch(() => []), // Load tables, but don't fail if endpoint doesn't exist yet
          tablesApi.listActiveOrders().catch(() => []), // Load active table orders
          staffApi.list().catch(() => []), // Load staff, but don't fail if endpoint doesn't exist yet
          staffApi.listPayments().catch(() => []), // Load staff payments, but don't fail if endpoint doesn't exist yet
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
        // Map sales from API to frontend format
        const salesData = salesResponse.data || [];
        setSales(
          salesData.map((s) => ({
            id: s.id,
            createdAt: s.created_at,
            items: s.items.map((i) => ({
              itemId: i.item_id,
              itemName: i.item_name,
              quantity: i.quantity,
              unitPrice: i.unit_price,
              discount: i.discount,
              total: i.total,
              notes: i.notes ?? undefined,
            })),
            subtotal: s.subtotal,
            vatAmount: s.vat_amount,
            serviceCharge: s.service_charge,
            discount: s.discount,
            total: s.total,
            paymentMethod: s.payment_method,
            customerId: undefined,
            customerName: s.customer_name ?? undefined,
            customerPhone: s.customer_phone ?? undefined,
            deliveryAddress: s.delivery_address ?? undefined,
            deliveryNotes: s.delivery_notes ?? undefined,
            tableNo: s.table_no ?? undefined,
            orderType: s.order_type,
            status: s.status,
          }))
        );
        // Map tables from API to frontend format
        setTables(
          tablesData.map((t) => ({
            id: t.id,
            tableNo: t.table_no,
            capacity: t.capacity,
            status: t.status as RestaurantTable["status"],
            location: t.location ?? undefined,
            isActive: t.is_active,
            currentOrderId: undefined, // Will be set when we load orders
          }))
        );
        // Map active table orders from API to frontend format
        setTableOrders(
          activeOrdersData.map((o) => {
            const table = tablesData.find((t) => t.id === o.table_id);
            return {
              id: o.id,
              tableId: o.table_id,
              tableNo: table?.table_no || o.table_id,
              items: o.items.map((i) => {
                // Look up product to get vatRate
                const product = prods.find((p) => p.id === i.product_id);
                return {
                  itemId: String(i.product_id),
                  itemName: i.item_name,
                  quantity: i.quantity,
                  unitPrice: i.unit_price,
                  discount: i.discount,
                  total: i.total,
                  notes: i.notes ?? undefined,
                  available: 9999,
                  vatRate: product?.vat_rate != null ? Number(product.vat_rate) : undefined,
                };
              }),
              subtotal: o.subtotal,
              vatAmount: o.vat_amount,
              serviceCharge: o.service_charge,
              discount: o.discount,
              total: o.total,
              status: o.status as TableOrder["status"],
              createdAt: o.created_at,
              updatedAt: o.updated_at,
              kots: [],
            };
          })
        );
        // Update tables with currentOrderId from orders
        setTables((prev) =>
          prev.map((t) => {
            const order = activeOrdersData.find((o) => o.table_id === t.id && o.status !== "completed");
            return order ? { ...t, currentOrderId: order.id } : t;
          })
        );
        // Map staff from API to frontend format
        setStaff(
          staffData.map((s) => ({
            id: s.id,
            name: s.name,
            nameBn: s.name_bn ?? undefined,
            phone: s.phone,
            email: s.email ?? undefined,
            role: s.role as Staff["role"],
            salary: Number(s.salary),
            joiningDate: s.joining_date ?? new Date().toISOString().slice(0, 10),
            isActive: s.is_active,
            emergencyContact: s.emergency_contact ?? undefined,
            address: s.address ?? undefined,
          }))
        );
        // Map staff payments from API to frontend format
        setStaffPayments(
          paymentsData.map((p) => ({
            id: p.id,
            staffId: p.staff_id,
            amount: Number(p.amount),
            type: p.type as StaffPayment["type"],
            description: p.description ?? p.type,
            date: p.date,
            createdAt: p.created_at,
          }))
        );
      } catch (err) {
        console.error("API load failed", err);
        // Only fallback to seed data for non-critical features
        // Staff and staff payments require API - don't fallback
        if (!user?.token) {
          // Only use seed data if no token (offline demo mode)
          setCategories(seedCategories);
          setItems(seedItems);
          setSales(seedSales);
          setTables(seedTables);
          setTableOrders(seedTableOrders as TableOrder[]);
        }
        // Staff and staff payments always require API - no fallback
      }
    };
    load();
  }, [user, user?.token, user?.tenantId, user?.id]); // Reload when user object or user/tenant changes

  // Refresh items when sales complete (to update stock)
  // This is handled in completeSale function

  // Function to refresh tables from API
  const refreshTables = async () => {
    if (!user?.token) return;
    try {
      const tablesData = await tablesApi.list();
      setTables(
        tablesData.map((t) => ({
          id: t.id,
          tableNo: t.table_no,
          capacity: t.capacity,
          status: t.status as RestaurantTable["status"],
          location: t.location ?? undefined,
          isActive: t.is_active,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }))
      );
    } catch (err) {
      console.error("Failed to refresh tables", err);
    }
  };

  // Function to refresh categories from API
  const refreshCategories = async () => {
    if (!user?.token) return;
    try {
      const refreshed = await categoriesApi.list();
      setCategories(
        refreshed.map((c) => ({
          id: c.id,
          name: c.name,
          nameBn: c.name_bn ?? undefined,
          icon: c.icon ?? "🍽️",
          itemCount: c.item_count ?? 0,
        }))
      );
    } catch (err) {
      console.error("Failed to refresh categories", err);
    }
  };

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
        if (user?.token) {
          try {
            const { kotItems } = opts ?? {};
            // In Bangladesh, prices shown to customers are VAT-inclusive
            // But for backend accounting, we need to separate VAT
            const subtotalInclusive = orderItems.reduce((s, i) => s + i.total, 0);
            // Calculate VAT from each item's VAT rate
            // Extract VAT from VAT-inclusive prices: vat = (price * qty) * (vatRate / (100 + vatRate))
            const calculatedVat = orderItems.reduce((sum, item) => {
              const cartItem = items.find((ci) => ci.id === item.itemId);
              const vatRate = (cartItem as any)?.vatRate;
              if (!vatRate || vatRate === 0) return sum;
              const itemVat = (item.total * vatRate) / (100 + vatRate);
              return sum + itemVat;
            }, 0);
            const vatAmount = Math.round(calculatedVat);
            // Subtotal without VAT (for backend accounting) - round after subtracting VAT
            const subtotal = Math.round(subtotalInclusive - calculatedVat);
            // Total = Subtotal (VAT-exclusive) + VAT (rounded)
            const total = subtotal + vatAmount;

            // Create/update order via API
            const orderInput = {
              table_id: tableId,
              items: orderItems.map((i) => ({
                item_id: i.itemId,
                item_name: i.itemName,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                discount: i.discount ?? 0,
                total: i.total,
                notes: i.notes,
              })),
              subtotal,
              vat_amount: vatAmount,
              service_charge: 0,
              discount: 0,
              total,
            };

            const created = await tablesApi.createOrder(orderInput);

            // Create KOT if items provided
            if (kotItems && kotItems.length > 0) {
              try {
                await tablesApi.createKOT(tableId, {
                  order_id: created.id,
                  items: kotItems.map((i) => ({
                    item_id: i.itemId,
                    item_name: i.itemName,
                    quantity: i.quantity,
                    notes: i.notes,
                  })),
                });
              } catch (err) {
                console.error("Failed to create KOT", err);
              }
            }

            // Refresh tables and active orders to get currentOrderId
            const [refreshedTables, activeOrders] = await Promise.all([
              tablesApi.list().catch(() => tables),
              tablesApi.listActiveOrders().catch(() => []),
            ]);
            if (refreshedTables !== tables) {
              setTables(
                refreshedTables.map((t) => {
                  const order = activeOrders.find((o) => o.table_id === t.id && o.status !== "completed");
                  return {
                    id: t.id,
                    tableNo: t.table_no,
                    capacity: t.capacity,
                    status: t.status as RestaurantTable["status"],
                    location: t.location ?? undefined,
                    isActive: t.is_active,
                    currentOrderId: order?.id,
                  };
                })
              );
            }

            // Map and update order in local state
            const mappedOrder: TableOrder = {
              id: created.id,
              tableId: created.table_id,
              tableNo: tables.find((t) => t.id === tableId)?.tableNo || tableId,
              items: created.items.map((i) => {
                // Look up product to get vatRate
                const product = items.find((p) => p.id === String(i.product_id));
                return {
                  itemId: String(i.product_id), // Use product_id from backend
                  itemName: i.item_name,
                  quantity: i.quantity,
                  unitPrice: i.unit_price,
                  discount: i.discount,
                  total: i.total,
                  notes: i.notes ?? undefined,
                  available: 9999,
                  vatRate: product?.vatRate,
                };
              }),
              subtotal: created.subtotal,
              vatAmount: created.vat_amount,
              serviceCharge: created.service_charge,
              discount: created.discount,
              total: created.total,
              status: created.status as TableOrder["status"],
              createdAt: created.created_at,
              updatedAt: created.updated_at,
              kots: [],
            };
            setTableOrders((prev) => {
              const idx = prev.findIndex((o) => o.id === mappedOrder.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = mappedOrder;
                return next;
              }
              return [mappedOrder, ...prev];
            });
          } catch (err: any) {
            console.error("Failed to save table order", err);
            throw new Error(err?.message || "Failed to save table order");
          }
        } else {
          // Fallback for offline mode
          await delay(150);
          const { kotItems } = opts ?? {};
          let orderId: string | undefined;
          setTableOrders((prev) => {
            const existingOrderIdx = prev.findIndex((o) => o.tableId === tableId && o.status !== "completed");
            // In Bangladesh, prices are VAT-inclusive, but backend expects VAT-exclusive subtotal
            const subtotalInclusive = orderItems.reduce((s, i) => s + i.total, 0);
            // Calculate VAT from each item's VAT rate
            // Extract VAT from VAT-inclusive prices: vat = (price * qty) * (vatRate / (100 + vatRate))
            const vatAmount = orderItems.reduce((sum, item) => {
              const cartItem = items.find((ci) => ci.id === item.itemId);
              const vatRate = (cartItem as any)?.vatRate;
              if (!vatRate || vatRate === 0) return sum;
              const itemVat = (item.total * vatRate) / (100 + vatRate);
              return sum + itemVat;
            }, 0);
            // Subtotal without VAT (for backend accounting)
            const subtotal = subtotalInclusive - vatAmount;
            // Total = Subtotal (VAT-exclusive) + VAT
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
        }
      },

      ensureTableSession: async (tableId) => {
        if (user?.token) {
          try {
            // Check for existing order in local state first
            const existing = tableOrders.find((o) => o.tableId === tableId && o.status !== "completed");
            if (existing) {
              // Update table status
              await tablesApi.update(tableId, { status: "occupied" });
              const refreshedTables = await tablesApi.list();
              setTables(
                refreshedTables.map((t) => ({
                  id: t.id,
                  tableNo: t.table_no,
                  capacity: t.capacity,
                  status: t.status as RestaurantTable["status"],
                  location: t.location ?? undefined,
                  isActive: t.is_active,
                  currentOrderId: t.id === tableId ? existing.id : undefined,
                }))
              );
              return existing;
            }

            // No existing order - don't create empty order
            // Order will be created when user adds items via saveTableOrder
            // Return a temporary order object for UI purposes
            const table = tables.find((t) => t.id === tableId);
            const tempOrder: TableOrder = {
              id: `temp-${tableId}`,
              tableId,
              tableNo: table?.tableNo || tableId,
              items: [],
              subtotal: 0,
              vatAmount: 0,
              serviceCharge: 0,
              discount: 0,
              total: 0,
              status: "active",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              kots: [],
            };
            return tempOrder;
          } catch (err: any) {
            console.error("Failed to ensure table session", err);
            throw new Error(err?.message || "Failed to ensure table session");
          }
        } else {
          // Fallback for offline mode
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
        }
      },

      markTableBilling: async (tableId) => {
        if (user?.token) {
          try {
            // Update table status via API
            await tablesApi.update(tableId, { status: "billing" });
            
            // Update local state
            setTableOrders((prev) =>
              prev.map((o) => (o.tableId === tableId && o.status !== "completed" ? { ...o, status: "billing" } : o))
            );
            
            // Refresh tables from backend
            const refreshedTables = await tablesApi.list();
            setTables(
              refreshedTables.map((t) => ({
                id: t.id,
                tableNo: t.table_no,
                capacity: t.capacity,
                status: t.status as RestaurantTable["status"],
                location: t.location ?? undefined,
                isActive: t.is_active,
                currentOrderId: undefined,
              }))
            );
          } catch (err: any) {
            console.error("Failed to mark table billing", err);
            throw new Error(err?.message || "Failed to mark table billing");
          }
        } else {
          // Fallback for offline mode
          await delay(80);
          setTableOrders((prev) =>
            prev.map((o) => (o.tableId === tableId && o.status !== "completed" ? { ...o, status: "billing" } : o))
          );
          setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status: "billing" } : t)));
        }
      },

      finalizeTableBill: async (tableId, paymentMethod, options = {}) => {
        if (user?.token) {
          try {
            const table = tables.find((t) => t.id === tableId);
            const order = table?.currentOrderId
              ? tableOrders.find((o) => o.id === table.currentOrderId)
              : tableOrders.find((o) => o.tableId === tableId && o.status !== "completed");
            if (!table || !order) throw new Error("No active order for this table");
            if (order.status === "completed") throw new Error("Bill already completed");

            // Use provided discount/service charge or fall back to order values
            const discount = options.discount !== undefined ? options.discount : order.discount;
            const serviceCharge =
              options.serviceCharge !== undefined
                ? options.serviceCharge
                : order.serviceCharge;

            // Finalize via API
            const result = await tablesApi.finalizeBill(tableId, order.id, {
              payment_method: paymentMethod,
              service_charge: serviceCharge,
              discount: discount,
            });

            // Update local state
            const sale: Sale = {
              id: result.sale.id,
              createdAt: result.sale.created_at,
              items: result.sale.items.map((i) => ({
                itemId: i.item_id,
                itemName: i.item_name,
                quantity: i.quantity,
                unitPrice: i.unit_price,
                discount: i.discount,
                total: i.total,
                notes: i.notes ?? undefined,
              })),
              subtotal: result.sale.subtotal,
              vatAmount: result.sale.vat_amount,
              serviceCharge: result.sale.service_charge,
              discount: result.sale.discount,
              total: result.sale.total,
              paymentMethod: result.sale.payment_method,
              orderType: result.sale.order_type,
              tableNo: result.sale.table_no ?? undefined,
              status: result.sale.status,
            };
            setSales((prev) => [sale, ...prev]);

            // Update tables and orders
            setTables((prev) =>
              prev.map((t) =>
                t.id === tableId
                  ? {
                      ...t,
                      status: "empty",
                      currentOrderId: undefined,
                    }
                  : t
              )
            );
            setTableOrders((prev) =>
              prev.map((o) =>
                o.id === order.id
                  ? {
                      ...o,
                      status: "completed",
                      updatedAt: result.order.updated_at,
                    }
                  : o
              )
            );

            // Refresh items to reflect stock changes
            try {
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
            } catch (err) {
              console.error("Failed to refresh items after sale", err);
            }

            return sale;
          } catch (err: any) {
            console.error("Failed to finalize table bill", err);
            throw new Error(err?.message || "Failed to finalize table bill");
          }
        } else {
          // Fallback for offline mode
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
        }
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
        if (user?.token) {
          try {
            const paymentInput = {
              staff_id: input.staffId,
              amount: input.amount,
              type: input.type,
              date: input.date || todayISO(),
              description: input.description,
              reference_no: undefined,
            };
            const created = await staffApi.createPayment(paymentInput);
            // Map API response to frontend format
            const mapped: StaffPayment = {
              id: created.id,
              staffId: created.staff_id,
              amount: Number(created.amount),
              type: created.type as StaffPayment["type"],
              description: created.description ?? created.type,
              date: created.date,
              createdAt: created.created_at,
            };
            setStaffPayments((prev) => [mapped, ...prev]);
            return mapped;
          } catch (err: any) {
            console.error("Failed to create staff payment", err);
            throw new Error(err?.message || "Failed to create staff payment");
          }
        }
        // Fallback for offline mode
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
        if (user?.token) {
          try {
            const staffInput = {
              name: input.name,
              name_bn: input.nameBn,
              phone: input.phone,
              email: input.email,
              role: input.role,
              salary: input.salary,
              joining_date: input.joiningDate || todayISO(),
              address: input.address,
              emergency_contact: input.emergencyContact,
              is_active: input.isActive ?? true,
            };
            const created = await staffApi.create(staffInput);
            // Map API response to frontend format
            const mapped: Staff = {
              id: created.id,
              name: created.name,
              nameBn: created.name_bn ?? undefined,
              phone: created.phone,
              email: created.email ?? undefined,
              role: created.role as Staff["role"],
              salary: Number(created.salary),
              joiningDate: created.joining_date ?? todayISO(),
              isActive: created.is_active,
              emergencyContact: created.emergency_contact ?? undefined,
              address: created.address ?? undefined,
            };
            setStaff((prev) => [mapped, ...prev]);
            return mapped;
          } catch (err: any) {
            console.error("Failed to create staff", err);
            throw new Error(err?.message || "Failed to create staff");
          }
        }
        // Fallback for offline mode
        await delay(200);
        const created: Staff = { ...input, id: newId("STF") };
        setStaff((prev) => [created, ...prev]);
        return created;
      },

      updateStaff: async (staffId, updates) => {
        if (user?.token) {
          try {
            const updateInput: any = {};
            if (updates.name !== undefined) updateInput.name = updates.name;
            if (updates.nameBn !== undefined) updateInput.name_bn = updates.nameBn;
            if (updates.phone !== undefined) updateInput.phone = updates.phone;
            if (updates.email !== undefined) updateInput.email = updates.email;
            if (updates.role !== undefined) updateInput.role = updates.role;
            if (updates.salary !== undefined) updateInput.salary = updates.salary;
            if (updates.joiningDate !== undefined) updateInput.joining_date = updates.joiningDate;
            if (updates.address !== undefined) updateInput.address = updates.address;
            if (updates.emergencyContact !== undefined) updateInput.emergency_contact = updates.emergencyContact;
            if (updates.isActive !== undefined) updateInput.is_active = updates.isActive;
            const updated = await staffApi.update(staffId, updateInput);
            // Map API response to frontend format and update local state
            const mapped: Staff = {
              id: updated.id,
              name: updated.name,
              nameBn: updated.name_bn ?? undefined,
              phone: updated.phone,
              email: updated.email ?? undefined,
              role: updated.role as Staff["role"],
              salary: Number(updated.salary),
              joiningDate: updated.joining_date ?? todayISO(),
              isActive: updated.is_active,
              emergencyContact: updated.emergency_contact ?? undefined,
              address: updated.address ?? undefined,
            };
            setStaff((prev) => prev.map((s) => (s.id === staffId ? mapped : s)));
          } catch (err: any) {
            console.error("Failed to update staff", err);
            throw new Error(err?.message || "Failed to update staff");
          }
        } else {
          // Fallback for offline mode
          await delay(150);
          setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, ...updates } : s)));
        }
      },

      updateSaleTotalWithAudit: async (saleId, { newTotal, editedBy, reason }) => {
        try {
          // Call the real API
          const updatedSale = await salesApi.updateTotal(saleId, {
            new_total: newTotal,
            reason,
          });

          // Convert API response to frontend Sale type
          const sale: Sale = {
            id: updatedSale.id,
            createdAt: updatedSale.created_at,
            items: updatedSale.items.map((item) => ({
              itemId: item.item_id,
              itemName: item.item_name,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              discount: item.discount,
              total: item.total,
              notes: item.notes || undefined,
            })),
            subtotal: updatedSale.subtotal,
            vatAmount: updatedSale.vat_amount,
            serviceCharge: updatedSale.service_charge,
            discount: updatedSale.discount,
            total: updatedSale.total,
            paymentMethod: updatedSale.payment_method as Sale["paymentMethod"],
            customerId: updatedSale.customer_name || undefined,
            customerName: updatedSale.customer_name || undefined,
            customerPhone: updatedSale.customer_phone || undefined,
            deliveryAddress: updatedSale.delivery_address || undefined,
            deliveryNotes: updatedSale.delivery_notes || undefined,
            tableNo: updatedSale.table_no || undefined,
            orderType: updatedSale.order_type as Sale["orderType"],
            status: updatedSale.status as Sale["status"],
            editHistory: updatedSale.edit_history?.map((edit) => ({
              id: edit.id,
              editedAt: edit.edited_at,
              editedBy: edit.edited_by,
              previousTotal: edit.previous_total,
              newTotal: edit.new_total,
              reason: edit.reason,
            })),
          };

          // Update local state
          setSales((prev) => prev.map((s) => (s.id === saleId ? sale : s)));
        } catch (error: any) {
          console.error("Failed to update sale total:", error);
          throw new Error(error?.message || "Failed to update sale total");
        }
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
          // Refetch categories to ensure we have the latest data (including item_count)
          try {
            const refreshed = await categoriesApi.list();
            setCategories(
              refreshed.map((c) => ({
                id: c.id,
                name: c.name,
                nameBn: c.name_bn ?? undefined,
                icon: c.icon ?? "🍽️",
                itemCount: c.item_count ?? 0,
              }))
            );
          } catch (err) {
            console.error("Failed to refresh categories, using created category", err);
            // Fallback: add the created category to local state
            const mapped: Category = {
              id: created.id,
              name: created.name,
              nameBn: created.name_bn ?? undefined,
              icon: created.icon ?? "🍽️",
              itemCount: created.item_count ?? input.itemCount ?? 0,
            };
            setCategories((prev) => [mapped, ...prev]);
          }
          // Return the created category
          const mapped: Category = {
            id: created.id,
            name: created.name,
            nameBn: created.name_bn ?? undefined,
            icon: created.icon ?? "🍽️",
            itemCount: created.item_count ?? input.itemCount ?? 0,
          };
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
            // Refetch categories to ensure we have the latest data
            try {
              const refreshed = await categoriesApi.list();
              setCategories(
                refreshed.map((c) => ({
                  id: c.id,
                  name: c.name,
                  nameBn: c.name_bn ?? undefined,
                  icon: c.icon ?? "🍽️",
                  itemCount: c.item_count ?? 0,
                }))
              );
            } catch (err) {
              console.error("Failed to refresh categories, removing from local state", err);
              // Fallback: remove from local state
              setCategories((prev) => prev.filter((c) => c.id !== categoryId));
            }
          } catch (err: any) {
            // Re-throw the error so the caller can handle it (e.g., show toast)
            // The error will have status 409 if category has items
            throw err;
          }
        } else {
          await delay(80);
          setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        }
      },

      completeSale: async (input) => {
        if (user?.token) {
          try {
            // Convert frontend Sale format to API format
            const saleInput = {
              order_type: input.orderType,
              items: input.items.map((i) => ({
                item_id: i.itemId,
                item_name: i.itemName,
                quantity: i.quantity,
                unit_price: i.unitPrice,
                discount: i.discount,
                total: i.total,
                notes: i.notes,
              })),
              subtotal: input.subtotal,
              vat_amount: input.vatAmount,
              service_charge: input.serviceCharge,
              discount: input.discount,
              total: input.total,
              payment_method: input.paymentMethod,
              customer_name: input.customerName,
              customer_phone: input.customerPhone,
              delivery_address: input.deliveryAddress,
              delivery_notes: input.deliveryNotes,
              table_no: input.tableNo,
              table_id: undefined, // Will be set if needed
            };

            const created = await salesApi.create(saleInput);
            
            // Refresh items to get updated stock (backend deducts stock)
            try {
              const refreshedItems = await productsApi.list();
              setItems(
                refreshedItems.map((p) => ({
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
              console.error("Failed to refresh items after sale", err);
            }

            // Map API response to frontend format
            const sale: Sale = {
              id: created.id,
              createdAt: created.created_at,
              items: created.items.map((i) => ({
                itemId: i.item_id,
                itemName: i.item_name,
                quantity: i.quantity,
                unitPrice: i.unit_price,
                discount: i.discount,
                total: i.total,
                notes: i.notes ?? undefined,
              })),
              subtotal: created.subtotal,
              vatAmount: created.vat_amount,
              serviceCharge: created.service_charge,
              discount: created.discount,
              total: created.total,
              paymentMethod: created.payment_method,
              customerName: created.customer_name ?? undefined,
              customerPhone: created.customer_phone ?? undefined,
              deliveryAddress: created.delivery_address ?? undefined,
              deliveryNotes: created.delivery_notes ?? undefined,
              tableNo: created.table_no ?? undefined,
              orderType: created.order_type,
              status: created.status,
            };

            // Add to local state
            setSales((prev) => [sale, ...prev]);
            return sale;
          } catch (err: any) {
            console.error("Failed to create sale", err);
            throw new Error(err?.message || "Failed to complete sale");
          }
        }
        
        // Fallback for offline/demo mode
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

      refreshCategories,
      refreshTables,
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
      refreshCategories,
      refreshTables,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}


