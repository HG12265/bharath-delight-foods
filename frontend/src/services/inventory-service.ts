import { apiClient } from "./api-client";
import {
  Envelope,
  Inventory,
  InventoryDetails,
  InventoryMovement,
  StockAdjustmentPayload,
} from "../types";

export const inventoryService = {
  /** GET /api/v1/inventories — all inventories joined with product/variant metadata (ADMIN + WAREHOUSE) */
  async listAllInventories(): Promise<Envelope<InventoryDetails[]>> {
    const response = await apiClient.get<Envelope<InventoryDetails[]>>("/api/v1/inventories");
    return response.data;
  },

  /** GET /api/v1/inventories/{sku} — single inventory record by SKU */
  async getInventoryBySku(sku: string): Promise<Envelope<Inventory>> {
    const response = await apiClient.get<Envelope<Inventory>>(`/api/v1/inventories/${sku}`);
    return response.data;
  },

  /** GET /api/v1/inventories/{sku}/history — movement history for a SKU */
  async getInventoryHistory(sku: string): Promise<Envelope<InventoryMovement[]>> {
    const response = await apiClient.get<Envelope<InventoryMovement[]>>(
      `/api/v1/inventories/${sku}/history`
    );
    return response.data;
  },

  /** PATCH /api/v1/inventories/{sku}/adjust — adjust stock levels (ADMIN only) */
  async adjustStock(
    sku: string,
    payload: StockAdjustmentPayload
  ): Promise<Envelope<Inventory>> {
    const response = await apiClient.patch<Envelope<Inventory>>(
      `/api/v1/inventories/${sku}/adjust`,
      payload
    );
    return response.data;
  },

  /** GET /api/v1/inventories/alerts/low-stock — low stock alerts */
  async getLowStockAlerts(): Promise<Envelope<Inventory[]>> {
    const response = await apiClient.get<Envelope<Inventory[]>>(
      "/api/v1/inventories/alerts/low-stock"
    );
    return response.data;
  },

  /** Fetches the CSV file as a Blob with auth headers (ADMIN only) */
  async exportCsv(): Promise<Blob> {
    const response = await apiClient.get<Blob>("/api/v1/inventories/export/csv", {
      responseType: "blob",
    });
    return response.data;
  },
};

export default inventoryService;
