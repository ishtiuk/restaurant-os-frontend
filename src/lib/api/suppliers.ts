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
};

