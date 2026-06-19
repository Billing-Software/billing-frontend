import { apiClient } from './api.client';

export const customerService = {
  getAll: async () => {
    const response = await apiClient.get('/customers');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/customers/${id}`);
  }
};
