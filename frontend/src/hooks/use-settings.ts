import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import settingsService, { SettingsUpdatePayload } from "../services/settings-service";

export const usePublicSettings = () => {
  return useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => settingsService.getPublicSettings(),
  });
};

export const useAdminSettings = () => {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => settingsService.getAdminSettings(),
  });
};

export const useUpdateAdminSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SettingsUpdatePayload) => settingsService.updateAdminSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
};
