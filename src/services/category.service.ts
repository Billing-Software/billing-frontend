import { apiClient } from './api.client';

export interface Category {
  id: number;
  businessId: number;
  name: string;
  type: string; // 'Service' | 'Inventory' | 'Expense'
  parentId?: number;
  createdAt?: string;
}

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },
  create: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  }
};
