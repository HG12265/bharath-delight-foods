import { apiClient } from "./api-client";
import { Envelope, Shipment } from "../types";

export interface CreateShipmentPayload {
  carrier_name: string;
  tracking_number: string;
  awb_number?: string;
  estimated_delivery_date?: string;
}

export interface EditShipmentPayload {
  carrier_name?: string;
  tracking_number?: string;
  awb_number?: string | null;
  estimated_delivery_date?: string | null;
}

export interface UpdateShipmentStatusPayload {
  status: "pending" | "packed" | "shipped" | "reached_hub" | "out_for_delivery" | "delivered" | "failed" | "returned" | "cancelled";
  message: string;
  location?: string;
}

export interface ListShipmentsParams {
  skip?: number;
  limit?: number;
}

export const shipmentService = {
  async createShipment(orderId: string, payload: CreateShipmentPayload): Promise<Envelope<Shipment>> {
    const response = await apiClient.post<Envelope<Shipment>>(`/api/v1/shipments/order/${orderId}`, payload);
    return response.data;
  },

  async getShipmentByOrder(orderId: string): Promise<Envelope<Shipment>> {
    const response = await apiClient.get<Envelope<Shipment>>(`/api/v1/shipments/order/${orderId}`);
    return response.data;
  },

  async getShipmentById(id: string): Promise<Envelope<Shipment>> {
    const response = await apiClient.get<Envelope<Shipment>>(`/api/v1/shipments/${id}`);
    return response.data;
  },

  async adminListShipments(params?: ListShipmentsParams): Promise<Envelope<Shipment[]>> {
    const response = await apiClient.get<Envelope<Shipment[]>>("/api/v1/admin/shipments", { params });
    return response.data;
  },

  async adminUpdateShipmentStatus(id: string, payload: UpdateShipmentStatusPayload): Promise<Envelope<Shipment>> {
    const response = await apiClient.patch<Envelope<Shipment>>(`/api/v1/admin/shipments/${id}/status`, payload);
    return response.data;
  },

  async adminEditShipment(id: string, payload: EditShipmentPayload): Promise<Envelope<Shipment>> {
    const response = await apiClient.patch<Envelope<Shipment>>(`/api/v1/admin/shipments/${id}`, payload);
    return response.data;
  },

  async adminCancelShipment(id: string): Promise<Envelope<Shipment>> {
    const response = await apiClient.post<Envelope<Shipment>>(`/api/v1/admin/shipments/${id}/cancel`);
    return response.data;
  },

  async adminDeleteShipment(id: string): Promise<Envelope<boolean>> {
    const response = await apiClient.delete<Envelope<boolean>>(`/api/v1/admin/shipments/${id}`);
    return response.data;
  },
};

export default shipmentService;
