import { apiClient } from './api.client';

export const businessService = {
  getProfile: async () => {
    const response = await apiClient.get('/business');
    return response.data;
  },
  updateProfile: async (businessData: any) => {
    const response = await apiClient.put('/business', businessData);
    return response.data;
  }
};
