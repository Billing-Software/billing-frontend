import { apiClient } from './api.client';

export const billService = {
  getAll: async () => {
    const response = await apiClient.get('/bills');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/bills/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/bills', data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/bills/${id}`);
  }
};
