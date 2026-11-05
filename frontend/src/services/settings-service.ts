import { apiClient } from "./api-client";
import { Envelope, SettingsPublic, SettingsAdmin } from "../types";

export interface SettingsUpdatePayload {
  upi_id?: string;
  tax_percentage?: number;
  shipping_fee?: number;
  free_shipping_threshold?: number;
  support_contact?: string;
  fssai_number?: string | null;
  gst_number?: string | null;
  brand_name?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  business_address?: string | null;
  payment_display_name?: string | null;
  upi_instructions?: string | null;
  public_support_email?: string | null;
  public_support_phone?: string | null;
  working_hours?: string | null;
}

export const settingsService = {
  async getPublicSettings(): Promise<Envelope<SettingsPublic>> {
    const response = await apiClient.get<Envelope<SettingsPublic>>("/api/v1/settings/public");
    return response.data;
  },

  async getAdminSettings(): Promise<Envelope<SettingsAdmin>> {
    const response = await apiClient.get<Envelope<SettingsAdmin>>("/api/v1/admin/settings");
    return response.data;
  },

  async updateAdminSettings(payload: SettingsUpdatePayload): Promise<Envelope<SettingsAdmin>> {
    const response = await apiClient.patch<Envelope<SettingsAdmin>>("/api/v1/admin/settings", payload);
    return response.data;
  },
};

export default settingsService;
