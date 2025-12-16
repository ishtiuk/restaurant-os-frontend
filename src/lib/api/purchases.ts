import { apiClient } from "@/lib/api";

export interface PurchaseOrderItemDto {
  id: string;
  product_id: number | null; // Null for non-inventory items
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  received_quantity: number;
  created_at: string;
}

export interface PurchaseOrderDto {
  id: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  status: "pending" | "received" | "cancelled";
  total_amount: number;
  invoice_no?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  items: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemCreateInput {
  product_id: number | null; // Optional: null for non-inventory items (supplies, raw materials, etc.)
  item_name: string; // Required: item name (from product or manual entry)
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PurchaseOrderCreateInput {
  supplier_id: string;
  order_date?: string; // ISO format
  expected_delivery_date?: string; // ISO format
  invoice_no?: string;
  notes?: string;
  items: PurchaseOrderItemCreateInput[];
}

export interface PurchaseOrderUpdateInput {
  expected_delivery_date?: string;
  status?: "pending" | "received" | "cancelled";
  invoice_no?: string;
  notes?: string;
}

export interface ReceivePurchaseOrderItemInput {
  item_id: string;
  received_quantity: number;
}

export interface ReceivePurchaseOrderInput {
  items: ReceivePurchaseOrderItemInput[];
  invoice_no?: string;
}

export const purchasesApi = {
  list(params?: {
    supplier_id?: string;
    status?: "pending" | "received" | "cancelled";
    limit?: number;
    offset?: number;
  }): Promise<PurchaseOrderDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.supplier_id) searchParams.append("supplier_id", params.supplier_id);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));
    const query = searchParams.toString();
    return apiClient.get<PurchaseOrderDto[]>(`/purchases${query ? `?${query}` : ""}`);
  },

  get(id: string): Promise<PurchaseOrderDto> {
    return apiClient.get<PurchaseOrderDto>(`/purchases/${id}`);
  },

  create(input: PurchaseOrderCreateInput): Promise<PurchaseOrderDto> {
    return apiClient.post<PurchaseOrderDto>("/purchases", input);
  },

  update(id: string, input: PurchaseOrderUpdateInput): Promise<PurchaseOrderDto> {
    return apiClient.patch<PurchaseOrderDto>(`/purchases/${id}`, input);
  },

  receive(id: string, input: ReceivePurchaseOrderInput): Promise<PurchaseOrderDto> {
    return apiClient.post<PurchaseOrderDto>(`/purchases/${id}/receive`, input);
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/purchases/${id}`);
  },
};

