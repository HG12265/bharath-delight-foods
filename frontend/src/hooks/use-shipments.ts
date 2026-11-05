import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import shipmentService, {
  CreateShipmentPayload,
  UpdateShipmentStatusPayload,
  ListShipmentsParams,
} from "../services/shipment-service";

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: CreateShipmentPayload }) =>
      shipmentService.createShipment(orderId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipment", "order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    },
  });
};

export const useShipmentByOrder = (orderId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["shipment", "order", orderId],
    queryFn: () => shipmentService.getShipmentByOrder(orderId),
    enabled: options?.enabled !== undefined ? options.enabled && !!orderId : !!orderId,
  });
};

export const useShipmentById = (id: string) => {
  return useQuery({
    queryKey: ["shipment", id],
    queryFn: () => shipmentService.getShipmentById(id),
    enabled: !!id,
  });
};

export const useAdminShipments = (params?: ListShipmentsParams) => {
  return useQuery({
    queryKey: ["admin", "shipments", params],
    queryFn: () => shipmentService.adminListShipments(params),
  });
};

export const useAdminUpdateShipmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateShipmentStatusPayload }) =>
      shipmentService.adminUpdateShipmentStatus(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipment", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
      if (data.data?.order_id) {
        queryClient.invalidateQueries({ queryKey: ["shipment", "order", data.data.order_id] });
        queryClient.invalidateQueries({ queryKey: ["order", data.data.order_id] });
      }
    },
  });
};

export const useAdminEditShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      shipmentService.adminEditShipment(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipment", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
      if (data.data?.order_id) {
        queryClient.invalidateQueries({ queryKey: ["shipment", "order", data.data.order_id] });
        queryClient.invalidateQueries({ queryKey: ["order", data.data.order_id] });
      }
    },
  });
};

export const useAdminCancelShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentService.adminCancelShipment(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipment", variables] });
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
      if (data.data?.order_id) {
        queryClient.invalidateQueries({ queryKey: ["shipment", "order", data.data.order_id] });
        queryClient.invalidateQueries({ queryKey: ["order", data.data.order_id] });
      }
    },
  });
};

export const useAdminDeleteShipment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentService.adminDeleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "shipments"] });
    },
  });
};
