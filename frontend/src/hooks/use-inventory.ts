import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StockAdjustmentPayload } from "../types";
import inventoryService from "../services/inventory-service";

/** Hook: fetches all inventories joined with product/variant metadata */
export const useInventories = () => {
  return useQuery({
    queryKey: ["inventories", "all"],
    queryFn: () => inventoryService.listAllInventories(),
    staleTime: 30_000,
  });
};

/** Hook: fetches a single inventory by SKU */
export const useInventoryBySku = (sku: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["inventory", sku],
    queryFn: () => inventoryService.getInventoryBySku(sku),
    enabled: options?.enabled !== undefined ? options.enabled && !!sku : !!sku,
  });
};

/** Hook: fetches movement history for a specific SKU */
export const useInventoryHistory = (sku: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["inventory", sku, "history"],
    queryFn: () => inventoryService.getInventoryHistory(sku),
    enabled: options?.enabled !== undefined ? options.enabled && !!sku : !!sku,
    staleTime: 15_000,
  });
};

/** Hook: mutation for adjusting stock */
export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sku, payload }: { sku: string; payload: StockAdjustmentPayload }) =>
      inventoryService.adjustStock(sku, payload),
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries after adjustment
      queryClient.invalidateQueries({ queryKey: ["inventory", variables.sku] });
      queryClient.invalidateQueries({ queryKey: ["inventories", "all"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
