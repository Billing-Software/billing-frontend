import { apiClient } from './api.client';

export const serviceCatalogService = {
  getAll: async () => {
    const response = await apiClient.get('/services');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/services/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/services', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/services/${id}`);
  }
};
