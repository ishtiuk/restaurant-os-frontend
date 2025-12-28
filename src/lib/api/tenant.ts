import { apiClient } from "@/lib/api";

export interface TenantSettingsDto {
  id: string;
  name: string;
  name_bn?: string | null;
  slug: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  vat_registration_no?: string | null;
  trade_license?: string | null;
  invoice_prefix?: string | null;
  paper_size?: string | null;
  footer_text?: string | null;
  timezone: string; // IANA timezone (e.g., Asia/Dhaka, America/New_York)
  is_active: boolean;
  owner_email?: string | null; // Owner email for void notifications
  void_email_notifications_enabled: boolean; // Enable/disable void email notifications
  created_at: string;
}

export interface TenantSettingsUpdateInput {
  name?: string;
  name_bn?: string;
  email?: string;
  phone?: string;
  address?: string;
  vat_registration_no?: string;
  trade_license?: string;
  invoice_prefix?: string;
  paper_size?: "thermal" | "thermal58" | "a4";
  footer_text?: string;
  timezone?: string; // IANA timezone (e.g., Asia/Dhaka, America/New_York)
  owner_email?: string; // Owner email for void notifications
  void_email_notifications_enabled?: boolean; // Enable/disable void email notifications
}

export const tenantApi = {
  getSettings(): Promise<TenantSettingsDto> {
    return apiClient.get("/tenant/settings");
  },
  updateSettings(input: TenantSettingsUpdateInput): Promise<TenantSettingsDto> {
    return apiClient.patch("/tenant/settings", input);
  },
};

