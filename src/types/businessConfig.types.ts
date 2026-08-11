export interface TerminologyPair {
  singular: string;
  plural: string;
}

export interface BusinessTypePreset {
  id: string;
  name: string;
  category: string;
  iconName: string;
  sellingModel: string;
  aliases: string[];
  defaultFeatures: Record<string, boolean>;
  defaultTerminology: Record<string, TerminologyPair>;
}

export interface BusinessConfig {
  businessId: number;
  businessName: string;
  businessType: string;
  category: string;
  sellingModel: 'GOODS_ONLY' | 'SERVICES_ONLY' | 'GOODS_AND_SERVICES' | string;
  gstScheme: 'Regular' | 'Composition' | 'None' | string;
  gstIn?: string;
  registeredState?: string;
  isGstEnabled: boolean;
  features: Record<string, boolean>;
  terminology: Record<string, TerminologyPair>;
  onboardingProgressPercentage: number;
  completedSetupSteps: string[];
  pendingSetupSteps: string[];
}

export interface TaxCategory {
  id: number;
  businessId?: number;
  name: string;
  taxType: 'Goods' | 'Services' | string;
  hsnCode?: string;
  sacCode?: string;
  gstPercentage: number;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cessPercentage: number;
  isActive: boolean;
}

export interface HSNItem {
  id: number;
  code: string;
  description: string;
  searchTerms?: string;
  uqc: string;
  defaultGSTPercentage: number;
}

export interface SACItem {
  id: number;
  code: string;
  description: string;
  searchTerms?: string;
  defaultGSTPercentage: number;
}
