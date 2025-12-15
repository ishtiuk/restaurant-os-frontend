import { apiClient } from "@/lib/api";

export interface TableDto {
  id: string;
  table_no: string;
  capacity: number;
  status: "empty" | "occupied" | "reserved" | "billing";
  location?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItemDto {
  id: string;
  product_id: number; // Product ID for frontend mapping
  item_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  notes?: string | null;
  quantity_sent: number;
  created_at: string;
  updated_at: string;
}

export interface TableOrderDto {
  id: string;
  table_id: string;
  status: "active" | "billing" | "completed";
  subtotal: number;
  vat_amount: number;
  service_charge: number;
  discount: number;
  total: number;
  created_at: string;
  updated_at: string;
  items: OrderItemDto[];
}

export interface KOTItemDto {
  id: string;
  item_name: string;
  quantity: number;
  notes?: string | null;
  created_at: string;
}

export interface KOTDto {
  id: string;
  order_id: string;
  kot_number: number;
  status: string;
  created_at: string;
  items: KOTItemDto[];
}

export interface TableCreateInput {
  table_no: string;
  capacity?: number;
  location?: string;
  is_active?: boolean;
}

export interface TableUpdateInput {
  table_no?: string;
  capacity?: number;
  location?: string;
  status?: "empty" | "occupied" | "reserved" | "billing";
  is_active?: boolean;
}

export interface OrderItemCreateInput {
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  total: number;
  notes?: string;
}

export interface TableOrderCreateInput {
  table_id: string;
  items: OrderItemCreateInput[];
  subtotal: number;
  vat_amount?: number;
  service_charge?: number;
  discount?: number;
  total: number;
}

export interface KOTItemCreateInput {
  item_id: string;
  item_name: string;
  quantity: number;
  notes?: string;
  order_item_id?: string;
}

export interface KOTCreateInput {
  order_id: string;
  items: KOTItemCreateInput[];
}

export interface FinalizeBillInput {
  payment_method: "cash" | "card" | "bkash" | "nagad" | "rocket" | "split";
  service_charge?: number;
  discount?: number;
}

export const tablesApi = {
  list(): Promise<TableDto[]> {
    return apiClient.get("/tables");
  },
  create(input: TableCreateInput): Promise<TableDto> {
    return apiClient.post("/tables", input);
  },
  get(id: string): Promise<TableDto> {
    return apiClient.get(`/tables/${id}`);
  },
  update(id: string, input: TableUpdateInput): Promise<TableDto> {
    return apiClient.patch(`/tables/${id}`, input);
  },
  createOrder(input: TableOrderCreateInput): Promise<TableOrderDto> {
    return apiClient.post("/tables/orders", input);
  },
  listActiveOrders(): Promise<TableOrderDto[]> {
    return apiClient.get("/tables/orders");
  },
  getOrder(orderId: string): Promise<TableOrderDto> {
    return apiClient.get(`/tables/orders/${orderId}`);
  },
  createKOT(tableId: string, input: KOTCreateInput): Promise<KOTDto> {
    return apiClient.post(`/tables/${tableId}/kots`, input);
  },
  finalizeBill(tableId: string, orderId: string, input: FinalizeBillInput): Promise<{
    sale: any;
    order: TableOrderDto;
    table: TableDto;
  }> {
    return apiClient.patch(`/tables/${tableId}/orders/${orderId}/finalize`, input);
  },
};

