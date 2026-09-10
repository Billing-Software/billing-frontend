import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Mail, 
  Phone, 
  Loader2, 
  FileText, 
  History, 
  X,
  MessageSquare,
  Share2,
  Printer,
  Building,
  MapPin,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Check
} from 'lucide-react';
import { Customer } from '../../types';
import { customerService } from '../../services/customer.service';
import { billService } from '../../services/bill.service';
import { businessService } from '../../services/business.service';
import { useToast } from '../../hooks/useToast';
import {
  emailError,
  phoneINError,
  gstinError,
  amountError,
  required,
} from '../../utils/validation';

export default function Customers() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields (Vyapar MSME fields)
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [stateCode, setStateCode] = useState<string>('');
  const [billingAddress, setBillingAddress] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [sameShipping, setSameShipping] = useState<boolean>(true);
  const [openingBalance, setOpeningBalance] = useState<string>('');
  const [openingBalanceType, setOpeningBalanceType] = useState<'receive' | 'pay'>('receive');
  const [creditLimit, setCreditLimit] = useState<string>('');

  // Ledger & Business Context
  const [bills, setBills] = useState<any[]>([]);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const [customerData, billData, profileData] = await Promise.all([
        customerService.getAll(),
        billService.getAll(),
        businessService.getProfile().catch(() => null)
      ]);
      setCustomers(customerData || []);
      setBills(billData || []);
      if (profileData) setBusinessProfile(profileData);
    } catch (e) {
      console.error('Error fetching customers, bills and profile', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleGstinChange = (val: string) => {
    const clean = val.toUpperCase().trim();
    setGstin(clean);
    if (clean.length >= 2) {
      const code = clean.substring(0, 2);
      if (!isNaN(Number(code))) {
        setStateCode(code);
      }
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = required(name, 'Customer name');
    if (nameErr) {
      showToast(nameErr, 'error');
      return;
    }
    const phoneErr = phoneINError(phone, { required: true });
    if (phoneErr) {
      showToast(phoneErr, 'error');
      return;
    }
    if (email.trim()) {
      const mailErr = emailError(email, { required: false });
      if (mailErr) {
        showToast(mailErr, 'error');
        return;
      }
    }
    if (gstin.trim()) {
      const gErr = gstinError(gstin, { required: false });
      if (gErr) {
        showToast(gErr, 'error');
        return;
      }
    }
    if (creditLimit.trim()) {
      const cErr = amountError(creditLimit, { required: false, allowZero: true, field: 'Credit limit' });
      if (cErr) {
        showToast(cErr, 'error');
        return;
      }
    }
    if (openingBalance.trim()) {
      const oErr = amountError(openingBalance, { required: false, allowZero: true, field: 'Opening balance' });
      if (oErr) {
        showToast(oErr, 'error');
        return;
      }
    }

    const opBalNum = openingBalance ? Number(openingBalance) : 0;
    const finalOpBal = openingBalanceType === 'receive' ? opBalNum : -opBalNum;

    const customerPayload = {
      name,
      phone: phone || 'N/A',
      email: email || undefined,
      isWalkIn: false,
      gstin: gstin ? gstin.toUpperCase() : undefined,
      stateCode: stateCode || undefined,
      billingAddress: billingAddress || undefined,
      shippingAddress: sameShipping ? (billingAddress || undefined) : (shippingAddress || undefined),
      openingBalance: finalOpBal,
      creditLimit: creditLimit ? Number(creditLimit) : undefined
    };

    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, customerPayload);
        showToast("Customer profile updated successfully!", "success");
      } else {
        await customerService.create(customerPayload);
        showToast("New customer account registered successfully.", "success");
      }
      
      // Reset & Reload
      setIsFormOpen(false);
      setEditingCustomer(null);
      setName('');
      setPhone('');
      setEmail('');
      setGstin('');
      setStateCode('');
      setBillingAddress('');
      setShippingAddress('');
      setSameShipping(true);
      setOpeningBalance('');
      setOpeningBalanceType('receive');
      setCreditLimit('');
      fetchCustomers();
    } catch (err: any) {
      showToast("Error saving customer: " + (err.response?.data || err.message), "error");
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone === 'N/A' ? '' : customer.phone);
    setEmail(customer.email || '');
    setGstin(customer.gstin || '');
    setStateCode(customer.stateCode || '');
    setBillingAddress(customer.billingAddress || '');
    setShippingAddress(customer.shippingAddress || '');
    setSameShipping(!customer.shippingAddress || customer.shippingAddress === customer.billingAddress);
    
    const ob = customer.openingBalance || 0;
    setOpeningBalance(ob ? String(Math.abs(ob)) : '');
    setOpeningBalanceType(ob < 0 ? 'pay' : 'receive');
    setCreditLimit(customer.creditLimit ? String(customer.creditLimit) : '');
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      await customerService.delete(id);
      showToast("Customer deleted successfully.", "success");
      fetchCustomers();
    } catch (err: any) {
      showToast("Error deleting customer: " + (err.response?.data || err.message), "error");
    }
  };

  // Calculate customer balance from bills + opening balance
  const getCustomerBalance = (cust: Customer) => {
    const custBills = bills.filter(b => b.customerId === cust.id);
    const unpaidSum = custBills
      .filter(b => b.status?.toLowerCase() !== 'paid')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const openingBal = cust.openingBalance || 0;
    return openingBal + unpaidSum;
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 font-sans"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Customer Accounts (Parties)</h2>
          <p className="text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">Manage B2B &amp; B2C parties, GSTINs, Khata ledger, and credit limits.</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setName('');
            setPhone('');
            setEmail('');
            setGstin('');
            setStateCode('');
            setBillingAddress('');
            setShippingAddress('');
            setSameShipping(true);
            setOpeningBalance('');
            setOpeningBalanceType('receive');
            setCreditLimit('');
            setIsFormOpen(true);
          }}
          className="bg-[#006a61] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-opacity-95 cursor-pointer"
        >
          <Plus size={15} />
          <span>+ Add Customer / Party</span>
        </button>
      </div>

      {/* Interactive Form Panel */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-display text-[#0b1c30] text-sm font-bold flex items-center gap-2">
                <Building size={16} className="text-[#006a61]" />
                <span>{editingCustomer ? `Edit Party: ${editingCustomer.name}` : 'Register New Party / Customer'}</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              {/* Row 1: Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Party / Customer Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Business / Individual Name" 
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Phone / Mobile Number *</label>
                  <input 
                    type="tel"
                    inputMode="tel"
                    pattern="[6-9][0-9]{9}"
                    maxLength={13}
                    title="Enter a valid 10-digit mobile number starting with 6-9."
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit phone for WhatsApp reminders" 
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="party@example.com" 
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  />
                </div>
              </div>

              {/* Row 2: GSTIN & State Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">GSTIN (Optional for B2B)</label>
                  <input 
                    type="text" 
                    value={gstin} 
                    onChange={(e) => handleGstinChange(e.target.value)}
                    placeholder="e.g. 36AABCU9603R1ZM" 
                    maxLength={15}
                    className="w-full text-xs font-mono font-bold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61] uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">State Code (2 Digits)</label>
                  <input 
                    type="text" 
                    value={stateCode} 
                    onChange={(e) => setStateCode(e.target.value)}
                    placeholder="e.g. 36 (Telangana), 29 (KA)" 
                    maxLength={2}
                    className="w-full text-xs font-mono font-bold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Credit Limit (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={creditLimit} 
                    onChange={(e) => setCreditLimit(e.target.value)}
                    placeholder="e.g. 50000" 
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  />
                </div>
              </div>

              {/* Row 3: Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Billing Address</label>
                  <textarea 
                    rows={2}
                    value={billingAddress} 
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="Door No, Street, City, State, PIN" 
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61] resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-[#7c839b] uppercase">Shipping Address</label>
                    <label className="text-[10px] font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={sameShipping}
                        onChange={(e) => setSameShipping(e.target.checked)}
                        className="accent-[#006a61] w-3 h-3"
                      />
                      <span>Same as Billing</span>
                    </label>
                  </div>
                  <textarea 
                    rows={2}
                    disabled={sameShipping}
                    value={sameShipping ? billingAddress : shippingAddress} 
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder={sameShipping ? "Same as billing address" : "Delivery address"} 
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61] resize-none disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              {/* Row 4: Opening Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60 items-center">
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Opening Balance (₹)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={openingBalance} 
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    placeholder="0" 
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Balance Nature</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOpeningBalanceType('receive')}
                      className={`flex-1 py-2 rounded text-xs font-bold transition-all ${
                        openingBalanceType === 'receive'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      To Receive ("You'll Get")
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpeningBalanceType('pay')}
                      className={`flex-1 py-2 rounded text-xs font-bold transition-all ${
                        openingBalanceType === 'pay'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      To Pay ("Advance")
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-[#c6c6cd] text-[#45464d] text-xs font-semibold rounded hover:bg-[#eff4ff] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006a61] text-white text-xs font-bold rounded hover:bg-opacity-95 shadow-sm cursor-pointer"
                >
                  {editingCustomer ? 'Update Party' : 'Save & Register Party'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <section className="bg-white p-4 rounded-xl border border-[#e2e8f0]/80 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
          <input
            id="customer-accounts-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party by name, phone, email or GSTIN..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#c6c6cd] rounded-lg text-xs font-semibold outline-none focus:border-[#006a61]"
          />
        </div>
      </section>

      {/* Main Customers Profiles Cards / Tables */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-[#006a61]" size={28} />
            <p className="text-xs text-[#7c839b] font-bold uppercase tracking-wider">Synchronizing Party Ledger...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-[#eff4ff]/60">
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Party Name &amp; GSTIN</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Phone &amp; Quick WhatsApp</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Khata Balance</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-center">Credit Limit</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust, index) => {
                const bal = getCustomerBalance(cust);
                const isOverLimit = cust.creditLimit && bal > cust.creditLimit;

                return (
                  <tr 
                    key={cust.id}
                    className={`border-b hover:bg-[#eff4ff]/40 group ${index % 2 === 1 ? 'bg-[#f8f9ff]/60' : ''}`}
                  >
                    {/* Party Name & GSTIN */}
                    <td className="py-3 px-4 text-xs font-bold text-[#0b1c30]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#e5eeff] text-[#006a61] flex items-center justify-center font-bold font-display text-xs shrink-0">
                          {cust.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{cust.name}</span>
                            {cust.isWalkIn && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded">Walk-in</span>
                            )}
                          </div>
                          {cust.gstin && (
                            <span className="font-mono text-[10px] text-teal-700 font-bold block mt-0.5">
                              GST: {cust.gstin}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    {/* Phone & WhatsApp Quick Button */}
                    <td className="py-3 px-4 text-xs text-[#0b1c30] font-semibold">
                      {cust.phone === 'N/A' || !cust.phone ? (
                        <span className="text-[#7c839b] italic">N/A</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-[#006f66]" />
                            <span>{cust.phone}</span>
                          </span>
                          <button
                            type="button"
                            title="Open WhatsApp Chat"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cleanPhone = cust.phone.replace(/\D/g, '');
                              window.open(`https://wa.me/91${cleanPhone}`, '_blank');
                            }}
                            className="p-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                          >
                            <Share2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Khata Balance */}
                    <td className="py-3 px-4 text-right">
                      {bal > 0 ? (
                        <div>
                          <span className="text-xs font-black text-amber-700 block">
                            ₹{bal.toLocaleString()}
                          </span>
                          <span className="text-[9px] font-bold text-amber-600 uppercase">You'll Get</span>
                        </div>
                      ) : bal < 0 ? (
                        <div>
                          <span className="text-xs font-black text-emerald-700 block">
                            ₹{Math.abs(bal).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-600 uppercase">Advance</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">₹0.00</span>
                      )}
                    </td>

                    {/* Credit Limit */}
                    <td className="py-3 px-4 text-center text-xs">
                      {cust.creditLimit ? (
                        <div>
                          <span className="font-semibold text-slate-700">₹{cust.creditLimit.toLocaleString()}</span>
                          {isOverLimit && (
                            <span className="block text-[9px] font-bold text-red-600">Limit Exceeded</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedLedgerCustomer(cust)}
                          className="px-2 py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                          title="Open Khata Ledger Statement"
                        >
                          <History size={12} />
                          <span>Ledger</span>
                        </button>
                        {!cust.isWalkIn && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(cust)}
                              className="p-1 text-[#7c839b] hover:text-[#006a61] hover:bg-[#eff4ff] rounded transition-colors cursor-pointer"
                              title="Modify Profile"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Do you really wish to delete customer "${cust.name}"?`)) {
                                  handleDeleteCustomer(cust.id);
                                }
                              }}
                              className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transition-colors cursor-pointer"
                              title="Delete Profile"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#7c839b] font-semibold">
                    No parties found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ledger Side Drawer Panel */}
      <AnimatePresence>
        {selectedLedgerCustomer && (() => {
          const customerBills = bills.filter(b => b.customerId === selectedLedgerCustomer.id);
          const totalBilled = customerBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
          const totalPaid = customerBills
            .filter(b => b.status?.toLowerCase() === 'paid')
            .reduce((s, b) => s + (b.totalAmount || 0), 0);
          const currentBalance = getCustomerBalance(selectedLedgerCustomer);

          const cleanPhone = selectedLedgerCustomer.phone?.replace(/\D/g, '');

          return (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-6 overflow-hidden"
              >
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b border-[#e2e8f0]">
                  <div>
                    <h3 className="font-display font-black text-lg text-[#0b1c30] flex items-center gap-2">
                      <Building size={18} className="text-[#006a61]" />
                      <span>{selectedLedgerCustomer.name}</span>
                    </h3>
                    <p className="text-xs text-[#7c839b] font-medium mt-0.5">
                      {selectedLedgerCustomer.phone || 'No phone'} &bull; {selectedLedgerCustomer.gstin ? `GST: ${selectedLedgerCustomer.gstin}` : 'Consumer'}
                    </p>
                    {selectedLedgerCustomer.billingAddress && (
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin size={11} />
                        <span>{selectedLedgerCustomer.billingAddress}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedLedgerCustomer(null)}
                    className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* 3 Metrics Cards */}
                <div className="my-4 grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">₹{totalBilled.toLocaleString()}</p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Paid</p>
                    <p className="text-sm font-bold text-emerald-700 mt-1">₹{totalPaid.toLocaleString()}</p>
                  </div>

                  <div className={`p-3 border rounded-xl ${
                    currentBalance > 0 
                      ? 'bg-amber-50 border-amber-200 text-amber-900' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider">
                      {currentBalance > 0 ? "You'll Get" : "Advance"}
                    </p>
                    <p className="text-base font-black font-display mt-0.5">
                      ₹{Math.abs(currentBalance).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Action Row: WhatsApp Reminder + Print Party Statement */}
                <div className="flex gap-2 mb-4">
                  {cleanPhone && currentBalance > 0 && (
                    <button
                      onClick={() => {
                        const msg = `Dear ${selectedLedgerCustomer.name}, this is a gentle payment reminder from ${businessProfile?.tradingName || 'our business'}. Your pending balance is ₹${currentBalance.toLocaleString()}. Kindly arrange payment at your convenience. Thank you!`;
                        window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Share2 size={13} />
                      <span>1-Click WhatsApp Reminder</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Print Statement</span>
                  </button>
                </div>

                {/* History Section */}
                <h4 className="font-display text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-2">Transaction History</h4>
                
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {/* Opening Balance row if present */}
                    {selectedLedgerCustomer.openingBalance !== undefined && selectedLedgerCustomer.openingBalance !== 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-800">Opening Balance</span>
                          <p className="text-[10px] text-slate-500">Account initialization</p>
                        </div>
                        <span className={`font-bold font-mono ${selectedLedgerCustomer.openingBalance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {selectedLedgerCustomer.openingBalance > 0 ? `+₹${selectedLedgerCustomer.openingBalance}` : `-₹${Math.abs(selectedLedgerCustomer.openingBalance)}`}
                        </span>
                      </div>
                    )}

                    {customerBills.map(bill => (
                      <div 
                        key={bill.id}
                        className="p-3 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#006a61]/35 transition-all flex justify-between items-center"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0b1c30]">{bill.billNumber}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              bill.status?.toLowerCase() === 'paid' 
                                ? 'bg-[#e2f3eb] text-[#1e8e3e]' 
                                : 'bg-[#ffdad6] text-[#ba1a1a]'
                            }`}>
                              {bill.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#7c839b] font-medium mt-1">
                            {new Date(bill.createdAt).toLocaleDateString()} &bull; {bill.paymentMethod} &bull; {bill.items?.length || 0} items
                          </p>
                        </div>
                        <span className="font-display text-xs font-extrabold text-[#0b1c30]">
                          ₹{bill.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {customerBills.length === 0 && !selectedLedgerCustomer.openingBalance && (
                      <p className="text-xs text-[#7c839b] text-center py-12 font-semibold">No transactions recorded for this customer yet.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}
