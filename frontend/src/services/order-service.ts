import { apiClient } from "./api-client";
import { Envelope, Order } from "../types";

export interface ListOrdersParams {
  skip?: number;
  limit?: number;
}

export interface AdminUpdateOrderStatusPayload {
  order_status?: string;
  payment_status?: string;
  fulfillment_status?: string;
}

export const orderService = {
  async createOrderFromCheckout(checkoutId: string): Promise<Envelope<Order>> {
    const response = await apiClient.post<Envelope<Order>>(`/api/v1/orders/from-checkout/${checkoutId}`);
    return response.data;
  },

  async listOrders(params?: ListOrdersParams): Promise<Envelope<Order[]>> {
    const response = await apiClient.get<Envelope<Order[]>>("/api/v1/orders/me", { params });
    return response.data;
  },

  async getOrderDetails(orderId: string): Promise<Envelope<Order>> {
    const response = await apiClient.get<Envelope<Order>>(`/api/v1/orders/${orderId}`);
    return response.data;
  },

  async cancelOrder(orderId: string): Promise<Envelope<Order>> {
    const response = await apiClient.post<Envelope<Order>>(`/api/v1/orders/${orderId}/cancel`);
    return response.data;
  },

  async adminListOrders(params?: ListOrdersParams): Promise<Envelope<Order[]>> {
    const response = await apiClient.get<Envelope<Order[]>>("/api/v1/admin/orders", { params });
    return response.data;
  },

  async adminUpdateOrderStatus(orderId: string, payload: AdminUpdateOrderStatusPayload): Promise<Envelope<Order>> {
    const response = await apiClient.patch<Envelope<Order>>(`/api/v1/admin/orders/${orderId}/status`, payload);
    return response.data;
  },

  async getInvoiceBlob(orderId: string, mode: "view" | "download"): Promise<Blob> {
    const response = await apiClient.get(`/api/v1/orders/${orderId}/invoice`, {
      params: { mode },
      responseType: "blob",
    });
    return response.data;
  },

  async exportOrdersReport(params: {
    format: "pdf" | "excel";
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const response = await apiClient.get("/api/v1/admin/orders/reports/export", {
      params: {
        format: params.format,
        status: params.status && params.status !== "all" ? params.status : undefined,
        start_date: params.startDate || undefined,
        end_date: params.endDate || undefined,
      },
      responseType: "blob",
    });
    return response.data;
  },
};

export default orderService;
