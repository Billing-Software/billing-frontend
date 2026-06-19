export interface BillItem {
  id?: number;
  serviceId: number;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Bill {
  id: number;
  billNumber: string;
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  customerName?: string;
  customerPhone?: string;
  staffName?: string;
  branchName?: string;
  items: BillItem[];
}
