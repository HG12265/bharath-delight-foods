import { apiClient } from "./api-client";
import { Envelope, Product } from "../types";

export interface ListProductsParams {
  category_id?: string;
  category_slug?: string;
  is_featured?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  products: Product[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export const productService = {
  async listProducts(params?: ListProductsParams): Promise<Envelope<ProductListResponse>> {
    const response = await apiClient.get<Envelope<ProductListResponse>>("/api/v1/products", { params });
    return response.data;
  },

  async getProductBySlug(slug: string): Promise<Envelope<Product>> {
    const response = await apiClient.get<Envelope<Product>>(`/api/v1/products/${slug}`);
    return response.data;
  },

  async createProduct(payload: any): Promise<Envelope<Product>> {
    const response = await apiClient.post<Envelope<Product>>("/api/v1/products", payload);
    return response.data;
  },

  async updateProduct(id: string, payload: any): Promise<Envelope<Product>> {
    const response = await apiClient.patch<Envelope<Product>>(`/api/v1/products/${id}`, payload);
    return response.data;
  },

  async deleteProduct(id: string): Promise<Envelope<null>> {
    const response = await apiClient.delete<Envelope<null>>(`/api/v1/products/${id}`);
    return response.data;
  },

  async listAllProductsAdmin(params?: ListProductsParams): Promise<Envelope<Product[]>> {
    const response = await apiClient.get<Envelope<Product[]>>("/api/v1/products/admin/all", { params });
    return response.data;
  },

  async updateProductStatus(id: string, status: "draft" | "active" | "archived"): Promise<Envelope<Product>> {
    const response = await apiClient.patch<Envelope<Product>>(`/api/v1/products/${id}/status`, { status });
    return response.data;
  },
};
export default productService;