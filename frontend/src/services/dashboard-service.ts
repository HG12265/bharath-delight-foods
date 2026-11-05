import { apiClient } from "./api-client";
import { Envelope, DashboardData } from "../types";

export const dashboardService = {
  async getDashboardData(): Promise<Envelope<DashboardData>> {
    const response = await apiClient.get<Envelope<DashboardData>>("/api/v1/admin/dashboard");
    return response.data;
  },
};

export default dashboardService;
