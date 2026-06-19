import { apiClient } from './api.client';

export const inventoryService = {
  getAll: async () => {
    const response = await apiClient.get('/inventory');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/inventory/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/inventory', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/inventory/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/inventory/${id}`);
  }
};
