import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BusinessConfig } from '../types';
import { businessConfigService } from '../services/businessConfig.service';

interface BusinessConfigContextType {
  config: BusinessConfig | null;
  loading: boolean;
  error: string | null;
  t: (key: string, isPlural?: boolean) => string;
  hasFeature: (featureKey: string) => boolean;
  refreshConfig: () => Promise<void>;
  updateConfig: (payload: Partial<BusinessConfig>) => Promise<BusinessConfig | null>;
}

const BusinessConfigContext = createContext<BusinessConfigContextType | undefined>(undefined);

export const BusinessConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await businessConfigService.getConfiguration();
      setConfig(data);
      setError(null);
    } catch (err: any) {
      console.warn('Failed to load business configuration, using fallback defaults', err);
      // Fallback default config if backend is offline/unauthenticated
      setConfig({
        businessId: 1,
        businessName: 'My Store',
        businessType: 'General Retail Store',
        category: 'Retail',
        sellingModel: 'GOODS_AND_SERVICES',
        gstScheme: 'Regular',
        isGstEnabled: true,
        features: {
          products: true,
          services: true,
          inventory: true,
          appointments: false,
          customers: true,
          staff: true,
          khata: true,
          purchases: true,
          expenses: true
        },
        terminology: {
          product: { singular: 'Product', plural: 'Products' },
          service: { singular: 'Service', plural: 'Services' },
          customer: { singular: 'Customer', plural: 'Customers' },
          invoice: { singular: 'Bill / Invoice', plural: 'Bills & Invoices' },
          inventory: { singular: 'Stock', plural: 'Stock & Inventory' }
        },
        onboardingProgressPercentage: 100,
        completedSetupSteps: ['Business Details'],
        pendingSetupSteps: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const t = useCallback((key: string, isPlural = false): string => {
    const defaults: Record<string, { singular: string; plural: string }> = {
      product: { singular: 'Product', plural: 'Products' },
      service: { singular: 'Service', plural: 'Services' },
      customer: { singular: 'Customer', plural: 'Customers' },
      invoice: { singular: 'Bill / Invoice', plural: 'Bills & Invoices' },
      inventory: { singular: 'Stock', plural: 'Stock & Inventory' },
      purchase: { singular: 'Purchase', plural: 'Purchases' },
      supplier: { singular: 'Supplier', plural: 'Suppliers' },
      staff: { singular: 'Staff Member', plural: 'Staff' },
      appointment: { singular: 'Appointment', plural: 'Appointments' }
    };

    if (!config || !config.terminology) {
      const def = defaults[key.toLowerCase()] || { singular: key, plural: `${key}s` };
      return isPlural ? def.plural : def.singular;
    }

    const matchedKey = Object.keys(config.terminology).find(k => k.toLowerCase() === key.toLowerCase());
    const item: any = matchedKey ? config.terminology[matchedKey] : null;

    if (!item) {
      const def = defaults[key.toLowerCase()] || { singular: key, plural: `${key}s` };
      return isPlural ? def.plural : def.singular;
    }

    const singularVal = item.singular || item.Singular || key;
    const pluralVal = item.plural || item.Plural || `${singularVal}s`;

    return isPlural ? pluralVal : singularVal;
  }, [config]);

  const hasFeature = useCallback((featureKey: string): boolean => {
    if (!config || !config.features) return true; // Default to true if unconfigured
    return config.features[featureKey] !== false;
  }, [config]);

  const updateConfig = useCallback(async (payload: Partial<BusinessConfig>) => {
    try {
      const updated = await businessConfigService.updateConfiguration(payload);
      setConfig(updated);
      return updated;
    } catch (err: any) {
      console.error('Failed to update business configuration', err);
      return null;
    }
  }, []);

  return (
    <BusinessConfigContext.Provider
      value={{
        config,
        loading,
        error,
        t,
        hasFeature,
        refreshConfig: fetchConfig,
        updateConfig
      }}
    >
      {children}
    </BusinessConfigContext.Provider>
  );
};

export const useBusinessConfig = (): BusinessConfigContextType => {
  const context = useContext(BusinessConfigContext);
  if (!context) {
    throw new Error('useBusinessConfig must be used within a BusinessConfigProvider');
  }
  return context;
};
