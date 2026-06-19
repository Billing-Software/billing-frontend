import { Customer, Service, InventoryItem, StaffMember, Bill, BusinessProfile, WhatsAppSettings } from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Walk-in Customer', phone: 'N/A', isWalkIn: true },
  { id: '2', name: 'John Doe', phone: '0987', email: 'john.doe@gmail.com' },
  { id: '3', name: 'Rahul Sharma', phone: '9876543210', email: 'rahul.s@outlook.com' },
  { id: '4', name: 'Priya Patel', phone: '8765432109', email: 'priya@patel.com' },
  { id: '5', name: 'Amit Kumar', phone: '7654321098', email: 'amit@kumar.com' },
  { id: '6', name: 'Sneha Gupta', phone: '6543210987', email: 'sneha@gupta.com' },
  { id: '7', name: 'Vikram Singh', phone: '5432109876', email: 'vikram@singh.com' }
];

export const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Premium Haircut',
    sku: 'SKU-HAIR-001',
    category: 'Hair Care',
    basePrice: 35.00,
    taxRate: 5.0,
    status: 'Active',
    iconName: 'content_cut'
  },
  {
    id: 's2',
    name: 'Beard Trim & Shape',
    sku: 'SKU-BEARD-002',
    category: 'Beard & Shave',
    basePrice: 20.00,
    taxRate: 5.0,
    status: 'Active',
    iconName: 'face'
  },
  {
    id: 's3',
    name: 'Head Massage',
    sku: 'SKU-MASS-003',
    category: 'Massage',
    basePrice: 25.00,
    taxRate: 5.0,
    status: 'Active',
    iconName: 'spa'
  },
  {
    id: 's4',
    name: 'Hair Color',
    sku: 'SKU-HAIR-004',
    category: 'Hair Care',
    basePrice: 60.00,
    taxRate: 7.5,
    status: 'Active',
    iconName: 'brush'
  },
  {
    id: 's5',
    name: 'Facial Scrub',
    sku: 'SKU-FACE-005',
    category: 'Products',
    basePrice: 40.00,
    taxRate: 5.0,
    status: 'Active',
    iconName: 'water_drop'
  },
  {
    id: 's6',
    name: 'Styling Gel Pro',
    sku: 'SKU-PROD-006',
    category: 'Products',
    basePrice: 15.00,
    taxRate: 18.0,
    status: 'Active',
    iconName: 'inventory'
  },
  {
    id: 's7',
    name: 'Standard Diagnostics',
    sku: 'SKU-DIA-001',
    category: 'Repair',
    basePrice: 85.00,
    taxRate: 7.5,
    status: 'Active',
    iconName: 'build'
  },
  {
    id: 's8',
    name: 'Annual Maintenance Contract',
    sku: 'SKU-AMC-012',
    category: 'Maintenance',
    basePrice: 450.00,
    taxRate: 0.0,
    status: 'Active',
    iconName: 'verified'
  },
  {
    id: 's9',
    name: 'On-site Consultation',
    sku: 'SKU-CON-005',
    category: 'Consulting',
    basePrice: 120.00,
    taxRate: 5.0,
    status: 'Inactive',
    iconName: 'support_agent'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'i1',
    name: 'Keratin Smooth Shampoo',
    sku: 'SHMP-001',
    category: 'Consumables',
    currentStock: 145,
    unit: 'Bottles (1L)',
    reorderLevel: 30,
    imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'i2',
    name: 'Replacement Screen (Model X)',
    sku: 'PART-SCR-X',
    category: 'Repair Parts',
    currentStock: 12,
    unit: 'Units',
    reorderLevel: 15,
    placeholderType: 'build'
  },
  {
    id: 'i3',
    name: 'Matte Styling Clay',
    sku: 'STYL-CLY-02',
    category: 'Retail Products',
    currentStock: 0,
    unit: 'Jars (100g)',
    reorderLevel: 20,
    imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'i4',
    name: 'Industrial Floor Cleaner',
    sku: 'CLN-FLR-5G',
    category: 'Consumables',
    currentStock: 8,
    unit: 'Gallons',
    reorderLevel: 5,
    placeholderType: 'cleaning'
  },
  {
    id: 'i5',
    name: 'Pro Shears (7-inch)',
    sku: 'TOOL-SHR-7',
    category: 'Tools',
    currentStock: 2,
    unit: 'Pairs',
    reorderLevel: 4,
    placeholderType: 'scissors'
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: '1', name: 'Sarah Jenkins', empCode: 'EMP-001', contact: 'sarah.j@smartbill.com', role: 'Manager', totalBills: 1245, revenueGen: 45200, status: 'Active' },
  { id: '2', name: 'Mike Chen', empCode: 'EMP-014', contact: 'mike.c@smartbill.com', role: 'Staff', totalBills: 856, revenueGen: 12450, status: 'Active' },
  { id: '3', name: 'Amanda Lee', empCode: 'EMP-022', contact: 'amanda.l@smartbill.com', role: 'Cashier', totalBills: 3420, revenueGen: 89100, status: 'Active' },
  { id: '4', name: 'David Ross', empCode: 'EMP-028', contact: 'david.r@smartbill.com', role: 'Staff', totalBills: 412, revenueGen: 8300, status: 'Active' }
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: '#INV-2041',
    timestamp: '10:42 AM',
    customerName: 'Rahul Sharma',
    items: [
      { serviceId: 's1', name: 'Premium Haircut', price: 35.0, quantity: 1 },
      { serviceId: 's2', name: 'Beard Trim & Shape', price: 20.0, quantity: 1 }
    ],
    subtotal: 55.00,
    discountCode: 'VIP10',
    discountAmount: 5.50,
    taxAmount: 2.47,
    totalAmount: 1250,
    paymentMethod: 'Cash',
    status: 'Paid'
  },
  {
    id: '#INV-2040',
    timestamp: '09:15 AM',
    customerName: 'Priya Patel',
    items: [
      { serviceId: 's2', name: 'Beard Trim & Shape', price: 20.0, quantity: 1 },
      { serviceId: 's3', name: 'Head Massage', price: 25.0, quantity: 1 }
    ],
    subtotal: 45.00,
    discountAmount: 0.0,
    taxAmount: 2.25,
    totalAmount: 850,
    paymentMethod: 'Card',
    status: 'Paid'
  },
  {
    id: '#INV-2039',
    timestamp: 'Yesterday',
    customerName: 'Amit Kumar',
    items: [
      { serviceId: 's4', name: 'Hair Color', price: 60.0, quantity: 2 }
    ],
    subtotal: 120.0,
    discountAmount: 0,
    taxAmount: 9.0,
    totalAmount: 4500,
    paymentMethod: 'UPI',
    status: 'Pending'
  },
  {
    id: '#INV-2038',
    timestamp: 'Yesterday',
    customerName: 'Sneha Gupta',
    items: [
      { serviceId: 's1', name: 'Premium Haircut', price: 35.0, quantity: 1 },
      { serviceId: 's5', name: 'Facial Scrub', price: 40.0, quantity: 1 }
    ],
    subtotal: 75.0,
    discountAmount: 7.5,
    taxAmount: 3.38,
    totalAmount: 3200,
    paymentMethod: 'Cash',
    status: 'Paid'
  },
  {
    id: '#INV-2037',
    timestamp: 'Yesterday',
    customerName: 'Vikram Singh',
    items: [
      { serviceId: 's2', name: 'Beard Trim & Shape', price: 20.0, quantity: 2 }
    ],
    subtotal: 40.0,
    discountAmount: 0.0,
    taxAmount: 2.0,
    totalAmount: 1100,
    paymentMethod: 'Card',
    status: 'Paid'
  }
];

export const INITIAL_BUSINESS_PROFILE: BusinessProfile = {
  legalName: 'Acme Corp Solutions',
  tradingName: 'Acme Retail',
  address: '123 Corporate Blvd, Suite 400',
  city: 'Metropolis',
  postalCode: '10001',
  gstIn: 'GSTIN-9876543210ABC',
  defaultTaxRate: '18% Standard',
  pricesIncludeTax: true
};

export const INITIAL_WHATSAPP: WhatsAppSettings = {
  apiKey: 'sk_test_1234567890abcdef',
  isConnected: true,
  templates: ['Invoice Sent', 'Payment Reminder']
};
