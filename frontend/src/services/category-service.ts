import { apiClient } from "./api-client";
import { Envelope, Category } from "../types";

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_id?: string;
  parent_id?: string;
  level: number;
  sort_order: number;
  is_active: boolean;
  children: CategoryTreeNode[];
}

export const categoryService = {
  async listCategories(): Promise<Envelope<Category[]>> {
    const response = await apiClient.get<Envelope<Category[]>>("/api/v1/categories");
    return response.data;
  },

  async listAllCategoriesAdmin(): Promise<Envelope<Category[]>> {
    const response = await apiClient.get<Envelope<Category[]>>("/api/v1/categories/admin/all");
    return response.data;
  },

  async getCategoryTree(): Promise<Envelope<CategoryTreeNode[]>> {
    const response = await apiClient.get<Envelope<CategoryTreeNode[]>>("/api/v1/categories/tree");
    return response.data;
  },

  async getCategoryBySlug(slug: string): Promise<Envelope<Category>> {
    const response = await apiClient.get<Envelope<Category>>(`/api/v1/categories/${slug}`);
    return response.data;
  },

  async createCategory(payload: any): Promise<Envelope<Category>> {
    const response = await apiClient.post<Envelope<Category>>("/api/v1/categories", payload);
    return response.data;
  },

  async updateCategory(id: string, payload: any): Promise<Envelope<Category>> {
    const response = await apiClient.patch<Envelope<Category>>(`/api/v1/categories/${id}`, payload);
    return response.data;
  },

  async deleteCategory(id: string): Promise<Envelope<null>> {
    const response = await apiClient.delete<Envelope<null>>(`/api/v1/categories/${id}`);
    return response.data;
  },

  async updateCategoryStatus(id: string, payload: { is_active: boolean }): Promise<Envelope<Category>> {
    const response = await apiClient.patch<Envelope<Category>>(`/api/v1/categories/${id}/status`, payload);
    return response.data;
  },
};

export default categoryService;
