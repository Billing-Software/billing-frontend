import { apiClient } from './api.client';
import { BusinessConfig, BusinessTypePreset, TaxCategory, HSNItem, SACItem } from '../types';

export const businessConfigService = {
  getPresets: async (): Promise<BusinessTypePreset[]> => {
    const res = await apiClient.get<BusinessTypePreset[]>('/BusinessConfiguration/types');
    return res.data;
  },

  getConfiguration: async (): Promise<BusinessConfig> => {
    const res = await apiClient.get<BusinessConfig>('/BusinessConfiguration');
    return res.data;
  },

  updateConfiguration: async (payload: Partial<BusinessConfig>): Promise<BusinessConfig> => {
    const res = await apiClient.put<BusinessConfig>('/BusinessConfiguration', payload);
    return res.data;
  },

  getTaxCategories: async (): Promise<TaxCategory[]> => {
    const res = await apiClient.get<TaxCategory[]>('/Tax/categories');
    return res.data;
  },

  searchHSN: async (query: string): Promise<HSNItem[]> => {
    const res = await apiClient.get<HSNItem[]>(`/Tax/hsn/search?query=${encodeURIComponent(query)}`);
    return res.data;
  },

  searchSAC: async (query: string): Promise<SACItem[]> => {
    const res = await apiClient.get<SACItem[]>(`/Tax/sac/search?query=${encodeURIComponent(query)}`);
    return res.data;
  },

  calculateTax: async (payload: any): Promise<any> => {
    const res = await apiClient.post('/Tax/calculate', payload);
    return res.data;
  }
};
