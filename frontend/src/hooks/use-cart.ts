import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import cartService, { AddToCartPayload, UpdateCartItemPayload } from "../services/cart-service";

export const useCart = (guestToken?: string) => {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.getCart(guestToken),
    refetchOnMount: true,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, guestToken }: { payload: AddToCartPayload; guestToken?: string }) =>
      cartService.addToCart(payload, guestToken),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      payload,
      guestToken,
    }: {
      variantId: string;
      payload: UpdateCartItemPayload;
      guestToken?: string;
    }) => cartService.updateCartItem(variantId, payload, guestToken),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, guestToken }: { variantId: string; guestToken?: string }) =>
      cartService.removeCartItem(variantId, guestToken),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guestToken?: string) => cartService.clearCart(guestToken),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};

export const useMergeGuestCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guestToken: string) => cartService.mergeGuestCart(guestToken),
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};