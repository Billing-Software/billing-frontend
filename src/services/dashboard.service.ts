import { apiClient } from './api.client';

export const dashboardService = {
  getDashboardData: async () => {
    const response = await apiClient.get('/dashboard');
    return response.data;
  }
};
