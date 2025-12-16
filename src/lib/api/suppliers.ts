import { apiClient } from "@/lib/api";

export interface SupplierDto {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contact_person?: string;
  balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierCreateInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contact_person?: string;
  notes?: string;
  is_active?: boolean;
}

export interface SupplierUpdateInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_person?: string;
  notes?: string;
  is_active?: boolean;
}

export interface SupplierPaymentDto {
  id: string;
  supplier_id: string;
  purchase_order_id?: string | null;
  amount: number;
  payment_date: string;
  payment_method?: string | null;
  reference_no?: string | null;
  notes?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface SupplierPaymentCreateInput {
  supplier_id: string;
  purchase_order_id?: string | null;
  amount: number;
  payment_date?: string; // ISO format
  payment_method?: string;
  reference_no?: string;
  notes?: string;
}

export const suppliersApi = {
  list(isActive?: boolean): Promise<SupplierDto[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) {
      params.append("is_active", String(isActive));
    }
    const query = params.toString();
    return apiClient.get<SupplierDto[]>(`/suppliers${query ? `?${query}` : ""}`);
  },

  get(id: string): Promise<SupplierDto> {
    return apiClient.get<SupplierDto>(`/suppliers/${id}`);
  },

  getWithOrders(id: string): Promise<SupplierDto> {
    return apiClient.get<SupplierDto>(`/suppliers/${id}/with-orders`);
  },

  create(input: SupplierCreateInput): Promise<SupplierDto> {
    return apiClient.post<SupplierDto>("/suppliers", input);
  },

  update(id: string, input: SupplierUpdateInput): Promise<SupplierDto> {
    return apiClient.patch<SupplierDto>(`/suppliers/${id}`, input);
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/suppliers/${id}`);
  },

  // Payment methods
  listPayments(params?: { supplier_id?: string; purchase_order_id?: string }): Promise<SupplierPaymentDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.supplier_id) searchParams.append("supplier_id", params.supplier_id);
    if (params?.purchase_order_id) searchParams.append("purchase_order_id", params.purchase_order_id);
    const query = searchParams.toString();
    return apiClient.get<SupplierPaymentDto[]>(`/suppliers/payments${query ? `?${query}` : ""}`);
  },

  createPayment(input: SupplierPaymentCreateInput): Promise<SupplierPaymentDto> {
    return apiClient.post<SupplierPaymentDto>("/suppliers/payments", input);
  },

  deletePayment(paymentId: string): Promise<void> {
    return apiClient.delete(`/suppliers/payments/${paymentId}`);
  },
};

