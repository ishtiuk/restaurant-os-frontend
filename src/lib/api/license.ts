import { apiClient } from "@/lib/api";

export interface LicenseStatus {
  is_valid: boolean;
  expires_at: string | null;
  days_remaining: number;
  message: string;
}

export interface LicenseActivateRequest {
  activation_key: string;
  activated_by?: string;
}

export interface LicenseActivateResponse {
  success: boolean;
  message: string;
  expires_at: string | null;
  days_remaining: number | null;
}

export const licenseApi = {
  async checkStatus(tenantId: string): Promise<LicenseStatus> {
    return apiClient.post<LicenseStatus>("/license/status", { tenant_id: tenantId });
  },

  async activate(activationKey: string, activatedBy?: string): Promise<LicenseActivateResponse> {
    return apiClient.post<LicenseActivateResponse>("/license/activate", {
      activation_key: activationKey,
      activated_by: activatedBy,
    });
  },
};

