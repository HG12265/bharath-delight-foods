import { apiClient } from "./api-client";

export interface ContactInquiryPayload {
  full_name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
}

export const contactService = {
  async submitInquiry(payload: ContactInquiryPayload): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      "/api/v1/contact",
      payload
    );
    return response.data;
  },
};

export default contactService;
