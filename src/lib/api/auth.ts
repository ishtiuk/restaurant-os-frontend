import { apiClient, TOKEN_KEY, TENANT_KEY } from "@/lib/api";

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    is_superuser?: boolean;
    last_login?: string;
    tenant_id?: string | null;
    permissions?: Record<string, boolean>;
  };
  expires_in: number;
}

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/login", { email, password });
    // store token + tenant
    apiClient.token = res.token;
    if (res.user?.tenant_id) {
      apiClient.tenantId = res.user.tenant_id;
    }
    return res;
  },
  async me() {
    return apiClient.get<AuthResponse["user"]>("/auth/me");
  },
  logout() {
    apiClient.token = null;
    apiClient.tenantId = null;
  },
};
