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

// Old WhatsAppSettings interface has been replaced.
// New types are in services/whatsapp.service.ts:
//   - WhatsAppAccountStatus
//   - MessageLog
