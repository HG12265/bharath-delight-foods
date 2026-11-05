import { useMutation, useQueryClient } from "@tanstack/react-query";
import checkoutService, { CheckoutInitiatePayload } from "../services/checkout-service";

export const useInitiateCheckout = () => {
  return useMutation({
    mutationFn: (payload: CheckoutInitiatePayload) => checkoutService.initiateCheckout(payload),
  });
};

export const useApplyCoupon = () => {
  return useMutation({
    mutationFn: ({ checkoutId, couponCode }: { checkoutId: string; couponCode: string }) =>
      checkoutService.applyCoupon(checkoutId, couponCode),
  });
};

export const useCompleteCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkoutId: string) => checkoutService.completeCheckout(checkoutId),
    onSuccess: () => {
      // Complete checkout transitions cart, so invalidate the active cart
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
};