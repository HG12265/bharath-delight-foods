import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import claimsService from "../services/claims-service";
import { CreateClaimPayload } from "../types";

export const useCreateClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClaimPayload) => claimsService.createClaim(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      queryClient.invalidateQueries({ queryKey: ["order-claims", variables.order_id] });
      queryClient.invalidateQueries({ queryKey: ["admin-claims"] });
    },
  });
};

export const useMyClaims = () => {
  return useQuery({
    queryKey: ["my-claims"],
    queryFn: () => claimsService.getMyClaims(),
  });
};

export const useClaimsByOrder = (orderId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["order-claims", orderId],
    queryFn: () => claimsService.getClaimsByOrder(orderId),
    enabled: Boolean(orderId) && (options?.enabled ?? true),
  });
};

export const useAdminClaims = (params?: { status?: string; limit?: number; skip?: number }) => {
  return useQuery({
    queryKey: ["admin-claims", params],
    queryFn: () => claimsService.getAdminClaims(params),
  });
};

export const useUpdateClaimStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status: string; admin_notes?: string; resolution_details?: any } }) =>
      claimsService.updateClaimStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-claims"] });
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      queryClient.invalidateQueries({ queryKey: ["order-claims"] });
    },
  });
};

