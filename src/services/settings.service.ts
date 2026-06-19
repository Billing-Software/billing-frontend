import { apiClient } from './api.client';

export const settingsService = {
  getWhatsAppSettings: async () => {
    const response = await apiClient.get('/settings/whatsapp');
    return response.data;
  },
  updateWhatsAppSettings: async (settingsData: any) => {
    const response = await apiClient.put('/settings/whatsapp', settingsData);
    return response.data;
  },
  addWhatsAppTemplate: async (templateData: any) => {
    const response = await apiClient.post('/settings/whatsapp/templates', templateData);
    return response.data;
  },
  deleteWhatsAppTemplate: async (id: number) => {
    await apiClient.delete(`/settings/whatsapp/templates/${id}`);
  }
};
