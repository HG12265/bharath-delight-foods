import { useQuery } from "@tanstack/react-query";
import mediaService from "../services/media-service";

export const useMediaAsset = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["media", id],
    queryFn: () => mediaService.getMediaAssetMetadata(id),
    enabled: options?.enabled !== undefined ? options.enabled && !!id : !!id,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403 || error?.response?.status === 404) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
  });
};
