export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  imageUrl?: string;
  placeholderType?: 'build' | 'cleaning' | 'scissors';
}
