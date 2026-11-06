import { apiClient } from "./api-client";
import {
  Envelope,
  Offer,
  OfferStats,
  CreateOfferPayload,
  UpdateOfferPayload,
} from "../types";

export interface ListAdminOffersResponse {
  offers: Offer[];
  stats: OfferStats;
}

export interface ListAdminOffersParams {
  status?: string;
  search?: string;
}

export const offerService = {
  // Public active offers
  async getActiveOffers(): Promise<Envelope<Offer[]>> {
    const response = await apiClient.get<Envelope<Offer[]>>("/api/v1/offers/active");
    return response.data;
  },

  // Admin: list all offers with stats & filters
  async getAdminOffers(params?: ListAdminOffersParams): Promise<Envelope<ListAdminOffersResponse>> {
    const response = await apiClient.get<Envelope<ListAdminOffersResponse>>(
      "/api/v1/admin/offers",
      { params },
    );
    return response.data;
  },

  // Admin: get single offer
  async getAdminOfferById(id: string): Promise<Envelope<Offer>> {
    const response = await apiClient.get<Envelope<Offer>>(`/api/v1/admin/offers/${id}`);
    return response.data;
  },

  // Admin: create offer
  async createOffer(payload: CreateOfferPayload): Promise<Envelope<Offer>> {
    const response = await apiClient.post<Envelope<Offer>>("/api/v1/admin/offers", payload);
    return response.data;
  },

  // Admin: update offer
  async updateOffer(id: string, payload: UpdateOfferPayload): Promise<Envelope<Offer>> {
    const response = await apiClient.patch<Envelope<Offer>>(`/api/v1/admin/offers/${id}`, payload);
    return response.data;
  },

  // Admin: quick update status ("active" | "disabled" | "cancelled" | "draft")
  async updateOfferStatus(id: string, status: "active" | "disabled" | "cancelled" | "draft"): Promise<Envelope<Offer>> {
    const response = await apiClient.patch<Envelope<Offer>>(`/api/v1/admin/offers/${id}/status`, { status });
    return response.data;
  },

  // Admin: delete offer
  async deleteOffer(id: string): Promise<Envelope<boolean>> {
    const response = await apiClient.delete<Envelope<boolean>>(`/api/v1/admin/offers/${id}`);
    return response.data;
  },
};
