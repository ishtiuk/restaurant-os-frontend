// Core Types for Restaurant POS System

export interface Item {
  id: string;
  name: string;
  nameBn?: string;
  sku: string;
  categoryId: string;
  price: number;
  cost: number;
  stockQty: number;
  unit: 'pcs' | 'plate' | 'bowl' | 'bottle' | 'kg' | 'litre';
  imageUrl?: string;
  isActive: boolean;
  vatRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameBn?: string;
  icon?: string;
  itemCount: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dueBalance: number;
  createdAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  type: 'purchase' | 'payment';
  amount: number;
  description: string;
  invoiceNo?: string;
  date: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  invoiceNo?: string;
  date: string;
  status: 'pending' | 'received' | 'cancelled';
  items: PurchaseOrderItem[];
  total: number;
  createdAt: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Sale {
  id: string;
  createdAt: string;
  items: SaleItem[];
  subtotal: number;
  vatAmount: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerId?: string;
  customerName?: string;
  tableNo?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'completed' | 'refunded' | 'pending';
  editHistory?: SaleEdit[];
}

export interface SaleEdit {
  id: string;
  editedAt: string;
  editedBy: string;
  previousTotal: number;
  newTotal: number;
  reason: string;
}

export interface SaleItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'bkash' | 'nagad' | 'rocket' | 'split';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalPurchases: number;
  loyaltyPoints: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  nameBn?: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  pin?: string; // 4-digit PIN for quick login
}

export type UserRole = 'owner' | 'manager' | 'waiter' | 'cashier' | 'chef' | 'admin';

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  lowStockItems: number;
  pendingPurchases: number;
  topItems: { name: string; quantity: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number }[];
  salesByPayment: { method: string; amount: number }[];
}

export interface CartItem extends SaleItem {
  available: number;
}

export interface KitchenTicket {
  id: string;
  items: CartItem[];
  createdAt: string;
}

// Table Management
export interface RestaurantTable {
  id: string;
  tableNo: string;
  capacity: number;
  status: 'empty' | 'occupied' | 'reserved' | 'billing';
  currentOrderId?: string;
  currentOrder?: TableOrder;
}

export interface TableOrder {
  id: string;
  tableId: string;
  tableNo: string;
  items: CartItem[];
  subtotal: number;
  vatAmount: number;
  serviceCharge: number;
  discount: number;
  total: number;
  status: 'active' | 'billing' | 'completed';
  createdAt: string;
  updatedAt: string;
  kots?: KitchenTicket[];
}

// Staff & Attendance
export interface Staff {
  id: string;
  name: string;
  nameBn?: string;
  phone: string;
  email?: string;
  role: StaffRole;
  salary: number;
  joiningDate: string;
  isActive: boolean;
  emergencyContact?: string;
  address?: string;
}

export type StaffRole = 'chef' | 'waiter' | 'cashier' | 'cleaner' | 'manager' | 'delivery';

export interface StaffPayment {
  id: string;
  staffId: string;
  amount: number;
  type: 'salary' | 'advance' | 'bonus' | 'deduction';
  description: string;
  date: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  staffId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'leave';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

// VAT Management
export interface VatEntry {
  id: string;
  type: 'sales' | 'purchase' | 'service';
  amount: number;
  vatRate: number;
  vatAmount: number;
  description: string;
  invoiceNo?: string;
  date: string;
  createdAt: string;
}

// Expense Management
export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  date: string;
  receipt?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  nameBn?: string;
  icon?: string;
  budget?: number;
}
