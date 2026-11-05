import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import reviewService, {
  ReviewCreatePayload,
  ReviewUpdatePayload,
  ListReviewsParams,
} from "../services/review-service";

export const useProductReviews = (productId: string) => {
  return useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: () => reviewService.listProductReviews(productId),
    enabled: !!productId,
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReviewCreatePayload) => reviewService.submitReview(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "product", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewUpdatePayload }) =>
      reviewService.updateReview(id, payload),
    onSuccess: (data) => {
      if (data.data?.product_id) {
        queryClient.invalidateQueries({ queryKey: ["reviews", "product", data.data.product_id] });
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });
};

export const useAdminReviews = (params?: ListReviewsParams) => {
  return useQuery({
    queryKey: ["admin", "reviews", params],
    queryFn: () => reviewService.adminListReviews(params),
  });
};

export const useAdminApproveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewService.adminApproveReview(id),
    onSuccess: (data) => {
      if (data.data?.product_id) {
        queryClient.invalidateQueries({ queryKey: ["reviews", "product", data.data.product_id] });
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews-summary"] });
      // Clear product cache to recalculate cached product ratings structure
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useAdminRejectReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewService.adminRejectReview(id),
    onSuccess: (data) => {
      if (data.data?.product_id) {
        queryClient.invalidateQueries({ queryKey: ["reviews", "product", data.data.product_id] });
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews-summary"] });
      // Clear product cache to recalculate cached product ratings structure
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useAdminReopenReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewService.adminReopenReview(id),
    onSuccess: (data) => {
      if (data.data?.product_id) {
        queryClient.invalidateQueries({ queryKey: ["reviews", "product", data.data.product_id] });
      }
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews-summary"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
};

export const useAdminReviewsSummary = () => {
  return useQuery({
    queryKey: ["admin", "reviews-summary"],
    queryFn: () => reviewService.adminGetReviewsSummary(),
  });
};
