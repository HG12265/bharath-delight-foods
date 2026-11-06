import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  offerService,
  ListAdminOffersParams,
} from "../services/offer-service";
import { CreateOfferPayload, UpdateOfferPayload } from "../types";

export const useActiveOffers = () => {
  return useQuery({
    queryKey: ["offers", "active"],
    queryFn: () => offerService.getActiveOffers(),
  });
};

export const useAdminOffers = (params?: ListAdminOffersParams) => {
  return useQuery({
    queryKey: ["admin", "offers", params],
    queryFn: () => offerService.getAdminOffers(params),
  });
};

export const useAdminOffer = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["admin", "offer", id],
    queryFn: () => offerService.getAdminOfferById(id),
    enabled: options?.enabled !== undefined ? options.enabled && !!id : !!id,
  });
};

export const useCreateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOfferPayload) => offerService.createOffer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers", "active"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useUpdateOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOfferPayload }) =>
      offerService.updateOffer(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offer", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers", "active"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useUpdateOfferStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "active" | "disabled" | "cancelled" | "draft";
    }) => offerService.updateOfferStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offer", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers", "active"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useDeleteOffer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => offerService.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "offers"] });
      queryClient.invalidateQueries({ queryKey: ["offers", "active"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};
