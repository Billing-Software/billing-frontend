export interface BillItem {
  id?: number;
  serviceId: number;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  hsnSac?: string;
  mrp?: number;
  batchNumber?: string;
  expiryDate?: string;
  unit?: string;
}

export interface Bill {
  id: number;
  billNumber: string;
  subtotal: number;
  discountCode?: string;
  discountPercent?: number;
  discountAmount: number;
  additionalCharges?: number;
  additionalChargesLabel?: string;
  shippingCharges?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  cessAmount?: number;
  taxAmount: number;
  roundOff?: number;
  totalAmount: number;
  previousBalance?: number;
  netDue?: number;
  paymentMethod: string;
  paidAmount?: number;
  balanceDue?: number;
  status: string;
  createdAt: string;
  dueDate?: string;
  transactionType?: string;
  notes?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerStateCode?: string;
  transportName?: string;
  vehicleNumber?: string;
  staffName?: string;
  branchName?: string;
  items: BillItem[];
}

