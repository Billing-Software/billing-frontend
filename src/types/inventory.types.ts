export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  secondaryUnit?: string;
  conversionRate?: number;       // e.g. 1 Box = 24 Pcs
  reorderLevel: number;
  mrp?: number;
  wholesalePrice?: number;
  purchasePrice?: number;
  batchNumber?: string;
  expiryDate?: string;
  rackLocation?: string;
  imageUrl?: string;
  placeholderType?: 'build' | 'cleaning' | 'scissors';
}

