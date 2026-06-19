import { apiClient } from './api.client';

export const staffService = {
  getAll: async () => {
    const response = await apiClient.get('/staff');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/staff/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/staff', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/staff/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/staff/${id}`);
  }
};
