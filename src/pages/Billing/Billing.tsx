import React, { useState } from 'react';
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
  Percent
} from 'lucide-react';
import { Service, Customer, BillItem, Bill } from '../../types';

interface BillingProps {
  services: Service[];
  customers: Customer[];
  onAddBill: (bill: Bill) => void;
  onAddCustomer: (customer: Customer) => void;
}

export default function Billing({ 
  services, 
  customers, 
  onAddBill, 
  onAddCustomer 
}: BillingProps) {
  // POS States
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('1'); // Default to walk-in
  const [cart, setCart] = useState<BillItem[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
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

  // Categories extraction
  const categories = ['All', ...Array.from(new Set(services.filter(s => s.status === 'Active').map(s => s.category)))];

  // Selected customer info
  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Helper: Icons mapper
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
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
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prev, {
          serviceId: service.id,
          name: service.name,
          price: service.basePrice,
          quantity: 1
        }];
      }
    });
  };

  // Adjust item quantity
  const handleUpdateQty = (serviceId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.serviceId === serviceId) {
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  // Remove Item
  const handleRemoveItem = (serviceId: string) => {
    setCart(prev => prev.filter(item => item.serviceId !== serviceId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = subtotal * (activeDiscountPercent / 100);
  const taxAmount = (subtotal - discountAmount) * 0.05; // 5% flat output CGST/SGST proxy
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

  // Trigger New Customer Creation
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    const newCust: Customer = {
      id: Date.now().toString(),
      name: newCustName,
      phone: newCustPhone,
      isWalkIn: false
    };
    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setIsAddingCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  // Trigger Bill compilation
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Please add services to the current bill first!");
      return;
    }

    const newInvoiceId = `#INV-${Math.floor(2000 + Math.random() * 1000)}`;
    const bill: Bill = {
      id: newInvoiceId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: activeCustomer.name,
      items: cart,
      subtotal,
      discountCode: activeDiscountPercent > 0 ? activeDiscountCode : undefined,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentMethod,
      status: 'Paid'
    };

    onAddBill(bill);
    setGeneratedBill(bill);
    setCart([]); // Clear cart
  };

  // Discount code application helper
  const handleApplyPromo = () => {
    if (discountCode.toUpperCase() === 'VIP10') {
      setActiveDiscountCode('VIP10');
      setActiveDiscountPercent(10);
      alert("Promo 'VIP10' applied! 10% Discount included.");
    } else if (discountCode.endsWith('%')) {
      const parsedVal = parseInt(discountCode.replace('%', ''));
      if (!isNaN(parsedVal) && parsedVal >= 0 && parsedVal <= 100) {
        setActiveDiscountCode(`CUSTOM-${parsedVal}%`);
        setActiveDiscountPercent(parsedVal);
        alert(`Custom ${parsedVal}% promo rate injected!`);
      }
    } else {
      setActiveDiscountCode('CUSTOM');
      setActiveDiscountPercent(5);
      alert("Custom coupon registered: 5% flat discount activated!");
    }
    setDiscountCode('');
  };

  // Filter service catalog
  const filteredServices = services
    .filter(s => s.status === 'Active')
    .filter(s => {
      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
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
                      placeholder="e.g. (555) 000-0000" 
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
                  className={`shrink-0 px-3 py-1.5 border rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected 
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

        {/* Quick Service Catalog Selector */}
        <section className="bg-white rounded-xl p-5 border border-[#e2e8f0]/80 shadow-sm flex-1 flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h2 className="font-display text-lg font-bold text-[#0b1c30]">Quick Services</h2>
            <div className="relative w-full sm:w-48">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7c839b]" />
              <input
                id="service-filter-input"
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter services..."
                className="w-full pl-8 pr-3 py-1 bg-white border border-[#c6c6cd] rounded-md font-sans text-xs focus:border-[#006a61] focus:outline-none"
              />
            </div>
          </div>

          {/* Category Chips Horizontal Filter List */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 border-b border-[#e2e8f0]/50 shrink-0">
            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected 
                      ? 'bg-[#006a61] text-white shadow-sm shadow-[#006a61]/10' 
                      : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dce9ff] hover:text-[#0b1c30]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
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
                    {getCategoryIcon(service.iconName)}
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
                #INV-{selectedCustomerId === '1' ? '2049' : Math.floor(2000 + Number(selectedCustomerId))}
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
                    <h4 className="font-sans text-xs font-bold text-[#0b1c30] truncate leading-tight">{item.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[#7c839b]">
                      <span className="text-[10px] font-semibold">₹{item.price.toLocaleString()}</span>
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
                    <span className="text-xs font-bold text-[#0b1c30]">₹{(item.price * item.quantity).toLocaleString()}</span>
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
              <Percent size={14} className="text-[#45464d]" />
              <input 
                type="text"
                placeholder="Discount Code or %"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="flex-1 py-1 px-2.5 bg-white border border-[#c6c6cd] rounded font-sans text-xs font-semibold placeholder-[#7c839b]/70 outline-none"
              />
              <button 
                onClick={handleApplyPromo}
                className="px-3 py-1 bg-[#eff4ff]/80 border border-[#c6c6cd] rounded text-xs font-bold hover:bg-[#dce9ff]"
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
                <span>Tax (5% Local Output)</span>
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
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${
                  paymentMethod === 'Cash' 
                    ? 'border-[#006a61] bg-[#006a61]/5 text-[#006a61]' 
                    : 'border-[#e2e8f0] bg-white text-[#7c839b] hover:bg-[#eff4ff]'
                }`}
              >
                <span className="text-lg mb-0.5">💵</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Cash</span>
              </button>

              <button 
                onClick={() => setPaymentMethod('UPI')}
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${
                  paymentMethod === 'UPI' 
                    ? 'border-[#006a61] bg-[#006a61]/5 text-[#006a61]' 
                    : 'border-[#e2e8f0] bg-white text-[#7c839b] hover:bg-[#eff4ff]'
                }`}
              >
                <span className="text-lg mb-0.5">📲</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">UPI</span>
              </button>

              <button 
                onClick={() => setPaymentMethod('Card')}
                className={`flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${
                  paymentMethod === 'Card' 
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
            className="w-full py-3 bg-[#006a61] text-[#ffffff] rounded-lg font-display font-semibold hover:bg-opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm relative overflow-hidden group text-sm"
          >
            <div className="absolute inset-0 bg-white/10 w-0 group-hover:w-full transition-all duration-300 ease-out"></div>
            <Send size={16} />
            <span>Generate &amp; WhatsApp</span>
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
              <p className="text-xs text-[#7c839b] mt-1">Invoice {generatedBill.id} has been generated successfully and queued for secure WhatsApp deliverability.</p>
              
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
                    alert("Sending direct notification to printer terminal...");
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
    </div>
  );
}
