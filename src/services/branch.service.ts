import { apiClient } from './api.client';

export const branchService = {
  getAll: async () => {
    const response = await apiClient.get('/branches');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/branches/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/branches', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/branches/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/branches/${id}`);
  }
};
