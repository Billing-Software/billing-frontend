export interface Service {
  id: string;
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  taxRate: number;
  status: 'Active' | 'Inactive';
  iconName: string;
}
