import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  couponService,
  ListAdminCouponsParams,
} from "../services/coupon-service";
import { CreateCouponPayload, UpdateCouponPayload } from "../types";

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) =>
      couponService.validateCoupon(code, subtotal),
  });
};

export const useAdminCoupons = (params?: ListAdminCouponsParams) => {
  return useQuery({
    queryKey: ["admin", "coupons", params],
    queryFn: () => couponService.getAdminCoupons(params),
  });
};

export const useAdminCoupon = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["admin", "coupon", id],
    queryFn: () => couponService.getAdminCouponById(id),
    enabled: options?.enabled !== undefined ? options.enabled && !!id : !!id,
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCouponPayload) => couponService.createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCouponPayload }) =>
      couponService.updateCoupon(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupon", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });
};

export const useToggleCouponStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponService.toggleCouponStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupon", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });
};
