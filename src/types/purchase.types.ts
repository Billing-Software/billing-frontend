export interface Supplier {
  id: number;
  businessId?: number;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  openingBalance: number;
  currentBalance: number; // positive = "You'll Give" (Payable)
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface PurchaseItem {
  id?: number;
  inventoryItemId?: number;
  itemName: string;
  hsnSac?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  taxAmount: number;
  lineTotal: number;
}

export interface PurchaseBill {
  id: number;
  businessId?: number;
  billNumber: string; // e.g. PUR-2026-001 or Vendor's original invoice number
  supplierId: number;
  supplierName: string;
  supplierGstin?: string;
  purchaseDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMethod: 'Cash' | 'Bank' | 'UPI' | 'Cheque' | 'Credit';
  status: 'Paid' | 'Unpaid' | 'Partial';
  notes?: string;
  items: PurchaseItem[];
  createdAt?: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string; // e.g. PO-1001
  supplierId: number;
  supplierName: string;
  supplierPhone?: string;
  expectedDate?: string;
  orderDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
  items: PurchaseItem[];
  notes?: string;
  createdAt?: string;
}

export interface DebitNote {
  id: number;
  debitNoteNumber: string; // e.g. DN-2026-001
  purchaseBillId?: number;
  supplierId: number;
  supplierName: string;
  date: string;
  reason: 'Damaged Goods' | 'Defective' | 'Shortage' | 'Rate Difference' | 'Expired';
  totalAmount: number;
  items: PurchaseItem[];
  notes?: string;
  createdAt?: string;
}
