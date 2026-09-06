import { Supplier } from '../types/purchase.types';

const STORAGE_KEY = 'billcom_suppliers';

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'Balaji Agro & Rice Mills Pvt Ltd',
    contactPerson: 'Suresh Kumar',
    phone: '9848011223',
    email: 'contact@balajiagro.in',
    gstin: '37AAAAA0000A1Z5',
    pan: 'AAAAA0000A',
    billingAddress: 'Plot 14, Industrial Estate, Vijayawada, AP - 520007',
    bankName: 'State Bank of India',
    accountNumber: '30291827364',
    ifscCode: 'SBIN0001234',
    openingBalance: 25000,
    currentBalance: 42500, // Payable
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Sri Lakshmi FMCG & Grocery Distributors',
    contactPerson: 'Ramesh Reddy',
    phone: '9849123456',
    email: 'lakshmifmcg@gmail.com',
    gstin: '36BBBBB1111B2Z6',
    pan: 'BBBBB1111B',
    billingAddress: 'Shop 22, Whole Market Yard, Guntur, AP - 522004',
    bankName: 'HDFC Bank',
    accountNumber: '50100234567891',
    ifscCode: 'HDFC0000456',
    openingBalance: 12000,
    currentBalance: 18400, // Payable
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Metro Tech & Mobile Accessories Hub',
    contactPerson: 'Kishore Varma',
    phone: '9988776655',
    email: 'metrotechhub@yahoo.com',
    gstin: '37CCCCC2222C3Z7',
    pan: 'CCCCC2222C',
    billingAddress: 'D.No 4-50, Jagadamba Junction, Visakhapatnam - 530002',
    bankName: 'ICICI Bank',
    accountNumber: '001205009876',
    ifscCode: 'ICIC0000012',
    openingBalance: 0,
    currentBalance: 0,
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

export const supplierService = {
  getAll: async (): Promise<Supplier[]> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SUPPLIERS));
      return DEFAULT_SUPPLIERS;
    } catch {
      return DEFAULT_SUPPLIERS;
    }
  },

  getById: async (id: number): Promise<Supplier | null> => {
    const list = await supplierService.getAll();
    return list.find(s => s.id === id) || null;
  },

  create: async (data: Omit<Supplier, 'id'>): Promise<Supplier> => {
    const list = await supplierService.getAll();
    const newId = list.length > 0 ? Math.max(...list.map(s => s.id)) + 1 : 1;
    const newSupplier: Supplier = {
      ...data,
      id: newId,
      currentBalance: Number(data.currentBalance ?? data.openingBalance ?? 0),
      createdAt: new Date().toISOString()
    };
    const updated = [newSupplier, ...list];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newSupplier;
  },

  update: async (id: number, data: Partial<Supplier>): Promise<Supplier | null> => {
    const list = await supplierService.getAll();
    const index = list.findIndex(s => s.id === id);
    if (index === -1) return null;
    const updatedSupplier = { ...list[index], ...data };
    list[index] = updatedSupplier;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return updatedSupplier;
  },

  adjustBalance: async (id: number, deltaAmount: number): Promise<void> => {
    const list = await supplierService.getAll();
    const supplier = list.find(s => s.id === id);
    if (supplier) {
      supplier.currentBalance = (Number(supplier.currentBalance) || 0) + deltaAmount;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  },

  delete: async (id: number): Promise<boolean> => {
    const list = await supplierService.getAll();
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
};
