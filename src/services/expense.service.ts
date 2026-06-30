import { apiClient } from './api.client';

export const expenseService = {
  getAll: async () => {
    const response = await apiClient.get('/expenses');
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/expenses/${id}`);
  }
};

export const purchaseService = {
  getAll: async () => {
    const response = await apiClient.get('/purchases');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/purchases/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/purchases', data);
    return response.data;
  },
  delete: async (id: number) => {
    await apiClient.delete(`/purchases/${id}`);
  }
};
