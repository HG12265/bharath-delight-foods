import { apiClient } from "./api-client";
import { Envelope, Wishlist } from "../types";

export const wishlistService = {
  async getMyWishlist(): Promise<Envelope<Wishlist>> {
    const response = await apiClient.get<Envelope<Wishlist>>("/api/v1/wishlists/me");
    return response.data;
  },

  async addItem(productId: string, variantId: string): Promise<Envelope<Wishlist>> {
    const response = await apiClient.post<Envelope<Wishlist>>("/api/v1/wishlists/me/items", {
      product_id: productId,
      variant_id: variantId,
    });
    return response.data;
  },

  async removeItem(variantId: string): Promise<Envelope<Wishlist>> {
    const response = await apiClient.delete<Envelope<Wishlist>>(`/api/v1/wishlists/me/items/${variantId}`);
    return response.data;
  },
};

export default wishlistService;
