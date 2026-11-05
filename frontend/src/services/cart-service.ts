import { apiClient } from "./api-client";
import { Envelope, Cart } from "../types";

export interface AddToCartPayload {
  product_id: string;
  variant_id: string;
  quantity: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export const cartService = {
  async getCart(guestToken?: string): Promise<Envelope<Cart>> {
    const headers = guestToken ? { "X-Guest-Token": guestToken } : undefined;
    const response = await apiClient.get<Envelope<Cart>>("/api/v1/carts/me", { headers });
    return response.data;
  },

  async addToCart(payload: AddToCartPayload, guestToken?: string): Promise<Envelope<Cart>> {
    const headers = guestToken ? { "X-Guest-Token": guestToken } : undefined;
    const response = await apiClient.post<Envelope<Cart>>("/api/v1/carts/me/items", payload, { headers });
    return response.data;
  },

  async updateCartItem(variantId: string, payload: UpdateCartItemPayload, guestToken?: string): Promise<Envelope<Cart>> {
    const headers = guestToken ? { "X-Guest-Token": guestToken } : undefined;
    const response = await apiClient.patch<Envelope<Cart>>(`/api/v1/carts/me/items/${variantId}`, payload, { headers });
    return response.data;
  },

  async removeCartItem(variantId: string, guestToken?: string): Promise<Envelope<Cart>> {
    const headers = guestToken ? { "X-Guest-Token": guestToken } : undefined;
    const response = await apiClient.delete<Envelope<Cart>>(`/api/v1/carts/me/items/${variantId}`, { headers });
    return response.data;
  },

  async clearCart(guestToken?: string): Promise<Envelope<Cart>> {
    const headers = guestToken ? { "X-Guest-Token": guestToken } : undefined;
    const response = await apiClient.delete<Envelope<Cart>>("/api/v1/carts/me", { headers });
    return response.data;
  },

  async mergeGuestCart(guestToken: string): Promise<Envelope<Cart>> {
    const response = await apiClient.post<Envelope<Cart>>("/api/v1/carts/merge", { guest_token: guestToken });
    return response.data;
  },
};

export default cartService;
