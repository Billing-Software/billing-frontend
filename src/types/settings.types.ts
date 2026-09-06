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
// SMS settings interfaces are defined in services/sms.service.ts
