export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  imageUrl?: string;
  placeholderType?: 'build' | 'cleaning' | 'scissors';
}
