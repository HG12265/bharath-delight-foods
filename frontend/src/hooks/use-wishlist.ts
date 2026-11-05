import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import wishlistService from "../services/wishlist-service";
import { useSession } from "./use-auth";

export const useWishlist = () => {
  const { data: sessionData } = useSession();
  const user = sessionData?.data?.user;
  // Enable query only for customer users (do not fetch for guests)
  const isCustomer = !!user && user.role === "customer";

  return useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistService.getMyWishlist(),
    enabled: isCustomer,
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      wishlistService.addItem(productId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => wishlistService.removeItem(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
};
