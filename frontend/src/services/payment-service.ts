import { apiClient } from "./api-client";
import { Envelope, Payment } from "../types";

export interface InitiatePaymentResponse {
  payment_id: string;
  order_id: string;
  order_number: string;
  amount: number;
  upi_id: string;
  upi_link: string;
  status: string;
  rejection_reason?: string | null;
}

export interface SubmitProofPayload {
  screenshot_media_id: string;
}

export interface SubmitProofResponse {
  payment_id: string;
  status: string;
  screenshot_media_id: string;
}

export interface VerifyPaymentPayload {
  action: "approve" | "reject";
  rejection_reason?: string;
}

export interface VerifyPaymentResponse {
  payment_id: string;
  status: string;
  order_status: string;
  payment_status: string;
}

export interface AdminPaymentResponse {
  payment_id: string;
  order_id: string;
  order_number: string;
  amount: number;
  upi_id: string;
  upi_link: string;
  status: "pending" | "proof_submitted" | "approved" | "rejected";
  screenshot_media_id: string | null;
  rejection_reason: string | null;
}

export const paymentService = {
  async initiateUpiPayment(orderId: string): Promise<Envelope<InitiatePaymentResponse>> {
    const response = await apiClient.post<Envelope<InitiatePaymentResponse>>(`/api/v1/payments/order/${orderId}/initiate`);
    return response.data;
  },

  async submitUpiProof(orderId: string, payload: SubmitProofPayload): Promise<Envelope<SubmitProofResponse>> {
    const response = await apiClient.post<Envelope<SubmitProofResponse>>(
      `/api/v1/payments/order/${orderId}/submit-proof`,
      payload
    );
    return response.data;
  },

  async adminVerifyPayment(paymentId: string, payload: VerifyPaymentPayload): Promise<Envelope<VerifyPaymentResponse>> {
    const response = await apiClient.post<Envelope<VerifyPaymentResponse>>(
      `/api/v1/admin/payments/${paymentId}/verify`,
      payload
    );
    return response.data;
  },

  async adminGetPaymentByOrder(orderId: string): Promise<Envelope<AdminPaymentResponse | null>> {
    const response = await apiClient.get<Envelope<AdminPaymentResponse | null>>(`/api/v1/admin/payments/order/${orderId}`);
    return response.data;
  },
};

export default paymentService;
