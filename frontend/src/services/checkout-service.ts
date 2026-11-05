import { apiClient } from "./api-client";
import { Envelope, CheckoutSession, ShippingAddress } from "../types";

export interface CheckoutInitiatePayload {
  cart_id: string;
  email: string;
  shipping_address: ShippingAddress;
  idempotency_key: string;
}

export const checkoutService = {
  async initiateCheckout(payload: CheckoutInitiatePayload): Promise<Envelope<CheckoutSession>> {
    const response = await apiClient.post<Envelope<CheckoutSession>>("/api/v1/checkouts/initiate", payload);
    return response.data;
  },

  async applyCoupon(checkoutId: string, couponCode: string): Promise<Envelope<CheckoutSession>> {
    const response = await apiClient.post<Envelope<CheckoutSession>>(`/api/v1/checkouts/${checkoutId}/apply-coupon`, {
      coupon_code: couponCode,
    });
    return response.data;
  },

  async completeCheckout(checkoutId: string): Promise<Envelope<CheckoutSession>> {
    // We send payment_method: "upi" since COD is removed and only Manual UPI is supported.
    const response = await apiClient.post<Envelope<CheckoutSession>>(`/api/v1/checkouts/${checkoutId}/complete`, {
      payment_method: "upi",
    });
    return response.data;
  },
};

export default checkoutService;