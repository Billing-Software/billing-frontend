import { apiClient } from './api.client';
import { BusinessConfig, BusinessTypePreset, TaxCategory, HSNItem, SACItem } from '../types';
import { searchGstMaster } from '../data/gstMasterData';

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
    // 1. Get instant results from authentic Indian HSN master dataset
    const localMatches = searchGstMaster(query, 'Goods') as HSNItem[];

    // 2. Gracefully attempt backend API query to merge any custom tenant records
    try {
      const res = await apiClient.get<HSNItem[]>(`/Tax/hsn/search?query=${encodeURIComponent(query)}`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const existingCodes = new Set(localMatches.map(m => m.code));
        const customItems = res.data.filter(item => !existingCodes.has(item.code));
        return [...localMatches, ...customItems];
      }
    } catch (e) {
      // Backend unavailable or offline; seamlessly return local authentic dataset
    }

    return localMatches;
  },

  searchSAC: async (query: string): Promise<SACItem[]> => {
    // 1. Get instant results from authentic Indian SAC master dataset
    const localMatches = searchGstMaster(query, 'Services') as SACItem[];

    // 2. Gracefully attempt backend API query to merge any custom tenant records
    try {
      const res = await apiClient.get<SACItem[]>(`/Tax/sac/search?query=${encodeURIComponent(query)}`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const existingCodes = new Set(localMatches.map(m => m.code));
        const customItems = res.data.filter(item => !existingCodes.has(item.code));
        return [...localMatches, ...customItems];
      }
    } catch (e) {
      // Backend unavailable or offline; seamlessly return local authentic dataset
    }

    return localMatches;
  },

  calculateTax: async (payload: any): Promise<any> => {
    const res = await apiClient.post('/Tax/calculate', payload);
    return res.data;
  }
};
