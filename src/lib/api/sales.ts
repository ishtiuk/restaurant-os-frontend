import { apiClient } from "@/lib/api";

export interface SaleItemDto {
  item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  notes?: string | null;
}

export interface SaleDto {
  id: string;
  order_type: "takeaway" | "delivery" | "dine-in";
  status: "completed" | "refunded" | "pending";
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  delivery_notes?: string | null;
  table_no?: string | null;
  table_id?: string | null;
  subtotal: number;
  vat_amount: number;
  service_charge: number;
  discount: number;
  total: number;
  payment_method: "cash" | "card" | "bkash" | "nagad" | "rocket" | "split";
  created_at: string;
  items: SaleItemDto[];
}

export interface SaleCreateInput {
  order_type: "takeaway" | "delivery" | "dine-in";
  items: Array<{
    item_id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
    notes?: string;
  }>;
  subtotal: number;
  vat_amount: number;
  service_charge: number;
  discount: number;
  total: number;
  payment_method: "cash" | "card" | "bkash" | "nagad" | "rocket" | "split";
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_notes?: string;
  table_no?: string;
  table_id?: string;
}

export const salesApi = {
  list(limit?: number, offset?: number): Promise<SaleDto[]> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (offset) params.append("offset", String(offset));
    const query = params.toString();
    return apiClient.get(`/sales${query ? `?${query}` : ""}`);
  },
  create(input: SaleCreateInput): Promise<SaleDto> {
    return apiClient.post("/sales", input);
  },
  get(id: string): Promise<SaleDto> {
    return apiClient.get(`/sales/${id}`);
  },
};

