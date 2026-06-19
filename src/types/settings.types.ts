export interface BusinessProfile {
  legalName: string;
  tradingName: string;
  address: string;
  city: string;
  postalCode: string;
  gstIn: string;
  defaultTaxRate: string;
  pricesIncludeTax: boolean;
}

export interface WhatsAppSettings {
  apiKey: string;
  isConnected: boolean;
  templates: string[];
}
