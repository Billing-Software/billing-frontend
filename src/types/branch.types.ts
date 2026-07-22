export interface Branch {
  id: number;
  businessId: number;
  name: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
}
