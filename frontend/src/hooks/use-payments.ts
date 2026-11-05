import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import paymentService, { SubmitProofPayload, VerifyPaymentPayload } from "../services/payment-service";

export const useInitiateUpiPayment = () => {
  return useMutation({
    mutationFn: (orderId: string) => paymentService.initiateUpiPayment(orderId),
  });
};

export const useSubmitUpiProof = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: SubmitProofPayload }) =>
      paymentService.submitUpiProof(orderId, payload),
    onSuccess: (_, variables) => {
      // Invalidate target order details to reflect submitted/pending proof status
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useAdminVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: VerifyPaymentPayload }) =>
      paymentService.adminVerifyPayment(paymentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "payment"] });
    },
  });
};

export const useAdminPaymentByOrder = (orderId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["admin", "payment", "order", orderId],
    queryFn: () => paymentService.adminGetPaymentByOrder(orderId),
    enabled: options?.enabled !== undefined ? options.enabled && !!orderId : !!orderId,
  });
};
