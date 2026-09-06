import { PurchaseBill, PurchaseOrder, DebitNote } from '../types/purchase.types';
import { supplierService } from './supplier.service';
import { apiClient } from './api.client';

const BILLS_KEY = 'billcom_purchase_bills';
const ORDERS_KEY = 'billcom_purchase_orders';
const DEBIT_NOTES_KEY = 'billcom_debit_notes';

const DEFAULT_BILLS: PurchaseBill[] = [
  {
    id: 1,
    billNumber: 'PUR-2026-001',
    supplierId: 1,
    supplierName: 'Balaji Agro & Rice Mills Pvt Ltd',
    supplierGstin: '37AAAAA0000A1Z5',
    purchaseDate: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    subtotal: 35000,
    taxAmount: 1750,
    totalAmount: 36750,
    paidAmount: 20000,
    balanceAmount: 16750,
    paymentMethod: 'Bank',
    status: 'Partial',
    notes: 'Bulk stock arrival for seasonal store demand',
    items: [
      {
        id: 1,
        itemName: 'Sona Masoori Raw Rice (25kg Bag)',
        hsnSac: '1006',
        unit: 'Bag',
        quantity: 25,
        unitPrice: 1400,
        gstRate: 5,
        taxAmount: 1750,
        lineTotal: 36750
      }
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 2,
    billNumber: 'PUR-2026-002',
    supplierId: 2,
    supplierName: 'Sri Lakshmi FMCG & Grocery Distributors',
    supplierGstin: '36BBBBB1111B2Z6',
    purchaseDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    subtotal: 12500,
    taxAmount: 2250,
    totalAmount: 14750,
    paidAmount: 14750,
    balanceAmount: 0,
    paymentMethod: 'UPI',
    status: 'Paid',
    notes: 'Paid via UPI instant settlement',
    items: [
      {
        id: 2,
        itemName: 'Tata Salt Pouch 1kg (Carton of 24)',
        hsnSac: '2501',
        unit: 'Box',
        quantity: 10,
        unitPrice: 500,
        gstRate: 18,
        taxAmount: 900,
        lineTotal: 5900
      },
      {
        id: 3,
        itemName: 'Freedom Sunflower Oil 1L (Carton of 12)',
        hsnSac: '1512',
        unit: 'Box',
        quantity: 5,
        unitPrice: 1500,
        gstRate: 18,
        taxAmount: 1350,
        lineTotal: 8850
      }
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const purchasesService = {
  // ── Purchase Bills ──
  getAllBills: async (): Promise<PurchaseBill[]> => {
    try {
      const stored = localStorage.getItem(BILLS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(BILLS_KEY, JSON.stringify(DEFAULT_BILLS));
      return DEFAULT_BILLS;
    } catch {
      return DEFAULT_BILLS;
    }
  },

  createBill: async (data: Omit<PurchaseBill, 'id' | 'createdAt'>): Promise<PurchaseBill> => {
    const list = await purchasesService.getAllBills();
    const newId = list.length > 0 ? Math.max(...list.map(b => b.id)) + 1 : 1;
    const newBill: PurchaseBill = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };

    // If there is an unpaid balance, update supplier payable
    if (newBill.balanceAmount > 0) {
      await supplierService.adjustBalance(newBill.supplierId, newBill.balanceAmount);
    }

    const updated = [newBill, ...list];
    localStorage.setItem(BILLS_KEY, JSON.stringify(updated));

    // Try backend sync if available
    try {
      await apiClient.post('/purchases', {
        vendorName: newBill.supplierName,
        invoiceNumber: newBill.billNumber,
        subtotal: newBill.subtotal,
        taxAmount: newBill.taxAmount,
        totalAmount: newBill.totalAmount,
        status: newBill.status,
        purchaseDate: newBill.purchaseDate,
        items: newBill.items.map(i => ({
          itemName: i.itemName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.lineTotal
        }))
      });
    } catch (e) {
      // Gracefully continue with local storage
    }

    return newBill;
  },

  deleteBill: async (id: number): Promise<boolean> => {
    const list = await purchasesService.getAllBills();
    const target = list.find(b => b.id === id);
    if (target && target.balanceAmount > 0) {
      await supplierService.adjustBalance(target.supplierId, -target.balanceAmount);
    }
    const filtered = list.filter(b => b.id !== id);
    localStorage.setItem(BILLS_KEY, JSON.stringify(filtered));
    return true;
  },

  // ── Purchase Orders ──
  getAllOrders: async (): Promise<PurchaseOrder[]> => {
    try {
      const stored = localStorage.getItem(ORDERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  createOrder: async (data: Omit<PurchaseOrder, 'id' | 'createdAt'>): Promise<PurchaseOrder> => {
    const list = await purchasesService.getAllOrders();
    const newId = list.length > 0 ? Math.max(...list.map(o => o.id)) + 1 : 1;
    const newOrder: PurchaseOrder = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };
    const updated = [newOrder, ...list];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    return newOrder;
  },

  // ── Debit Notes (Purchase Returns) ──
  getAllDebitNotes: async (): Promise<DebitNote[]> => {
    try {
      const stored = localStorage.getItem(DEBIT_NOTES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  createDebitNote: async (data: Omit<DebitNote, 'id' | 'createdAt'>): Promise<DebitNote> => {
    const list = await purchasesService.getAllDebitNotes();
    const newId = list.length > 0 ? Math.max(...list.map(d => d.id)) + 1 : 1;
    const newDebitNote: DebitNote = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };

    // Deduct payable balance from supplier
    await supplierService.adjustBalance(newDebitNote.supplierId, -newDebitNote.totalAmount);

    const updated = [newDebitNote, ...list];
    localStorage.setItem(DEBIT_NOTES_KEY, JSON.stringify(updated));
    return newDebitNote;
  }
};
