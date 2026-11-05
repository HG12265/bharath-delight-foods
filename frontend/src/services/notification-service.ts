import { apiClient } from "./api-client";
import { Envelope, Notification } from "../types";

export interface ListNotificationsParams {
  skip?: number;
  limit?: number;
}

export interface MarkAllReadResponse {
  modified_count: number;
}

export const notificationService = {
  async listMyNotifications(params?: ListNotificationsParams): Promise<Envelope<Notification[]>> {
    const response = await apiClient.get<Envelope<Notification[]>>("/api/v1/notifications/me", { params });
    return response.data;
  },

  async markAllRead(): Promise<Envelope<MarkAllReadResponse>> {
    const response = await apiClient.patch<Envelope<MarkAllReadResponse>>("/api/v1/notifications/read-all");
    return response.data;
  },

  async markRead(id: string): Promise<Envelope<Notification>> {
    const response = await apiClient.patch<Envelope<Notification>>(`/api/v1/notifications/${id}/read`);
    return response.data;
  },

  async adminListNotifications(params?: ListNotificationsParams): Promise<Envelope<Notification[]>> {
    const response = await apiClient.get<Envelope<Notification[]>>("/api/v1/admin/notifications", { params });
    return response.data;
  },
};

export default notificationService;
