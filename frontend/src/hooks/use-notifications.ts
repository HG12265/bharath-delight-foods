import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import notificationService, { ListNotificationsParams } from "../services/notification-service";
import { useMe, useSession } from "./use-auth";

export const useNotifications = (params?: ListNotificationsParams) => {
  const { data: sessionData } = useSession();
  const isLoggedIn = !!sessionData?.data?.user;
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationService.listMyNotifications(params),
    enabled: isLoggedIn,
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export const useAdminNotifications = (params?: ListNotificationsParams) => {
  const { data: meData } = useMe();
  const user = meData?.data;
  const isAdminOrWarehouse = !!user && (user.role === "admin" || user.role === "warehouse");
  return useQuery({
    queryKey: ["admin", "notifications", params],
    queryFn: () => notificationService.adminListNotifications(params),
    enabled: isAdminOrWarehouse,
  });
};
