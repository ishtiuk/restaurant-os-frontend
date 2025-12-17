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

export interface SaleEditDto {
  id: string;
  previous_total: number;
  new_total: number;
  reason: string;
  edited_at: string;
  edited_by: string;
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
  payment_method: "cash" | "card" | "online" | "rocket" | "split";
  created_at: string;
  items: SaleItemDto[];
  edit_history?: SaleEditDto[];
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
  payment_method: "cash" | "card" | "online" | "rocket" | "split";
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  delivery_notes?: string;
  table_no?: string;
  table_id?: string;
}

export interface SaleEditInput {
  new_total: number;
  reason: string;
}

export interface SalesListResponse {
  data: SaleDto[];
  total: number;
}

export const salesApi = {
  async list(limit?: number, offset?: number): Promise<SalesListResponse> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (offset) params.append("offset", String(offset));
    const query = params.toString();
    
    // Use fetch directly to access response headers
    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8001/api";
    const url = `${API_BASE_URL}/sales${query ? `?${query}` : ""}`;
    const token = localStorage.getItem("restaurant-os-token");
    const tenantId = localStorage.getItem("restaurant-os-tenant-id");
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (tenantId) headers["X-Tenant-ID"] = tenantId;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to fetch sales" }));
      throw new Error(error.detail || "Failed to fetch sales");
    }
    
    const data: SaleDto[] = await response.json();
    const total = parseInt(response.headers.get("X-Total-Count") || "0", 10);
    
    return { data, total };
  },
  create(input: SaleCreateInput): Promise<SaleDto> {
    return apiClient.post("/sales", input);
  },
  get(id: string): Promise<SaleDto> {
    return apiClient.get(`/sales/${id}`);
  },
  updateTotal(id: string, input: SaleEditInput): Promise<SaleDto> {
    return apiClient.patch(`/sales/${id}/total`, input);
  },
};

