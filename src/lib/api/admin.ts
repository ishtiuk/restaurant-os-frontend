import { apiClient } from "@/lib/api";

export type TenantPlan = "starter" | "professional" | "enterprise";

export interface AdminTenant {
  id: string;
  name: string;
  name_bn?: string | null;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TenantCreateInput {
  name: string;
  name_bn?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface TenantUpdateInput {
  name?: string;
  name_bn?: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  name_bn?: string | null;
  phone: string;
  role: string; // "owner" or "manager" from backend
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login?: string | null;
  tenant_id: string;
}

export interface AdminUserCreateInput {
  tenant_id: string;
  email: string;
  password: string;
  name: string;
  name_bn?: string;
  phone?: string; // Optional - backend will use default if not provided
  role: "admin" | "manager"; // frontend notion: "admin" maps to owner on backend
}

export interface AdminUserUpdateInput {
  email?: string;
  name?: string;
  name_bn?: string;
  phone?: string;
  role?: "admin" | "manager";
  is_active?: boolean;
}

export const adminApi = {
  // Tenants
  async listTenants(): Promise<AdminTenant[]> {
    return apiClient.get<AdminTenant[]>("/admin/tenants");
  },
  async createTenant(input: TenantCreateInput): Promise<AdminTenant> {
    return apiClient.post<AdminTenant>("/admin/tenants", input);
  },
  async updateTenant(id: string, input: TenantUpdateInput): Promise<AdminTenant> {
    return apiClient.patch<AdminTenant>(`/admin/tenants/${id}`, input);
  },

  // Admin users
  async listUsers(): Promise<AdminUser[]> {
    return apiClient.get<AdminUser[]>("/admin/users");
  },
  async createUser(input: AdminUserCreateInput): Promise<AdminUser> {
    return apiClient.post<AdminUser>("/admin/users", input);
  },
  async updateUser(id: string, input: AdminUserUpdateInput): Promise<AdminUser> {
    return apiClient.patch<AdminUser>(`/admin/users/${id}`, input);
  },
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete<void>(`/admin/users/${id}`);
  },
};


