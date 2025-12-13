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
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier' | 'staff';

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
