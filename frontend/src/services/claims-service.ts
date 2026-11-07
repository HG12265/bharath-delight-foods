import { apiClient } from "./api-client";
import { Envelope, DamageClaim, CreateClaimPayload } from "../types";

export interface AdminClaimsResponse {
  claims: DamageClaim[];
  total: number;
  stats: {
    total: number;
    pending: number;
    approved: number;
    resolved: number;
  };
}

export const claimsService = {
  async createClaim(payload: CreateClaimPayload): Promise<Envelope<DamageClaim>> {
    const response = await apiClient.post<Envelope<DamageClaim>>("/api/v1/claims", payload);
    return response.data;
  },

  async getMyClaims(): Promise<Envelope<DamageClaim[]>> {
    const response = await apiClient.get<Envelope<DamageClaim[]>>("/api/v1/claims/my-claims");
    return response.data;
  },

  async getClaimsByOrder(orderId: string): Promise<Envelope<DamageClaim[]>> {
    const response = await apiClient.get<Envelope<DamageClaim[]>>(`/api/v1/claims/order/${orderId}`);
    return response.data;
  },

  async getAdminClaims(params?: { status?: string; limit?: number; skip?: number }): Promise<Envelope<AdminClaimsResponse>> {
    const response = await apiClient.get<Envelope<AdminClaimsResponse>>("/api/v1/claims/admin", { params });
    return response.data;
  },

  async updateClaimStatus(
    id: string,
    payload: { status: string; admin_notes?: string; resolution_details?: any }
  ): Promise<Envelope<DamageClaim>> {
    const response = await apiClient.patch<Envelope<DamageClaim>>(`/api/v1/claims/admin/${id}/status`, payload);
    return response.data;
  },
};

export default claimsService;

