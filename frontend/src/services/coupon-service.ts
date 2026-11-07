import { apiClient } from "./api-client";
import {
  Envelope,
  Coupon,
  CouponStats,
  CreateCouponPayload,
  UpdateCouponPayload,
  ValidateCouponResult,
} from "../types";

export interface ListAdminCouponsResponse {
  coupons: Coupon[];
  stats: CouponStats;
}

export interface ListAdminCouponsParams {
  status?: string;
  search?: string;
}

export const couponService = {
  // Public / Customer: validate coupon
  async validateCoupon(code: string, subtotal: number): Promise<Envelope<ValidateCouponResult>> {
    const response = await apiClient.post<Envelope<ValidateCouponResult>>("/api/v1/coupons/validate", {
      code,
      subtotal,
    });
    return response.data;
  },

  // Admin: list all coupons with stats & filters
  async getAdminCoupons(params?: ListAdminCouponsParams): Promise<Envelope<ListAdminCouponsResponse>> {
    const response = await apiClient.get<Envelope<ListAdminCouponsResponse>>(
      "/api/v1/admin/coupons",
      { params },
    );
    return response.data;
  },

  // Admin: get single coupon
  async getAdminCouponById(id: string): Promise<Envelope<Coupon>> {
    const response = await apiClient.get<Envelope<Coupon>>(`/api/v1/admin/coupons/${id}`);
    return response.data;
  },

  // Admin: create coupon
  async createCoupon(payload: CreateCouponPayload): Promise<Envelope<Coupon>> {
    const response = await apiClient.post<Envelope<Coupon>>("/api/v1/admin/coupons", payload);
    return response.data;
  },

  // Admin: update coupon
  async updateCoupon(id: string, payload: UpdateCouponPayload): Promise<Envelope<Coupon>> {
    const response = await apiClient.patch<Envelope<Coupon>>(`/api/v1/admin/coupons/${id}`, payload);
    return response.data;
  },

  // Admin: toggle status
  async toggleCouponStatus(id: string): Promise<Envelope<Coupon>> {
    const response = await apiClient.patch<Envelope<Coupon>>(`/api/v1/admin/coupons/${id}/toggle-status`);
    return response.data;
  },

  // Admin: delete coupon
  async deleteCoupon(id: string): Promise<Envelope<boolean>> {
    const response = await apiClient.delete<Envelope<boolean>>(`/api/v1/admin/coupons/${id}`);
    return response.data;
  },
};
