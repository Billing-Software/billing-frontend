export interface BillItem {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Bill {
  id: string;
  timestamp: string;
  customerName: string;
  items: BillItem[];
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card';
  status: 'Paid' | 'Pending';
}
