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
  Loader2
} from 'lucide-react';
import { Service, Customer, BillItem, Bill } from '../../types';
import { customerService } from '../../services/customer.service';
import { serviceCatalogService } from '../../services/service.service';
import { billService } from '../../services/bill.service';
import { branchService } from '../../services/branch.service';
import { categoryService, Category } from '../../services/category.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { whatsAppService } from '../../services/whatsapp.service';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Quick Item & HSN Modal States
  const [isQuickItemModalOpen, setIsQuickItemModalOpen] = useState<boolean>(false);
  const [quickItemName, setQuickItemName] = useState<string>('');
  const [quickItemPrice, setQuickItemPrice] = useState<string>('');
  const [quickItemTaxRate, setQuickItemTaxRate] = useState<number>(18);
  const [quickItemHsnSac, setQuickItemHsnSac] = useState<string>('');

  const [isHsnModalOpen, setIsHsnModalOpen] = useState<boolean>(false);
  const [hsnSearchType, setHsnSearchType] = useState<'Goods' | 'Services'>('Goods');

  // POS States
  const [cart, setCart] = useState<BillItem[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Custom discount calculation
  const [discountCode, setDiscountCode] = useState<string>('');
  const [activeDiscountCode, setActiveDiscountCode] = useState<string>('VIP10');
  const [activeDiscountPercent, setActiveDiscountPercent] = useState<number>(10);

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
      const [servicesData, customersData, branchesData, categoriesData] = await Promise.all([
        serviceCatalogService.getAll(),
        customerService.getAll(),
        branchService.getAll(),
        categoryService.getAll()
      ]);

      setServices(servicesData);
      setBranches(branchesData);
      setDbCategories(categoriesData.filter((c: any) => c.type === 'Service'));

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
  }, [currentBranch]);

  // Load persistent cart state from local storage on load
  useEffect(() => {
    const saved = localStorage.getItem('smartbill_pos_cart');
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
    localStorage.setItem('smartbill_pos_cart', JSON.stringify(cart));
  }, [cart]);



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
        return prev.map(item =>
          item.serviceId === service.id
            ? { ...item, quantity: item.quantity + 1, lineTotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [...prev, {
          serviceId: service.id,
          serviceName: service.name,
          unitPrice: service.basePrice,
          quantity: 1,
          lineTotal: service.basePrice
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
          return nextQty > 0 ? { ...item, quantity: nextQty, lineTotal: nextQty * item.unitPrice } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  // Remove Item
  const handleRemoveItem = (serviceId: number) => {
    setCart(prev => prev.filter(item => item.serviceId !== serviceId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const discountAmount = subtotal * (activeDiscountPercent / 100);
  const taxAmount = (subtotal - discountAmount) * 0.05; // 5% flat output CGST/SGST proxy
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

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

      // Generate Invoice Display Reference
      const billNumber = `INV-${Date.now().toString().slice(-6)}`;

      // Generate a unique idempotency key to prevent double charge / duplicate bills
      const idempotencyKey = window.crypto?.randomUUID ? window.crypto.randomUUID() : (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

      const billPayload = {
        branchId: selectedBranchId,
        customerId: selectedCustomerId,
        createdByStaffId: currentUser?.staffId || null,
        billNumber,
        subtotal,
        discountCode: activeDiscountPercent > 0 ? activeDiscountCode : null,
        discountAmount,
        taxAmount,
        totalAmount,
        paymentMethod,
        status: 'Paid',
        idempotencyKey,
        items: itemsDto
      };

      const created = await billService.create(billPayload);

      // Construct frontend state mapping
      const mappedBill: Bill = {
        id: created.id,
        billNumber: created.billNumber,
        subtotal: created.subtotal,
        discountCode: created.discountCode || undefined,
        discountAmount: created.discountAmount,
        taxAmount: created.taxAmount,
        totalAmount: created.totalAmount,
        paymentMethod: created.paymentMethod,
        status: created.status,
        createdAt: created.createdAt,
        customerName: activeCustomer.name,
        customerPhone: activeCustomer.phone,
        items: created.items.map((i: any) => ({
          serviceId: i.serviceId,
          serviceName: i.serviceName,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.lineTotal
        }))
      };

      setGeneratedBill(mappedBill);
      setCart([]); // Clear cart (automatically clears local storage)
      showToast("Invoice processed successfully!", "success");

      // Send invoice via WhatsApp if customer has a valid phone number
      if (activeCustomer.phone && activeCustomer.phone !== 'N/A') {
        try {
          await whatsAppService.sendInvoiceTemplate(created.id, activeCustomer.phone);
          showToast(`Invoice sent to ${activeCustomer.phone} via WhatsApp`, "success");
        } catch (waErr: any) {
          console.error("WhatsApp send failed:", waErr);
          showToast("Bill generated, but WhatsApp transmission failed: " + (waErr.response?.data?.error || waErr.message), "warning");
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
                <Receipt className="text-[#006f66]" size={16} />
                <span>Current Bill</span>
              </h2>
              <span className="font-sans text-[10px] font-bold text-[#45464d] bg-[#eff4ff] px-2 py-0.5 rounded-md">
                #INV-LIVE
              </span>
            </div>

            {/* Selected Client HUD */}
            <div className="p-2.5 bg-[#eff4ff]/60 border border-[#e2e8f0]/30 rounded-lg mb-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-[#7c839b] leading-none">Billing Client</p>
              <h4 className="text-xs font-bold text-[#0b1c30] mt-1 leading-none">
                {activeCustomer.name} {activeCustomer.phone !== 'N/A' ? `(${activeCustomer.phone})` : ''}
              </h4>
            </div>

            {/* Selected items list */}
            <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1">
              {cart.map(item => (
                <div
                  key={item.serviceId}
                  className="flex items-start justify-between p-2 bg-[#f8f9ff] border border-[#e2e8f0]/40 rounded-lg hover:border-[#006a61]/35 group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className="font-sans text-xs font-bold text-[#0b1c30] truncate leading-tight">{item.serviceName}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[#7c839b]">
                      <span className="text-[10px] font-semibold">₹{item.unitPrice.toLocaleString()}</span>
                      <span className="text-[9px] font-semibold">x</span>
                      {/* Counter triggers adjustment */}
                      <div className="flex items-center bg-[#eff4ff] rounded border border-[#e2e8f0]">
                        <button
                          onClick={() => handleUpdateQty(item.serviceId, -1)}
                          className="px-1 hover:bg-[#c6c6cd]/20 rounded-l"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-1.5 text-[10px] font-bold text-[#0b1c30] leading-none">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.serviceId, 1)}
                          className="px-1 hover:bg-[#c6c6cd]/20 rounded-r"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold text-[#0b1c30]">₹{item.lineTotal.toLocaleString()}</span>
                    <button
                      onClick={() => handleRemoveItem(item.serviceId)}
                      className="text-[#ba1a1a] opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
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
          <div className="border-t border-[#e2e8f0]/50 pt-3 mt-4 space-y-3">
            {/* Promo Code Coupon applied */}
            <div className="flex items-center gap-2">
              <Percent size={14} className="text-[#45464d] shrink-0" />
              <input
                type="text"
                placeholder="Discount Code or %"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="flex-1 min-w-0 py-1 px-2.5 bg-white border border-[#c6c6cd] rounded font-sans text-xs font-semibold placeholder-[#7c839b]/70 outline-none"
              />
              <button
                onClick={handleApplyPromo}
                className="px-3 py-1 bg-[#eff4ff]/80 border border-[#c6c6cd] rounded text-xs font-bold hover:bg-[#dce9ff] shrink-0"
              >
                Apply
              </button>
            </div>

            {/* Itemized Calculation Summary */}
            <div className="space-y-1 text-xs text-[#45464d] font-semibold px-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-[#0b1c30]">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#006f66]">
                <span>Discount ({activeDiscountCode})</span>
                <span>-₹{discountAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5% Flat Local)</span>
                <span className="text-[#0b1c30]">₹{taxAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Big Total Amount Box */}
            <div className="flex justify-between items-end p-3 bg-[#eff4ff] rounded-lg border border-[#e2e8f0]">
              <span className="text-xs font-bold text-[#0b1c30]">Total Amount</span>
              <span className="text-xl font-bold font-display text-[#006a61] leading-none">
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
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${paymentMethod === 'Cash'
                    ? 'border-[#006a61] bg-[#006a61]/5 text-[#006a61]'
                    : 'border-[#e2e8f0] bg-white text-[#7c839b] hover:bg-[#eff4ff]'
                  }`}
              >
                <span className="text-lg mb-0.5">💵</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod('UPI')}
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${paymentMethod === 'UPI'
                    ? 'border-[#006a61] bg-[#006a61]/5 text-[#006a61]'
                    : 'border-[#e2e8f0] bg-white text-[#7c839b] hover:bg-[#eff4ff]'
                  }`}
              >
                <span className="text-lg mb-0.5">📲</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">UPI</span>
              </button>

              <button
                onClick={() => setPaymentMethod('Card')}
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${paymentMethod === 'Card'
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
            className="w-full py-3 bg-[#006a61] text-[#ffffff] rounded-lg font-display font-semibold hover:bg-opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm relative overflow-hidden group text-sm"
          >
            <div className="absolute inset-0 bg-white/10 w-0 group-hover:w-full transition-all duration-300 ease-out"></div>
            {isCheckingOut ? (
              <Loader2 className="animate-spin text-white" size={16} />
            ) : (
              <Send size={16} />
            )}
            <span>{isCheckingOut ? 'Compiling Invoices...' : 'Generate & WhatsApp'}</span>
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
              <p className="text-xs text-[#7c839b] mt-1">Invoice {generatedBill.billNumber} has been generated successfully and queued for secure WhatsApp deliverability.</p>

              <div className="bg-[#f8f9ff] border p-4 rounded-lg my-4 text-left space-y-1.5 font-sans">
                <div className="flex justify-between text-xs text-[#45464d] font-bold">
                  <span>Client Name:</span>
                  <span className="text-[#0b1c30]">{generatedBill.customerName}</span>
                </div>
                <div className="flex justify-between text-xs text-[#45464d]">
                  <span>Payment Gateway:</span>
                  <span className="text-[#0b1c30] font-semibold">{generatedBill.paymentMethod} Payment</span>
                </div>
                <div className="flex justify-between text-xs text-[#45464d]">
                  <span>Discount code:</span>
                  <span className="text-[#006f66] font-semibold">{generatedBill.discountCode || 'None'}</span>
                </div>
                <div className="border-t border-dashed my-2"></div>
                <div className="flex justify-between text-sm font-bold text-[#0b1c30]">
                  <span>Total Amount:</span>
                  <span className="text-[#006a61]">₹{generatedBill.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    showToast("Sending direct notification to printer terminal...", "info");
                  }}
                  className="flex-1 py-2 border border-[#c6c6cd] rounded font-sans text-xs font-semibold hover:bg-[#eff4ff] flex items-center justify-center gap-1.5"
                >
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setGeneratedBill(null)}
                  className="flex-1 py-2 bg-[#006a61] text-white rounded font-sans text-xs font-bold hover:bg-opacity-90"
                >
                  Done
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

                  const item: BillItem = {
                    serviceId: Math.floor(Date.now() / 1000),
                    serviceName: `${quickItemName.trim()} ${quickItemHsnSac ? `(HSN/SAC: ${quickItemHsnSac})` : ''}`,
                    unitPrice: price,
                    quantity: 1,
                    lineTotal: total
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
