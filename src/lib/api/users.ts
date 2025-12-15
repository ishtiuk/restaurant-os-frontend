import { apiClient } from "@/lib/api";

export type StaffRole = "manager" | "waiter" | "cashier" | "chef";

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  name_bn?: string | null;
  phone: string;
  role: StaffRole;
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
  tenant_id: string;
}

export interface StaffUserCreateInput {
  email: string;
  password: string;
  name: string;
  name_bn?: string;
  phone: string;
  role: StaffRole;
}

export interface StaffUserUpdateInput {
  name?: string;
  name_bn?: string;
  phone?: string;
  role?: StaffRole;
  is_active?: boolean;
}

export const usersApi = {
  async list(): Promise<StaffUser[]> {
    return apiClient.get<StaffUser[]>("/users");
  },
  async create(input: StaffUserCreateInput): Promise<StaffUser> {
    return apiClient.post<StaffUser>("/users", input);
  },
  async update(userId: string, input: StaffUserUpdateInput): Promise<StaffUser> {
    return apiClient.patch<StaffUser>(`/users/${userId}`, input);
  },
  async remove(userId: string): Promise<void> {
    await apiClient.delete<void>(`/users/${userId}`);
  },
  async getPermissions(userId: string): Promise<Record<string, boolean>> {
    return apiClient.get<Record<string, boolean>>(`/users/${userId}/permissions`);
  },
  async updatePermissions(userId: string, permissions: Record<string, boolean>): Promise<Record<string, boolean>> {
    return apiClient.patch<Record<string, boolean>>(`/users/${userId}/permissions`, { permissions });
  },
};


