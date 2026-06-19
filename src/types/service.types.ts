export interface Service {
  id: number;
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  taxRate: number;
  status: 'Active' | 'Inactive';
  iconName: string;
}
