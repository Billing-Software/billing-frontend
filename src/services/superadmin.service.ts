import { apiClient } from './api.client';

export const superAdminService = {
  getStats: async () => {
    try {
      const response = await apiClient.get('/superadmin/dashboard');
      return response.data;
    } catch (err) {
      console.error('Error fetching Super Admin stats:', err);
      throw err;
    }
  },
  getClients: async () => {
    try {
      const response = await apiClient.get('/superadmin/clients');
      return response.data;
    } catch (err) {
      console.error('Error fetching Super Admin clients:', err);
      throw err;
    }
  },
  getPayments: async () => {
    try {
      const response = await apiClient.get('/superadmin/payments');
      return response.data;
    } catch (err) {
      console.error('Error fetching Super Admin payments:', err);
      throw err;
    }
  },
  toggleSuspension: async (id: number) => {
    try {
      const response = await apiClient.post(`/superadmin/clients/${id}/status`);
      return response.data;
    } catch (err) {
      console.error('Error toggling client suspension status:', err);
      throw err;
    }
  },
  deleteClient: async (id: number) => {
    try {
      const response = await apiClient.delete(`/superadmin/clients/${id}`);
      return response.data;
    } catch (err) {
      console.error('Error deleting tenant business client:', err);
      throw err;
    }
  }
};
