import axios from "axios";
import { apiClient } from "./api-client";
import { Envelope } from "../types";

export interface PresignResponse {
  id: string;
  upload_url: string;
  public_url: string;
  storage_key: string;
}

export interface MediaAssetResponse {
  id: string;
  original_filename: string;
  content_type: string;
  size: number;
  storage_key: string;
  public_url: string;
  uploaded_by: string;
  asset_type: string;
  status: string;
  created_at: string;
}

export const mediaService = {
  async requestPresign(payload: {
    filename: string;
    content_type: string;
    size: number;
    asset_type: "payment_proof" | "product_image" | "category_image" | "avatar";
  }): Promise<Envelope<PresignResponse>> {
    const response = await apiClient.post<Envelope<PresignResponse>>("/api/v1/media/presign", payload);
    return response.data;
  },

  async confirmComplete(payload: {
    id: string;
    status: "completed" | "failed";
  }): Promise<Envelope<MediaAssetResponse>> {
    const response = await apiClient.post<Envelope<MediaAssetResponse>>("/api/v1/media/complete", payload);
    return response.data;
  },

  /**
   * Helper that orchestrates the entire presign -> PUT upload -> complete flow.
   */
  async uploadFile(
    file: File,
    assetType: "payment_proof" | "product_image" | "category_image" | "avatar"
  ): Promise<MediaAssetResponse> {
    // 1. Get presigned upload configuration
    const presignRes = await this.requestPresign({
      filename: file.name,
      content_type: file.type,
      size: file.size,
      asset_type: assetType,
    });

    if (!presignRes.success || !presignRes.data) {
      throw new Error(presignRes.message || "Failed to obtain presigned URL");
    }

    const { id, upload_url } = presignRes.data;

    try {
      // 2. Perform raw PUT request to the S3/R2 presigned URL
      // Use clean axios client without Authorization header, since presigned URL already has credentials embedded
      await axios.put(upload_url, file, {
        headers: {
          "Content-Type": file.type,
        },
      });

      // 3. Confirm completion to the backend
      const completeRes = await this.confirmComplete({
        id,
        status: "completed",
      });

      if (!completeRes.success || !completeRes.data) {
        throw new Error(completeRes.message || "Failed to complete media upload registration");
      }

      return completeRes.data;
    } catch (error) {
      // Notify backend that upload failed
      await this.confirmComplete({
        id,
        status: "failed",
      }).catch(() => {});
      throw error;
    }
  },

  async getMediaAssetMetadata(id: string): Promise<Envelope<MediaAssetResponse>> {
    const response = await apiClient.get<Envelope<MediaAssetResponse>>(`/api/v1/media/${id}`);
    return response.data;
  },
};

export default mediaService;
