import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  History,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Send,
  CheckCircle,
  Percent,
  Loader2,
  Calendar,
  Truck,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
  Share2,
  AlertTriangle,
  Tag,
  Clock,
  Sparkles,
  Pause,
  Play,
  FolderArchive,
  ArrowRightCircle
} from 'lucide-react';
import { Service, Customer, BillItem, Bill } from '../../types';

export type DocumentType = 'Sale Invoice' | 'Estimate' | 'Delivery Challan' | 'Credit Note';

export interface HeldCart {
  id: string;
  heldAt: string;
  documentType: DocumentType;
  customerId: number | null;
  customerName: string;
  customerPhone?: string;
  cart: BillItem[];
  subtotal: number;
  totalAmount: number;
  discountCode?: string;
  activeDiscountPercent?: number;
  billDiscountFlat?: number;
  shippingCharges?: number;
  additionalCharges?: number;
  additionalChargesLabel?: string;
  dueDate?: string;
  invoiceNotes?: string;
}

import { customerService } from '../../services/customer.service';
import { serviceCatalogService } from '../../services/service.service';
import { billService } from '../../services/bill.service';
import { branchService } from '../../services/branch.service';
import { categoryService, Category } from '../../services/category.service';
import { businessService } from '../../services/business.service';
import { printBill } from '../../utils/invoicePrintEngine';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { smsService } from '../../services/sms.service';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import HSNSacSearchModal from '../../components/tax/HSNSacSearchModal';

export default function Billing() {
  const { currentUser, currentBranch } = useAuth();
  const { showToast } = useToast();
  const { config, t } = useBusinessConfig();

  // API Scoped States
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Quick Item & HSN Modal States
  const [isQuickItemModalOpen, setIsQuickItemModalOpen] = useState<boolean>(false);
  const [quickItemName, setQuickItemName] = useState<string>('');
  const [quickItemPrice, setQuickItemPrice] = useState<string>('');
  const [quickItemTaxRate, setQuickItemTaxRate] = useState<number>(18);
  const [quickItemHsnSac, setQuickItemHsnSac] = useState<string>('');
  const [quickItemSaveToCatalog, setQuickItemSaveToCatalog] = useState<boolean>(true);

  const [isHsnModalOpen, setIsHsnModalOpen] = useState<boolean>(false);
  const [hsnSearchType, setHsnSearchType] = useState<'Goods' | 'Services'>('Goods');

  // POS States
  const [cart, setCart] = useState<BillItem[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Bill-wise Discount & Charges
  const [discountCode, setDiscountCode] = useState<string>('');
  const [activeDiscountCode, setActiveDiscountCode] = useState<string>('');
  const [activeDiscountPercent, setActiveDiscountPercent] = useState<number>(0);
  const [billDiscountType, setBillDiscountType] = useState<'percent' | 'flat'>('percent');
  const [billDiscountFlat, setBillDiscountFlat] = useState<number>(0);

  // Additional charges & Shipping
  const [shippingCharges, setShippingCharges] = useState<number>(0);
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);
  const [additionalChargesLabel, setAdditionalChargesLabel] = useState<string>('Packaging');
  const [isChargesExpanded, setIsChargesExpanded] = useState<boolean>(false);

  // Round Off & Due Date & Notes
  const [autoRoundOff, setAutoRoundOff] = useState<boolean>(true);
  const [dueDate, setDueDate] = useState<string>('');
  const [invoiceNotes, setInvoiceNotes] = useState<string>('');
  const [isNotesExpanded, setIsNotesExpanded] = useState<boolean>(false);

  // Document Type selection (Vyapar Transaction Engine)
  const [documentType, setDocumentType] = useState<DocumentType>('Sale Invoice');

  // Held Carts (Multi-Cart / Park Bill)
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    try {
      const saved = localStorage.getItem('billcom_held_carts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState<boolean>(false);

  // Active discount item editor state (serviceId -> boolean)
  const [editingItemDiscountId, setEditingItemDiscountId] = useState<number | null>(null);

  // Payment methods: 'Cash' | 'UPI' | 'Card'
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');

  // Add Customer modal / form view state
  const [isAddingCustomer, setIsAddingCustomer] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Search clients state
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');

  // Invoice success feedback state
  const [generatedBill, setGeneratedBill] = useState<Bill | null>(null);

  // Checkout loading/progress state
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [servicesData, customersData, branchesData, categoriesData, profileData] = await Promise.all([
        serviceCatalogService.getAll(),
        customerService.getAll(),
        branchService.getAll(),
        categoryService.getAll(),
        businessService.getProfile().catch(() => null)
      ]);

      setServices(servicesData);
      setBranches(branchesData);
      setDbCategories(categoriesData.filter((c: any) => c.type === 'Service'));
      if (profileData) setBusinessProfile(profileData);

      let activeCusts = customersData;
      let walkIn = customersData.find((c: any) => c.isWalkIn);

      setCustomers(activeCusts);

      if (walkIn) {
        setSelectedCustomerId(walkIn.id);
      } else if (activeCusts.length > 0) {
        setSelectedCustomerId(activeCusts[0].id);
      }

      if (branchesData.length > 0) {
        // Find branch matching currentBranch object ID
        const matched = branchesData.find(
          (b: any) => b.id === currentBranch?.id
        ) || branchesData[0];
        setSelectedBranchId(matched.id);
      }
    } catch (e) {
      console.error('Error fetching billing data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [currentBranch?.id]);

  // Load persistent cart state from local storage on load
  useEffect(() => {
    const saved = localStorage.getItem('billcom_pos_cart') || localStorage.getItem('smartbill_pos_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse persistent POS cart:', err);
      }
    }
  }, []);

  // Sync cart mutations to local storage immediately
  useEffect(() => {
    localStorage.setItem('billcom_pos_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync held carts to local storage
  useEffect(() => {
    localStorage.setItem('billcom_held_carts', JSON.stringify(heldCarts));
  }, [heldCarts]);

  // Check for Estimate/Quotation convert-to-sale navigation trigger
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('billcom_convert_bill');
      if (raw) {
        const conv = JSON.parse(raw);
        sessionStorage.removeItem('billcom_convert_bill');
        if (conv.items && conv.items.length > 0) {
          setCart(conv.items);
        }
        if (conv.customerId) {
          setSelectedCustomerId(conv.customerId);
        }
        setDocumentType('Sale Invoice');
        showToast(`Estimate ${conv.billNumber || ''} loaded into POS for Sale Invoice checkout!`, 'success');
      }
    } catch (err) {
      console.error('Failed to parse bill conversion session data', err);
    }
  }, [customers]);

  // Selected customer info
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0] || { name: 'Walk-In Customer', phone: 'N/A' };

  // Helper: Icons mapper
  const getCategoryIcon = (imageUrl: string) => {
    if (imageUrl && (imageUrl.startsWith('http') || imageUrl.includes('/uploads/'))) {
      return <img src={imageUrl} alt="Service Icon" className="w-full h-full object-cover rounded-full" />;
    }
    switch (imageUrl) {
      case 'content_cut': return <span className="font-sans font-semibold text-lg">✂️</span>;
      case 'face': return <span className="font-sans font-semibold text-lg">👤</span>;
      case 'spa': return <span className="font-sans font-semibold text-lg">🌸</span>;
      case 'brush': return <span className="font-sans font-semibold text-lg">🎨</span>;
      case 'water_drop': return <span className="font-sans font-semibold text-lg">💧</span>;
      default: return <span className="font-sans font-semibold text-lg">📦</span>;
    }
  };

  // Add Item to Bill Cart
  const handleAddService = (service: Service) => {
    setCart(prev => {
      const existing = prev.find(item => item.serviceId === service.id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        const gross = nextQty * existing.unitPrice;
        const disc = existing.discountPercent ? (gross * existing.discountPercent) / 100 : (existing.discountAmount || 0);
        return prev.map(item =>
          item.serviceId === service.id
            ? { ...item, quantity: nextQty, lineTotal: Math.max(0, gross - disc) }
            : item
        );
      } else {
        return [...prev, {
          serviceId: service.id,
          serviceName: service.name,
          unitPrice: service.basePrice,
          quantity: 1,
          lineTotal: service.basePrice,
          taxPercent: (service as any).taxRate || 18,
          hsnSac: (service as any).hsnSac || '',
          discountPercent: 0,
          discountAmount: 0
        }];
      }
    });
  };

  // Adjust item quantity
  const handleUpdateQty = (serviceId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.serviceId === serviceId) {
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return item;
          const gross = nextQty * item.unitPrice;
          const disc = item.discountPercent ? (gross * item.discountPercent) / 100 : (item.discountAmount || 0);
          return { ...item, quantity: nextQty, lineTotal: Math.max(0, gross - disc) };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  // Adjust item-wise discount (% or ₹)
  const handleUpdateItemDiscount = (serviceId: number, discountPercent: number) => {
    setCart(prev => prev.map(item => {
      if (item.serviceId === serviceId) {
        const gross = item.quantity * item.unitPrice;
        const disc = (gross * (discountPercent || 0)) / 100;
        return {
          ...item,
          discountPercent,
          discountAmount: disc,
          lineTotal: Math.max(0, gross - disc)
        };
      }
      return item;
    }));
  };

  // Remove Item
  const handleRemoveItem = (serviceId: number) => {
    setCart(prev => prev.filter(item => item.serviceId !== serviceId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);

  // Bill-level discount
  let billDiscountAmount = 0;
  if (billDiscountType === 'percent') {
    const pct = activeDiscountPercent > 0 ? activeDiscountPercent : 0;
    billDiscountAmount = (subtotal * pct) / 100;
  } else {
    billDiscountAmount = Math.min(subtotal, Number(billDiscountFlat || 0));
  }

  // Net taxable subtotal
  const taxableSubtotal = Math.max(0, subtotal - billDiscountAmount);

  // GST Engine: Inter-state vs Intra-state
  const sellerState = businessProfile?.stateCode || (businessProfile?.gstIn ? businessProfile.gstIn.substring(0, 2) : '36');
  const buyerState = activeCustomer?.stateCode || (activeCustomer?.gstin ? activeCustomer.gstin.substring(0, 2) : sellerState);
  const isInterState = Boolean(sellerState && buyerState && sellerState !== buyerState);

  // Tax calculation (standard 18% or average from items)
  const taxRate = 18;
  const rawTax = taxableSubtotal * (taxRate / 100);

  const cgstAmount = isInterState ? 0 : Number((rawTax / 2).toFixed(2));
  const sgstAmount = isInterState ? 0 : Number((rawTax / 2).toFixed(2));
  const igstAmount = isInterState ? Number(rawTax.toFixed(2)) : 0;
  const taxAmount = isInterState ? igstAmount : Number((cgstAmount + sgstAmount).toFixed(2));

  // Pre-round total
  const preRoundTotal = taxableSubtotal + taxAmount + Number(shippingCharges || 0) + Number(additionalCharges || 0);

  // Auto round off
  const totalAmount = autoRoundOff ? Math.round(preRoundTotal) : Number(preRoundTotal.toFixed(2));
  const roundOff = autoRoundOff ? Number((totalAmount - preRoundTotal).toFixed(2)) : 0;

  // Cart Hold & Recall Handlers (Multi-Cart / Park Bill)
  const handleHoldCart = () => {
    if (cart.length === 0) {
      showToast("Cart is empty! Add items first to hold.", "warning");
      return;
    }
    const newHeld: HeldCart = {
      id: `HELD-${Date.now()}`,
      heldAt: new Date().toISOString(),
      documentType,
      customerId: selectedCustomerId,
      customerName: activeCustomer?.name || 'Walk-In Customer',
      customerPhone: activeCustomer?.phone !== 'N/A' ? activeCustomer?.phone : undefined,
      cart: [...cart],
      subtotal,
      totalAmount,
      discountCode: activeDiscountCode,
      activeDiscountPercent,
      billDiscountFlat,
      shippingCharges,
      additionalCharges,
      additionalChargesLabel,
      dueDate,
      invoiceNotes
    };

    setHeldCarts(prev => [newHeld, ...prev]);
    setCart([]);
    setDiscountCode('');
    setActiveDiscountCode('');
    setActiveDiscountPercent(0);
    setBillDiscountFlat(0);
    setShippingCharges(0);
    setAdditionalCharges(0);
    setDueDate('');
    setInvoiceNotes('');
    showToast(`Bill parked on Hold for ${activeCustomer?.name || 'Customer'}! (Held Carts: ${heldCarts.length + 1})`, 'info');
  };

  const handleRecallCart = (held: HeldCart) => {
    setCart(held.cart);
    if (held.customerId) setSelectedCustomerId(held.customerId);
    setDocumentType(held.documentType);
    if (held.activeDiscountPercent) setActiveDiscountPercent(held.activeDiscountPercent);
    if (held.discountCode) setActiveDiscountCode(held.discountCode);
    if (held.billDiscountFlat) setBillDiscountFlat(held.billDiscountFlat);
    if (held.shippingCharges) setShippingCharges(held.shippingCharges);
    if (held.additionalCharges) setAdditionalCharges(held.additionalCharges);
    if (held.additionalChargesLabel) setAdditionalChargesLabel(held.additionalChargesLabel);
    if (held.dueDate) setDueDate(held.dueDate);
    if (held.invoiceNotes) setInvoiceNotes(held.invoiceNotes);

    setHeldCarts(prev => prev.filter(c => c.id !== held.id));
    setIsHeldCartsModalOpen(false);
    showToast(`Cart for ${held.customerName} resumed on POS register!`, 'success');
  };

  const handleDiscardHeldCart = (id: string) => {
    setHeldCarts(prev => prev.filter(c => c.id !== id));
    showToast("Parked cart discarded.", "info");
  };

  // Global Keyboard Shortcuts (Ctrl+Enter to Checkout, Esc to close modals, F6 to Hold Cart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const submitBtn = document.getElementById('checkout-submit-btn');
        if (submitBtn && !submitBtn.hasAttribute('disabled')) {
          handleCheckout();
        }
      }
      if (e.key === 'F6') {
        e.preventDefault();
        handleHoldCart();
      }
      if (e.key === 'Escape') {
        if (isHeldCartsModalOpen) setIsHeldCartsModalOpen(false);
        if (isQuickItemModalOpen) setIsQuickItemModalOpen(false);
        if (isHsnModalOpen) setIsHsnModalOpen(false);
        if (isAddingCustomer) setIsAddingCustomer(false);
        if (generatedBill) setGeneratedBill(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedBranchId, selectedCustomerId, isCheckingOut, isQuickItemModalOpen, isHsnModalOpen, isAddingCustomer, generatedBill, isHeldCartsModalOpen, documentType]);

  // Trigger New Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    try {
      const newCust = await customerService.create({
        name: newCustName,
        phone: newCustPhone,
        isWalkIn: false
      });
      setCustomers(prev => [...prev, newCust]);
      setSelectedCustomerId(newCust.id);
      setIsAddingCustomer(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (err: any) {
      showToast("Error saving customer: " + (err.response?.data || err.message), "error");
    }
  };

  // Trigger Bill compilation
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast("Please add services to the current bill first!", "warning");
      return;
    }
    if (!selectedBranchId) {
      showToast("No branch selected. Please verify branch configuration.", "error");
      return;
    }
    if (!selectedCustomerId) {
      showToast("No client selected. Please choose or register a client.", "warning");
      return;
    }

    setIsCheckingOut(true);

    try {
      const itemsDto = cart.map(item => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.lineTotal
      }));

      // Generate Document Display Reference based on active documentType
      const prefix = documentType === 'Estimate' ? 'EST-' :
                     documentType === 'Delivery Challan' ? 'DC-' :
                     documentType === 'Credit Note' ? 'CN-' : 'INV-';
      const billNumber = `${prefix}${Date.now().toString().slice(-6)}`;
      const docStatus = documentType === 'Estimate' ? 'Estimate' :
                        documentType === 'Delivery Challan' ? 'Dispatched' :
                        documentType === 'Credit Note' ? 'Refunded' : 'Paid';

      // Generate a unique idempotency key to prevent double charge / duplicate bills
      const idempotencyKey = window.crypto?.randomUUID ? window.crypto.randomUUID() : (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

      const billPayload = {
        branchId: selectedBranchId,
        customerId: selectedCustomerId,
        createdByStaffId: currentUser?.staffId || null,
        billNumber,
        subtotal,
        discountCode: activeDiscountPercent > 0 ? (activeDiscountCode || `${activeDiscountPercent}%`) : (billDiscountFlat > 0 ? `₹${billDiscountFlat}` : null),
        discountAmount: billDiscountAmount,
        taxAmount,
        totalAmount,
        paymentMethod: documentType === 'Estimate' ? 'Quotation Pending' : paymentMethod,
        status: docStatus,
        transactionType: documentType,
        idempotencyKey,
        items: itemsDto
      };

      const created = await billService.create(billPayload);

      // Construct frontend state mapping with complete metadata for rich invoice printing
      const mappedBill: Bill = {
        id: created.id,
        billNumber: created.billNumber || billNumber,
        subtotal: created.subtotal,
        discountCode: created.discountCode || undefined,
        discountAmount: billDiscountAmount,
        shippingCharges: Number(shippingCharges || 0),
        additionalCharges: Number(additionalCharges || 0),
        additionalChargesLabel,
        cgstAmount,
        sgstAmount,
        igstAmount,
        taxAmount,
        roundOff,
        totalAmount,
        paymentMethod: documentType === 'Estimate' ? 'Quotation Pending' : paymentMethod,
        status: docStatus,
        transactionType: documentType,
        createdAt: created.createdAt || new Date().toISOString(),
        dueDate: dueDate || undefined,
        notes: invoiceNotes || undefined,
        customerName: activeCustomer.name,
        customerPhone: activeCustomer.phone,
        customerGstin: (activeCustomer as any).gstin,
        customerAddress: (activeCustomer as any).billingAddress,
        customerStateCode: (activeCustomer as any).stateCode,
        branchName: currentBranch?.name || 'Main Branch',
        items: cart.map(i => ({
          serviceId: i.serviceId,
          serviceName: i.serviceName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.lineTotal,
          discountPercent: i.discountPercent,
          discountAmount: i.discountAmount,
          taxPercent: i.taxPercent,
          hsnSac: i.hsnSac
        }))
      };

      setGeneratedBill(mappedBill);
      setCart([]); // Clear cart (automatically clears local storage)
      showToast(`${documentType} processed successfully!`, "success");

      // Send invoice via SMS if customer has a valid phone number
      if (activeCustomer.phone && activeCustomer.phone !== 'N/A') {
        try {
          const res = await smsService.sendInvoiceSms(created.id, activeCustomer.phone);
          if (res.success) {
            showToast(`Invoice sent to ${activeCustomer.phone} via SMS`, "success");
          }
        } catch (smsErr: any) {
          console.error("SMS dispatch failed:", smsErr);
          showToast("Bill generated, but SMS transmission failed: " + (smsErr.response?.data?.error || smsErr.message), "warning");
        }
      }
    } catch (err: any) {
      showToast("Error compiling bill: " + (err.response?.data || err.message), "error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Discount code application helper
  const handleApplyPromo = () => {
    if (discountCode.toUpperCase() === 'VIP10') {
      setActiveDiscountCode('VIP10');
      setActiveDiscountPercent(10);
      showToast("Promo 'VIP10' applied! 10% Discount included.", "success");
    } else if (discountCode.endsWith('%')) {
      const parsedVal = parseInt(discountCode.replace('%', ''));
      if (!isNaN(parsedVal) && parsedVal >= 0 && parsedVal <= 100) {
        setActiveDiscountCode(`CUSTOM-${parsedVal}%`);
        setActiveDiscountPercent(parsedVal);
        showToast(`Custom ${parsedVal}% promo rate injected!`, "success");
      }
    } else {
      setActiveDiscountCode('CUSTOM');
      setActiveDiscountPercent(5);
      showToast("Custom coupon registered: 5% flat discount activated!", "success");
    }
    setDiscountCode('');
  };

  // Filter service catalog
  const filteredServices = services
    .filter(s => s.status === 'Active')
    .filter(s => {
      let matchesCategory = true;
      if (selectedCategoryIds.length > 0) {
        const allowedNames = selectedCategoryIds.flatMap(id => getDescendantNames(id, dbCategories));
        matchesCategory = allowedNames.includes(s.category.toLowerCase());
      }
      const matchesQuery = s.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(filterQuery.toLowerCase()) ||
        s.sku.toLowerCase().includes(filterQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });

  // Filter clients/customers list
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.phone.includes(clientSearchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[#006a61]" size={36} />
        <p className="text-sm text-[#7c839b] font-bold uppercase tracking-wider">Synchronizing POS Terminals...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Top Document Engine & Multi-Cart Hold Bar (Vyapar Parity) */}
      <div className="lg:col-span-12 bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setDocumentType('Sale Invoice')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              documentType === 'Sale Invoice'
                ? 'bg-[#006a61] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🧾</span>
            <span>Sale Invoice (GST)</span>
          </button>
          <button
            type="button"
            onClick={() => setDocumentType('Estimate')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              documentType === 'Estimate'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>📝</span>
            <span>Estimate / Quotation</span>
          </button>
          <button
            type="button"
            onClick={() => setDocumentType('Delivery Challan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              documentType === 'Delivery Challan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>🚚</span>
            <span>Delivery Challan</span>
          </button>
          <button
            type="button"
            onClick={() => setDocumentType('Credit Note')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              documentType === 'Credit Note'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>↩️</span>
            <span>Credit Note (Return)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Hold Cart Action Button */}
          <button
            type="button"
            onClick={handleHoldCart}
            disabled={cart.length === 0}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
            title="Park current cart to serve next customer (Shortcut: F6)"
          >
            <Pause size={13} className="text-amber-700" />
            <span>Hold Bill</span>
            <kbd className="text-[10px] bg-amber-200/70 px-1 py-0.2 rounded font-mono font-bold">F6</kbd>
          </button>

          {/* Held Carts Recall Button */}
          <button
            type="button"
            onClick={() => setIsHeldCartsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative cursor-pointer shadow-xs"
          >
            <FolderArchive size={13} className="text-slate-600" />
            <span>Parked Carts</span>
            {heldCarts.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full leading-tight">
                {heldCarts.length}
              </span>
            )}
          </button>

          {/* Clear Cart Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all items from the current cart?')) {
                  setCart([]);
                  showToast('Cart cleared', 'info');
                }
              }}
              className="px-2.5 py-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              title="Clear current cart"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Left Columns: Services list & Client search */}
      <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">

        {/* Customer Details Panel */}
        <section className="bg-white rounded-xl p-5 border border-[#e2e8f0]/80 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-lg font-bold text-[#0b1c30]">Customer Details</h2>
            {isAddingCustomer ? (
              <button
                onClick={() => setIsAddingCustomer(false)}
                className="text-xs font-semibold text-[#ba1a1a]"
              >
                Cancel
              </button>
            ) : (
              <button
                id="open-customer-modal-btn"
                onClick={() => setIsAddingCustomer(true)}
                className="text-xs font-bold text-[#006f66] flex items-center gap-1"
              >
                <Plus size={14} /> New Client
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isAddingCustomer ? (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateCustomer}
                className="space-y-3 bg-[#eff4ff]/30 p-4 rounded-lg border border-[#e2e8f0]/40 mb-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#7c839b] uppercase tracking-wider block mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#7c839b] uppercase tracking-wider block mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#006a61] text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-opacity-90"
                >
                  Save & Select
                </button>
              </motion.form>
            ) : null}
          </AnimatePresence>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
              <input
                id="customer-search-input"
                type="text"
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder="Search walk-in or phone (e.g. John/0987)..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-[#c6c6cd] rounded-lg font-sans text-xs font-semibold text-[#0b1c30] focus:border-[#006a61] focus:ring-2 focus:ring-[#006a61]/10 outline-none transition-all placeholder-[#7c839b]/60"
              />
            </div>
          </div>

          {/* Quick Customer Selection Chips */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filteredCustomers.slice(0, 5).map(cust => {
              const isSelected = selectedCustomerId === cust.id;
              return (
                <button
                  key={cust.id}
                  id={`cust-chip-${cust.id}`}
                  onClick={() => setSelectedCustomerId(cust.id)}
                  type="button"
                  className={`shrink-0 px-3 py-1.5 border rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${isSelected
                      ? 'bg-[#86f2e4]/20 border-[#006a61] text-[#006f66] scale-[0.98]'
                      : 'bg-white border-[#e2e8f0] text-[#45464d] hover:border-[#7c839b]'
                    }`}
                >
                  {cust.isWalkIn ? <History size={12} /> : null}
                  <span>{cust.name} {cust.phone !== 'N/A' ? `(${cust.phone})` : ''}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Quick Service / Product Catalog Selector */}
        <section className="bg-white rounded-xl p-5 border border-[#e2e8f0]/80 shadow-sm flex-1 flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0b1c30]">
                Quick {t('product', true)} & {t('service', true)}
              </h2>
              <p className="text-[11px] text-[#7c839b] font-medium">Select items or scan barcode to add to {t('invoice')}</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7c839b]" />
                <input
                  id="service-filter-input"
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder={`Search ${t('product', true)} / ${t('service', true)}...`}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#c6c6cd] rounded-lg font-sans text-xs focus:border-[#006a61] focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsQuickItemModalOpen(true)}
                className="bg-[#006a61]/10 text-[#006a61] hover:bg-[#006a61] hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Quick Item</span>
              </button>
            </div>
          </div>

          {/* Category Chips Horizontal Filter List */}
          <div className="relative shrink-0 flex items-center gap-3 mb-4 pb-3 border-b border-[#e2e8f0]/50 select-none">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all select-none ${selectedCategoryIds.length > 0
                  ? 'bg-[#006a61]/10 border-[#006a61] text-[#006f66]'
                  : 'bg-[#eff4ff] border-transparent text-[#45464d] hover:bg-[#dce9ff]'
                }`}
            >
              <span>Filter Categories</span>
              {selectedCategoryIds.length > 0 && (
                <span className="bg-[#006a61] text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                  {selectedCategoryIds.length}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className="absolute top-9 left-0 z-50 w-72 max-h-[350px] overflow-y-auto bg-white border border-[#e2e8f0] rounded-xl shadow-lg p-3 space-y-2 mt-1">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Categories</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategoryIds([]);
                      }}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-1">
                    {dbCategories.length === 0 ? (
                      <p className="text-[10px] text-gray-400 font-semibold italic text-center py-2">No categories configured</p>
                    ) : (() => {
                      const tree = buildCategoryTree(dbCategories);
                      const flat = flattenCategoryTree(tree);
                      return flat.map(({ category: c, depth }) => {
                        const isChecked = selectedCategoryIds.includes(c.id);
                        return (
                          <label key={c.id} style={{ marginLeft: `${depth * 16}px` }} className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-[#f8f9ff] cursor-pointer text-xs font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedCategoryIds(prev => {
                                  const temp = new Set<number>(prev);
                                  toggleCategoryCheck(c.id, checked, dbCategories, temp);
                                  return Array.from(temp);
                                });
                              }}
                              className="accent-[#006a61] h-3.5 w-3.5 rounded border-gray-300"
                            />
                            <span>{c.name}</span>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>
              </>
            )}

            {/* Display Selected Categories as Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
              {selectedCategoryIds.length === 0 ? (
                <span className="px-2.5 py-1 text-[10px] bg-[#eff4ff] text-[#45464d] rounded-md font-bold italic">
                  Showing all categories
                </span>
              ) : (
                dbCategories
                  .filter(c => selectedCategoryIds.includes(c.id))
                  .map(c => (
                    <span
                      key={c.id}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-[#006a61]/5 border border-[#006a61]/25 text-[#006f66] text-[10px] font-bold rounded-md"
                    >
                      {c.name}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryIds(prev => {
                            const temp = new Set<number>(prev);
                            toggleCategoryCheck(c.id, false, dbCategories, temp);
                            return Array.from(temp);
                          });
                        }}
                        className="hover:text-red-500 font-sans font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))
              )}
            </div>
          </div>

          {/* Service Cards Grid layout */}
          <div className="flex-1 overflow-y-auto max-h-[350px] pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
              {filteredServices.map(service => (
                <button
                  key={service.id}
                  id={`service-card-${service.id}`}
                  onClick={() => handleAddService(service)}
                  className="group flex flex-col items-center justify-center p-4 bg-white border border-[#e2e8f0]/60 rounded-xl hover:border-[#006a61] hover:shadow-sm transition-all aspect-square relative overflow-hidden"
                >
                  <div className="w-12 h-12 bg-[#eff4ff] rounded-full flex items-center justify-center mb-2 group-hover:bg-[#86f2e4] transition-colors leading-none">
                    {getCategoryIcon(service.imageUrl)}
                  </div>
                  <span className="font-sans text-xs font-semibold text-[#0b1c30] text-center line-clamp-2 leading-tight">
                    {service.name}
                  </span>
                  <span className="font-sans text-xs font-bold text-[#006f66] mt-1.5">
                    ₹{service.basePrice.toLocaleString()}
                  </span>
                  <div className="absolute inset-0 bg-[#006a61]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </button>
              ))}

              {filteredServices.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <p className="text-xs text-[#7c839b] font-medium">No active services match the filters.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Checkout Summary & Live totals */}
      <aside className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0]/80 shadow-sm flex flex-col min-h-[460px] relative justify-between">
          <div>
            {/* Invoice Banner info */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#e2e8f0]/40">
              <h2 className="font-display text-base font-bold text-[#0b1c30] flex items-center gap-1.5">
                <Receipt className={
                  documentType === 'Estimate' ? 'text-amber-600' :
                  documentType === 'Delivery Challan' ? 'text-blue-600' :
                  documentType === 'Credit Note' ? 'text-purple-600' : 'text-[#006f66]'
                } size={16} />
                <span>{documentType}</span>
              </h2>
              <span className={`font-sans text-[10px] font-bold px-2 py-0.5 rounded-md ${
                documentType === 'Estimate' ? 'bg-amber-100 text-amber-800' :
                documentType === 'Delivery Challan' ? 'bg-blue-100 text-blue-800' :
                documentType === 'Credit Note' ? 'bg-purple-100 text-purple-800' : 'bg-[#eff4ff] text-[#45464d]'
              }`}>
                #{documentType === 'Estimate' ? 'EST-LIVE' :
                  documentType === 'Delivery Challan' ? 'DC-LIVE' :
                  documentType === 'Credit Note' ? 'CN-LIVE' : 'INV-LIVE'}
              </span>
            </div>

            {/* Selected Client HUD */}
            <div className="p-3 bg-[#eff4ff]/70 border border-[#e2e8f0]/60 rounded-xl mb-3 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#7c839b] leading-none">Billing Client</p>
                {activeCustomer.currentBalance !== undefined && activeCustomer.currentBalance !== 0 && (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                    activeCustomer.currentBalance > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {activeCustomer.currentBalance > 0
                      ? `You'll Get ₹${activeCustomer.currentBalance.toLocaleString()}`
                      : `Advance ₹${Math.abs(activeCustomer.currentBalance).toLocaleString()}`}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-[#0b1c30] leading-tight">
                {activeCustomer.name} {activeCustomer.phone !== 'N/A' ? `(${activeCustomer.phone})` : ''}
              </h4>
              {(activeCustomer as any).gstin && (
                <div className="text-[10px] text-slate-500 font-mono">
                  GSTIN: <span className="font-bold text-slate-700">{(activeCustomer as any).gstin}</span>
                </div>
              )}
              {(activeCustomer as any).creditLimit && ((activeCustomer.currentBalance || 0) + totalAmount > (activeCustomer as any).creditLimit) && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 p-1 rounded border border-red-200 mt-1">
                  <AlertTriangle size={12} className="shrink-0" />
                  <span>Exceeds Credit Limit ₹{(activeCustomer as any).creditLimit.toLocaleString()}!</span>
                </div>
              )}
            </div>

            {/* Selected items list */}
            <div className="space-y-2 overflow-y-auto max-h-[190px] pr-1">
              {cart.map(item => (
                <div
                  key={item.serviceId}
                  className="flex flex-col p-2.5 bg-[#f8f9ff] border border-[#e2e8f0]/40 rounded-xl hover:border-[#006a61]/35 transition-all group gap-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-sans text-xs font-bold text-[#0b1c30] truncate leading-tight">{item.serviceName}</h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[#7c839b]">
                        <span className="text-[10px] font-semibold">₹{item.unitPrice.toLocaleString()}</span>
                        <span className="text-[9px] font-semibold">x</span>
                        {/* Counter triggers adjustment */}
                        <div className="flex items-center bg-[#eff4ff] rounded border border-[#e2e8f0]">
                          <button
                            onClick={() => handleUpdateQty(item.serviceId, -1)}
                            className="px-1 hover:bg-[#c6c6cd]/20 rounded-l cursor-pointer"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-1.5 text-[10px] font-bold text-[#0b1c30] leading-none">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.serviceId, 1)}
                            className="px-1 hover:bg-[#c6c6cd]/20 rounded-r cursor-pointer"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        {/* Inline Item Discount Toggle */}
                        <button
                          type="button"
                          onClick={() => setEditingItemDiscountId(editingItemDiscountId === item.serviceId ? null : item.serviceId)}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            item.discountPercent
                              ? 'bg-teal-100 text-teal-800 border-teal-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title="Set Item Discount"
                        >
                          {item.discountPercent ? `${item.discountPercent}% OFF` : '+ Disc'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.discountPercent ? (
                        <div className="text-right">
                          <span className="text-[10px] line-through text-slate-400">₹{(item.quantity * item.unitPrice).toLocaleString()}</span>
                          <div className="text-xs font-bold text-teal-700">₹{item.lineTotal.toLocaleString()}</div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-[#0b1c30]">₹{item.lineTotal.toLocaleString()}</span>
                      )}
                      <button
                        onClick={() => handleRemoveItem(item.serviceId)}
                        className="text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Inline Item Discount Input popover */}
                  {editingItemDiscountId === item.serviceId && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200 bg-white p-1.5 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-600">Line Discount:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        autoFocus
                        placeholder="%"
                        value={item.discountPercent || ''}
                        onChange={(e) => handleUpdateItemDiscount(item.serviceId, Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-16 px-1.5 py-0.5 text-xs font-bold border border-teal-500 rounded outline-none"
                      />
                      <span className="text-[10px] text-slate-500">%</span>
                      <button
                        type="button"
                        onClick={() => setEditingItemDiscountId(null)}
                        className="ml-auto text-[10px] font-bold text-teal-700 hover:underline cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-12 text-center text-[#7c839b]/70 font-sans text-xs font-medium space-y-1">
                  <p>Check out items are currently empty.</p>
                  <p className="text-[10px]">Select a quick service left to build the bill.</p>
                </div>
              )}
            </div>
          </div>

          {/* Calculations footer panel */}
          <div className="border-t border-[#e2e8f0]/50 pt-3 mt-4 space-y-2.5">
            {/* Promo Code Coupon applied & Bill Discount */}
            <div className="flex items-center gap-2">
              <Percent size={14} className="text-[#45464d] shrink-0" />
              <input
                type="text"
                placeholder="Promo Code or %"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="flex-1 min-w-0 py-1 px-2.5 bg-white border border-[#c6c6cd] rounded font-sans text-xs font-semibold placeholder-[#7c839b]/70 outline-none"
              />
              <button
                onClick={handleApplyPromo}
                className="px-3 py-1 bg-[#eff4ff]/80 border border-[#c6c6cd] rounded text-xs font-bold hover:bg-[#dce9ff] shrink-0 cursor-pointer"
              >
                Apply
              </button>
            </div>

            {/* Collapsible: Additional Charges & Shipping */}
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsChargesExpanded(!isChargesExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 hover:text-slate-900"
              >
                <span className="flex items-center gap-1.5">
                  <Truck size={13} className="text-teal-700" />
                  <span>Charges &amp; Shipping {(shippingCharges > 0 || additionalCharges > 0) ? `(+₹${shippingCharges + additionalCharges})` : ''}</span>
                </span>
                {isChargesExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {isChargesExpanded && (
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Shipping (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={shippingCharges || ''}
                      onChange={(e) => setShippingCharges(Number(e.target.value))}
                      placeholder="0"
                      className="w-full p-1 border rounded bg-white text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">{additionalChargesLabel} (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={additionalCharges || ''}
                      onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                      placeholder="0"
                      className="w-full p-1 border rounded bg-white text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible: Due Date & Notes */}
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 hover:text-slate-900"
              >
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-teal-700" />
                  <span>Due Date &amp; Notes {dueDate ? `(Due: ${dueDate})` : ''}</span>
                </span>
                {isNotesExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {isNotesExpanded && (
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Payment Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-1 border rounded bg-white text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Invoice Notes / Terms</label>
                    <input
                      type="text"
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      placeholder="e.g. Terms: Goods once sold will not be taken back."
                      className="w-full p-1 border rounded bg-white text-xs font-semibold outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Itemized Calculation Summary */}
            <div className="space-y-1 text-xs text-[#45464d] font-semibold px-1 pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#0b1c30]">₹{subtotal.toLocaleString()}</span>
              </div>
              {billDiscountAmount > 0 && (
                <div className="flex justify-between text-[#006f66]">
                  <span>Discount ({activeDiscountCode || `${activeDiscountPercent}%`})</span>
                  <span>-₹{billDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              {shippingCharges > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Shipping Charges</span>
                  <span>+₹{shippingCharges.toFixed(2)}</span>
                </div>
              )}
              {additionalCharges > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>{additionalChargesLabel}</span>
                  <span>+₹{additionalCharges.toFixed(2)}</span>
                </div>
              )}

              {/* GST Tax Engine Split */}
              {isInterState ? (
                <div className="flex justify-between text-slate-700 font-mono text-[11px]">
                  <span>IGST (18% Inter-State)</span>
                  <span className="text-[#0b1c30] font-bold">₹{igstAmount.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-slate-700 font-mono text-[11px]">
                    <span>CGST (9% Central)</span>
                    <span className="text-[#0b1c30] font-bold">₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-mono text-[11px]">
                    <span>SGST (9% State)</span>
                    <span className="text-[#0b1c30] font-bold">₹{sgstAmount.toFixed(2)}</span>
                  </div>
                </>
              )}

              {/* Auto Round Off Toggle */}
              <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoRoundOff}
                    onChange={(e) => setAutoRoundOff(e.target.checked)}
                    className="accent-[#006a61] w-3.5 h-3.5"
                  />
                  <span>Auto Round Off</span>
                </label>
                <span className="font-mono text-slate-600">
                  {roundOff !== 0 ? `${roundOff > 0 ? '+' : ''}₹${roundOff.toFixed(2)}` : '₹0.00'}
                </span>
              </div>
            </div>

            {/* Big Total Amount Box */}
            <div className="flex justify-between items-end p-3 bg-[#eff4ff] rounded-lg border border-[#e2e8f0]">
              <div>
                <span className="text-xs font-bold text-[#0b1c30] block">Total Amount</span>
                <span className="text-[10px] text-slate-500 font-semibold">{cart.length} item{cart.length === 1 ? '' : 's'}</span>
              </div>
              <span className="text-2xl font-bold font-display text-[#006a61] leading-none">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Payment selector interface & Checkout trigger */}
        <div className="bg-white rounded-xl p-5 border border-[#e2e8f0]/80 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#7c839b] uppercase tracking-wider block mb-2">Payment Method</h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('Cash')}
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all cursor-pointer ${paymentMethod === 'Cash'
                    ? 'border-[#006a61] bg-[#006a61]/5 text-[#006a61]'
                    : 'border-[#e2e8f0] bg-white text-[#7c839b] hover:bg-[#eff4ff]'
                  }`}
              >
                <span className="text-lg mb-0.5">💵</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all cursor-pointer ${paymentMethod === 'UPI'
                    ? 'border-[#006a61] bg-[#006a61]/5 text-[#006a61]'
                    : 'border-[#e2e8f0] bg-white text-[#7c839b] hover:bg-[#eff4ff]'
                  }`}
              >
                <span className="text-lg mb-0.5">📲</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">UPI</span>
              </button>

              <button
                onClick={() => setPaymentMethod('Card')}
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all cursor-pointer ${paymentMethod === 'Card'
                    ? 'border-[#006a61] bg-[#006a61]/5 text-[#006a61]'
                    : 'border-[#e2e8f0] bg-white text-[#7c839b] hover:bg-[#eff4ff]'
                  }`}
              >
                <span className="text-lg mb-0.5">💳</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Card</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            id="checkout-submit-btn"
            disabled={isCheckingOut || cart.length === 0}
            className={`w-full py-3 text-white rounded-xl font-display font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex flex-col items-center justify-center shadow-sm relative overflow-hidden group cursor-pointer ${
              documentType === 'Estimate' ? 'bg-amber-600 hover:bg-amber-700' :
              documentType === 'Delivery Challan' ? 'bg-blue-600 hover:bg-blue-700' :
              documentType === 'Credit Note' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#006a61] hover:bg-[#004d47]'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {isCheckingOut ? (
                <Loader2 className="animate-spin text-white" size={16} />
              ) : (
                <Send size={16} />
              )}
              <span>
                {isCheckingOut
                  ? 'Processing Document...'
                  : documentType === 'Estimate'
                  ? `Save & Print Estimate (₹${totalAmount.toLocaleString()})`
                  : documentType === 'Delivery Challan'
                  ? `Generate Delivery Challan`
                  : documentType === 'Credit Note'
                  ? `Issue Credit Note (₹${totalAmount.toLocaleString()})`
                  : `Collect ₹${totalAmount.toLocaleString()} & Print Invoice`}
              </span>
            </div>
            <span className="text-[10px] opacity-85 font-normal mt-0.5">Press Ctrl + Enter for Quick Tender</span>
          </button>
        </div>
      </aside>

      {/* Bill receipt printer modal popup view */}
      <AnimatePresence>
        {generatedBill && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden text-center"
            >
              <div className="w-12 h-12 bg-[#e6f4ea] text-[#1e8e3e] rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} />
              </div>
              <h3 className="font-display text-lg font-black text-[#0b1c30]">Bill Compiled!</h3>
              <p className="text-xs text-[#7c839b] mt-1">Invoice {generatedBill.billNumber} has been generated successfully.</p>

              <div className="bg-[#f8f9ff] border p-4 rounded-lg my-4 text-left space-y-1.5 font-sans">
                <div className="flex justify-between text-xs text-[#45464d] font-bold">
                  <span>Client Name:</span>
                  <span className="text-[#0b1c30]">{generatedBill.customerName}</span>
                </div>
                <div className="flex justify-between text-xs text-[#45464d]">
                  <span>Payment Method:</span>
                  <span className="text-[#0b1c30] font-semibold">{generatedBill.paymentMethod}</span>
                </div>
                {generatedBill.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-[#45464d]">
                    <span>Discount:</span>
                    <span className="text-[#006f66] font-semibold">-₹{generatedBill.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-dashed my-2"></div>
                <div className="flex justify-between text-sm font-bold text-[#0b1c30]">
                  <span>Total Amount:</span>
                  <span className="text-[#006a61]">₹{generatedBill.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    try {
                      printBill(generatedBill, businessProfile);
                      showToast("Invoice sent to print spooler!", "success");
                    } catch (e: any) {
                      showToast("Print error: " + e.message, "error");
                    }
                  }}
                  className="w-full py-2.5 bg-[#006a61] text-white rounded font-sans text-xs font-bold hover:bg-[#00554e] flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Print Themed Invoice</span>
                </button>

                {generatedBill.customerPhone && generatedBill.customerPhone !== 'N/A' && (
                  <button
                    onClick={() => {
                      const cleanPhone = generatedBill.customerPhone?.replace(/\D/g, '');
                      const text = `Dear ${generatedBill.customerName}, here is your invoice #${generatedBill.billNumber} for ₹${generatedBill.totalAmount.toLocaleString()} from ${businessProfile?.tradingName || 'our store'}. Thank you for your business!`;
                      window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-full py-2 border border-emerald-500 text-emerald-700 rounded font-sans text-xs font-bold hover:bg-emerald-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 size={14} />
                    <span>Share on WhatsApp</span>
                  </button>
                )}

                <button
                  onClick={() => setGeneratedBill(null)}
                  className="w-full py-2 border border-[#c6c6cd] text-slate-700 rounded font-sans text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close &amp; Next Bill
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Custom Item Modal */}
      {isQuickItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-display font-extrabold text-slate-900 text-base">Add Quick Custom Item</h3>
              <button onClick={() => setIsQuickItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Item / Charge Name *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Custom Repair, Special Thali, Service Fee"
                  value={quickItemName}
                  onChange={(e) => setQuickItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006a61]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="250"
                    value={quickItemPrice}
                    onChange={(e) => setQuickItemPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006a61]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">GST Tax Rate</label>
                  <select
                    value={quickItemTaxRate}
                    onChange={(e) => setQuickItemTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006a61]"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Reduced / Food)</option>
                    <option value={12}>12% (Standard)</option>
                    <option value={18}>18% (Standard Services)</option>
                    <option value={28}>28% (Luxury)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">HSN / SAC Code (Optional)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setHsnSearchType('Goods');
                      setIsHsnModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-[#006a61] hover:underline"
                  >
                    🔍 Search GST Finder
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 996331 or 6109"
                  value={quickItemHsnSac}
                  onChange={(e) => setQuickItemHsnSac(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#006a61]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="quickItemSaveCheckbox"
                  type="checkbox"
                  checked={quickItemSaveToCatalog}
                  onChange={(e) => setQuickItemSaveToCatalog(e.target.checked)}
                  className="w-4 h-4 text-[#006a61] border-slate-300 rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="quickItemSaveCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Save to Catalog for future bills
                </label>
              </div>
            </div>

            <div className="pt-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsQuickItemModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!quickItemName.trim() || !quickItemPrice || isNaN(Number(quickItemPrice))) {
                    showToast("Please enter a valid item name and price", "warning");
                    return;
                  }

                  const price = Number(quickItemPrice);
                  const taxAmount = (price * quickItemTaxRate) / 100;
                  const total = price + taxAmount;

                  if (quickItemSaveToCatalog) {
                    const isGoods = quickItemHsnSac && quickItemHsnSac.length === 4;
                    serviceCatalogService.create({
                      name: quickItemName.trim(),
                      sku: `${isGoods ? 'PRD' : 'SRV'}-${Date.now().toString().slice(-4)}`,
                      category: dbCategories[0]?.name || 'General',
                      basePrice: price,
                      taxRate: quickItemTaxRate,
                      status: 'Active',
                      hsnSac: quickItemHsnSac || undefined,
                      itemType: isGoods ? 'Product' : 'Service'
                    } as any).catch((e: any) => console.warn('Could not auto-save quick item to catalog', e));
                  }

                  const item: BillItem = {
                    serviceId: Math.floor(Date.now() / 1000),
                    serviceName: `${quickItemName.trim()} ${quickItemHsnSac ? `(${quickItemHsnSac})` : ''}`,
                    unitPrice: price,
                    quantity: 1,
                    lineTotal: total,
                    hsnSac: quickItemHsnSac || undefined
                  };

                  setCart(prev => [...prev, item]);
                  showToast(`Added '${quickItemName}' to ${t('invoice')}!`, "success");
                  setQuickItemName('');
                  setQuickItemPrice('');
                  setQuickItemHsnSac('');
                  setIsQuickItemModalOpen(false);
                }}
                className="px-5 py-2 bg-[#006a61] text-white rounded-xl text-xs font-semibold hover:bg-opacity-90 shadow-sm"
              >
                Add & Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive HSN/SAC Search Modal */}
      <HSNSacSearchModal
        isOpen={isHsnModalOpen}
        onClose={() => setIsHsnModalOpen(false)}
        type={hsnSearchType}
        onSelect={(code, desc, gstRate) => {
          setQuickItemHsnSac(code);
          setQuickItemTaxRate(gstRate);
          showToast(`Applied ${code} (${gstRate}% GST)`, "info");
        }}
      />

      {/* Held Carts Recall Modal Drawer (Multi-Cart / Park Bill) */}
      <AnimatePresence>
        {isHeldCartsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl max-w-xl w-full space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FolderArchive className="text-[#006a61]" size={20} />
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">Parked / Held Carts ({heldCarts.length})</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Quickly switch between paused customer counter transactions</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHeldCartsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {heldCarts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Pause size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-semibold">No carts currently on hold.</p>
                    <p className="text-xs text-slate-400 mt-1">Press F6 or click "Hold Bill" anytime to park a transaction.</p>
                  </div>
                ) : (
                  heldCarts.map((held) => (
                    <div
                      key={held.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#006a61] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{held.customerName}</span>
                          {held.customerPhone && <span className="text-[11px] text-slate-500">({held.customerPhone})</span>}
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            held.documentType === 'Estimate' ? 'bg-amber-100 text-amber-800' :
                            held.documentType === 'Delivery Challan' ? 'bg-blue-100 text-blue-800' :
                            held.documentType === 'Credit Note' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {held.documentType}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          <span>{held.cart.length} item{held.cart.length === 1 ? '' : 's'}</span>
                          <span className="mx-1.5">•</span>
                          <span>Held: {new Date(held.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-sm font-black text-[#006a61] mt-1">
                          ₹{held.totalAmount.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleRecallCart(held)}
                          className="px-4 py-2 bg-[#006a61] hover:bg-[#004d47] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play size={12} />
                          <span>Resume</span>
                        </button>
                        <button
                          onClick={() => handleDiscardHeldCart(held.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Discard Parked Cart"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

interface FlattenedNode {
  category: Category;
  depth: number;
}

function buildCategoryTree(flatCats: Category[]): CategoryNode[] {
  const map: Record<number, CategoryNode> = {};
  flatCats.forEach(c => {
    map[c.id] = { category: c, children: [] };
  });
  const roots: CategoryNode[] = [];
  flatCats.forEach(c => {
    const node = map[c.id];
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function flattenCategoryTree(nodes: CategoryNode[], depth = 0): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  nodes.forEach(node => {
    result.push({ category: node.category, depth });
    if (node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, depth + 1));
    }
  });
  return result;
}

function getDescendantNames(catId: number, flatCats: Category[]): string[] {
  const names: string[] = [];
  const cat = flatCats.find(c => c.id === catId);
  if (cat) {
    names.push(cat.name.toLowerCase());
  }
  const children = flatCats.filter(c => c.parentId === catId);
  children.forEach(child => {
    names.push(...getDescendantNames(child.id, flatCats));
  });
  return names;
}

function toggleCategoryCheck(catId: number, checked: boolean, allCats: Category[], selected: Set<number>) {
  if (checked) {
    selected.add(catId);
  } else {
    selected.delete(catId);
  }
  const children = allCats.filter(c => c.parentId === catId);
  children.forEach(c => {
    toggleCategoryCheck(c.id, checked, allCats, selected);
  });
}
