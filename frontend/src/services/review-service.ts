import { apiClient } from "./api-client";
import { Envelope, Review, ReviewModerationDetail, ReviewsSummary } from "../types";

export interface ReviewCreatePayload {
  product_id: string;
  order_id: string;
  rating: number;
  title: string;
  comment: string;
}

export interface ReviewUpdatePayload {
  rating: number;
  title: string;
  comment: string;
}

export interface ProductPageProductDetails {
  name: string;
}

export interface ProductPageRatingsDetails {
  average: number;
  total: number;
}

export interface ProductPageReviewsResponse {
  product: ProductPageProductDetails;
  ratings: ProductPageRatingsDetails;
  reviews: Review[];
}

export interface ListReviewsParams {
  skip?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const reviewService = {
  async submitReview(payload: ReviewCreatePayload): Promise<Envelope<Review>> {
    const response = await apiClient.post<Envelope<Review>>("/api/v1/reviews", payload);
    return response.data;
  },

  async listProductReviews(productId: string): Promise<Envelope<ProductPageReviewsResponse>> {
    const response = await apiClient.get<Envelope<ProductPageReviewsResponse>>(`/api/v1/reviews/product/${productId}`);
    return response.data;
  },

  async updateReview(id: string, payload: ReviewUpdatePayload): Promise<Envelope<Review>> {
    const response = await apiClient.patch<Envelope<Review>>(`/api/v1/reviews/${id}`, payload);
    return response.data;
  },

  async deleteReview(id: string): Promise<Envelope<null>> {
    const response = await apiClient.delete<Envelope<null>>(`/api/v1/reviews/${id}`);
    return response.data;
  },

  async adminListReviews(params?: ListReviewsParams): Promise<Envelope<ReviewModerationDetail[]>> {
    const response = await apiClient.get<Envelope<ReviewModerationDetail[]>>("/api/v1/admin/reviews", { params });
    return response.data;
  },

  async adminApproveReview(id: string): Promise<Envelope<Review>> {
    const response = await apiClient.patch<Envelope<Review>>(`/api/v1/admin/reviews/${id}/approve`);
    return response.data;
  },

  async adminRejectReview(id: string): Promise<Envelope<Review>> {
    const response = await apiClient.patch<Envelope<Review>>(`/api/v1/admin/reviews/${id}/reject`);
    return response.data;
  },

  async adminReopenReview(id: string): Promise<Envelope<Review>> {
    const response = await apiClient.patch<Envelope<Review>>(`/api/v1/admin/reviews/${id}/reopen`);
    return response.data;
  },

  async adminGetReviewsSummary(): Promise<Envelope<ReviewsSummary>> {
    const response = await apiClient.get<Envelope<ReviewsSummary>>("/api/v1/admin/reviews/summary");
    return response.data;
  },
};

export default reviewService;
