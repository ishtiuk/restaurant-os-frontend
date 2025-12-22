import { apiClient } from "@/lib/api";

export interface StaffDto {
  id: string;
  name: string;
  name_bn?: string | null;
  phone: string;
  email?: string | null;
  role: string;
  salary: number;
  joining_date?: string | null; // ISO date string
  address?: string | null;
  emergency_contact?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffCreateInput {
  name: string;
  name_bn?: string;
  phone: string;
  email?: string;
  role: string;
  salary: number;
  joining_date?: string; // ISO date string (YYYY-MM-DD)
  address?: string;
  emergency_contact?: string;
  is_active?: boolean;
}

export interface StaffUpdateInput {
  name?: string;
  name_bn?: string;
  phone?: string;
  email?: string;
  role?: string;
  salary?: number;
  joining_date?: string; // ISO date string (YYYY-MM-DD)
  address?: string;
  emergency_contact?: string;
  is_active?: boolean;
}

export interface StaffPaymentDto {
  id: string;
  staff_id: string;
  amount: number;
  type: "salary" | "advance" | "bonus" | "deduction";
  payment_method?: string | null;
  date: string; // ISO date string
  description?: string | null;
  reference_no?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface StaffPaymentCreateInput {
  staff_id: string;
  amount: number;
  type: "salary" | "advance" | "bonus" | "deduction";
  payment_method?: "cash" | "bank_transfer" | "check" | "online";
  date?: string; // ISO date string (YYYY-MM-DD), defaults to today
  description?: string;
  reference_no?: string;
}

export const staffApi = {
  list(params?: {
    role?: string;
    is_active?: boolean;
  }): Promise<StaffDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.append("role", params.role);
    if (params?.is_active !== undefined) searchParams.append("is_active", String(params.is_active));
    const query = searchParams.toString();
    return apiClient.get<StaffDto[]>(`/staff${query ? `?${query}` : ""}`);
  },

  get(id: string): Promise<StaffDto> {
    return apiClient.get<StaffDto>(`/staff/${id}`);
  },

  create(input: StaffCreateInput): Promise<StaffDto> {
    return apiClient.post<StaffDto>("/staff", input);
  },

  update(id: string, input: StaffUpdateInput): Promise<StaffDto> {
    return apiClient.patch<StaffDto>(`/staff/${id}`, input);
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/staff/${id}`);
  },

  // Payment methods
  listPayments(params?: {
    staff_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<StaffPaymentDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.staff_id) searchParams.append("staff_id", params.staff_id);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));
    const query = searchParams.toString();
    return apiClient.get<StaffPaymentDto[]>(`/staff/payments${query ? `?${query}` : ""}`);
  },

  getPayment(id: string): Promise<StaffPaymentDto> {
    return apiClient.get<StaffPaymentDto>(`/staff/payments/${id}`);
  },

  createPayment(input: StaffPaymentCreateInput): Promise<StaffPaymentDto> {
    return apiClient.post<StaffPaymentDto>("/staff/payments", input);
  },

  deletePayment(paymentId: string): Promise<void> {
    return apiClient.delete(`/staff/payments/${paymentId}`);
  },
};

