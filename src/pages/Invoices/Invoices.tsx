import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Sparkles, 
  Printer, 
  Trash2, 
  X, 
  Eye,
  FileText,
  DollarSign,
  TrendingUp,
  Tag,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { billService } from '../../services/bill.service';
import { customerService } from '../../services/customer.service';
import { staffService } from '../../services/staff.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { whatsAppService } from '../../services/whatsapp.service';

export default function Invoices() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [bills, setBills] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Filters State
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Invoice for Detail modal
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

  // WhatsApp Sending States
  const [isSendingWa, setIsSendingWa] = useState<boolean>(false);
  const [waPhone, setWaPhone] = useState<string>('');
  const [waCaption, setWaCaption] = useState<string>('');
  const [isWaPromptOpen, setIsWaPromptOpen] = useState<boolean>(false);

  const isOwner = currentUser?.role === 'Owner';

  const loadFilterData = async () => {
    try {
      const custData = await customerService.getAll();
      setCustomers(custData || []);
      
      if (isOwner) {
        const staffData = await staffService.getAll();
        setStaffList(staffData || []);
      }
    } catch (e) {
      console.error('Error loading filter options', e);
    }
  };

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedCustomer) filters.customerId = Number(selectedCustomer);
      
      // If staff is logged in, restrict query to their own staffId automatically
      if (!isOwner && currentUser?.staffId) {
        filters.staffId = currentUser.staffId;
      } else if (selectedStaff) {
        filters.staffId = Number(selectedStaff);
      }

      if (startDate) filters.startDate = new Date(startDate).toISOString();
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.endDate = end.toISOString();
      }
      if (status) filters.status = status;
      if (minAmount) filters.minAmount = Number(minAmount);
      if (maxAmount) filters.maxAmount = Number(maxAmount);

      const data = await billService.getAll(filters);
      setBills(data || []);
    } catch (e) {
      showToast('Error querying invoices from the server', 'error');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [selectedCustomer, selectedStaff, startDate, endDate, status, minAmount, maxAmount]);

  const handleClearFilters = () => {
    setSelectedCustomer('');
    setSelectedStaff('');
    setStartDate('');
    setEndDate('');
    setStatus('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
    showToast('Filters cleared successfully', 'info');
  };

  const handleDeleteBill = async (id: number, billNo: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Invoice ${billNo}? This action is irreversible.`)) {
      return;
    }
    setIsDeleting(id);
    try {
      await billService.delete(id);
      showToast(`Invoice ${billNo} deleted successfully`, 'success');
      fetchBills();
    } catch (e) {
      showToast('Error deleting invoice', 'error');
      console.error(e);
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePrintReceipt = (bill: any) => {
    // Simulated print trigger
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Popup blocker prevented receipt layout generation.', 'error');
      return;
    }

    const itemsRows = bill.items.map((it: any) => `
      <tr>
        <td style="padding: 6px 0; font-size: 12px; font-family: monospace;">${it.serviceName} x${it.quantity}</td>
        <td style="padding: 6px 0; text-align: right; font-size: 12px; font-family: monospace;">₹${it.lineTotal.toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt ${bill.billNumber}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: monospace; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div style="max-width: 300px; margin: 0 auto; font-family: monospace;">
            <div style="text-align: center; margin-bottom: 16px;">
              <h2 style="margin: 0; font-size: 18px;">${bill.branchName || 'SmartBill Pro'}</h2>
              <p style="margin: 4px 0 0; font-size: 11px;">POS Thermal Billing Receipt</p>
            </div>
            
            <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; font-size: 11px;">
              <div><b>Bill No:</b> ${bill.billNumber}</div>
              <div><b>Date:</b> ${new Date(bill.createdAt).toLocaleString()}</div>
              <div><b>Billed By:</b> ${bill.staffName || 'Owner'}</div>
              <div><b>Customer:</b> ${bill.customerName || 'Walk-In'} (${bill.customerPhone || 'N/A'})</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
              <thead>
                <tr style="border-bottom: 1px dashed #000;">
                  <th style="text-align: left; padding-bottom: 4px; font-size: 11px;">Item</th>
                  <th style="text-align: right; padding-bottom: 4px; font-size: 11px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div style="border-top: 1px dashed #000; padding-top: 8px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>Subtotal</span>
                <span>₹${bill.subtotal.toFixed(2)}</span>
              </div>
              ${bill.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #000;">
                <span>Discount (${bill.discountCode || 'Promo'})</span>
                <span>-₹${bill.discountAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span>CGST/SGST (5%)</span>
                <span>₹${bill.taxAmount.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px;">
                <span>Grand Total</span>
                <span>₹${bill.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 24px; font-size: 10px; border-top: 1px dashed #000; padding-top: 12px;">
              <p style="margin: 0;">Payment Method: <b>${bill.paymentMethod}</b></p>
              <p style="margin: 4px 0 0;">Thank You for choosing us!</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Sent to browser print spooler.', 'success');
  };

  const handleOpenWaPrompt = (bill: any) => {
    setWaPhone(bill.customerPhone || '');
    setWaCaption(`Invoice ${bill.billNumber}`);
    setSelectedBill(bill);
    setIsWaPromptOpen(true);
  };

  const handleSendWa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !waPhone) return;

    setIsSendingWa(true);
    try {
      await whatsAppService.sendDocument(selectedBill.id, waPhone, waCaption || undefined);
      showToast(`Invoice successfully sent to ${waPhone} via WhatsApp!`, 'success');
      setIsWaPromptOpen(false);
    } catch (err: any) {
      showToast('WhatsApp transmission failed: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setIsSendingWa(false);
    }
  };

  const filteredBills = bills.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (b.billNumber || '').toLowerCase().includes(q) ||
      (b.customerName || '').toLowerCase().includes(q) ||
      (b.customerPhone || '').includes(q)
    );
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-[#0b1c30] flex items-center gap-2">
            <Receipt className="text-[#006a61]" size={26} />
            <span>Invoice Activity Logs</span>
          </h2>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase mt-1 leading-none">
            {isOwner ? 'Audit and manage transactions across all cash registers' : 'Browse shift invoices and activity'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`font-sans text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${
              isFilterExpanded || selectedCustomer || selectedStaff || startDate || endDate || status || minAmount || maxAmount
                ? 'bg-[#eff4ff] border-[#006a61] text-[#006a61]' 
                : 'bg-white border-[#e2e8f0] text-[#45464d]'
            }`}
          >
            <Filter size={14} />
            <span>Filters</span>
          </button>

          {(selectedCustomer || selectedStaff || startDate || endDate || status || minAmount || maxAmount || searchQuery) && (
            <button
              onClick={handleClearFilters}
              className="font-sans text-xs font-bold px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Expandable Grid */}
      <AnimatePresence>
        {isFilterExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shadow-xs">
              {/* Customer Selector */}
              <div>
                <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Customer CRM</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-[#e2e8f0] rounded-lg p-2 text-[#0b1c30]"
                >
                  <option value="">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (${c.phone})</option>
                  ))}
                </select>
              </div>

              {/* Staff Selector (Only for Owners) */}
              {isOwner ? (
                <div>
                  <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Billed By Staff</label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-[#e2e8f0] rounded-lg p-2 text-[#0b1c30]"
                  >
                    <option value="">All Staff</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (${s.role})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Account Restriction</label>
                  <input
                    type="text"
                    disabled
                    value={currentUser?.name || currentUser?.username || ''}
                    className="w-full text-xs font-medium bg-slate-100 border border-[#e2e8f0] rounded-lg p-2 text-[#7c839b]"
                  />
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-[#e2e8f0] rounded-lg p-2 text-[#0b1c30]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-[#e2e8f0] rounded-lg p-2 text-[#0b1c30]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Invoicing Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-[#e2e8f0] rounded-lg p-2 text-[#0b1c30]"
                >
                  <option value="">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              {/* Min Amount */}
              <div>
                <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-[#e2e8f0] rounded-lg p-2 text-[#0b1c30]"
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Max Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-[#e2e8f0] rounded-lg p-2 text-[#0b1c30]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main List and Search Grid */}
      <div className="bg-white border rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b bg-slate-50/50 flex items-center gap-3">
          <Search size={18} className="text-[#7c839b]" />
          <input
            type="text"
            placeholder="Search by invoice number, customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-xs font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder-[#7c839b] text-[#0b1c30]"
          />
        </div>

        {/* Datagrid */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-[#006a61] border-slate-200 animate-spin mx-auto"></div>
              <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase">Loading Transactions...</p>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="py-20 text-center text-[#7c839b]">
              <Receipt size={48} className="mx-auto text-slate-300 mb-3" />
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">No Invoices Found</h3>
              <p className="text-xs mt-1">Try refining search parameters or clearing filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50/30">
                  <th className="font-sans text-[10px] font-bold text-[#7c839b] uppercase p-4">Invoice No</th>
                  <th className="font-sans text-[10px] font-bold text-[#7c839b] uppercase p-4">Customer</th>
                  <th className="font-sans text-[10px] font-bold text-[#7c839b] uppercase p-4">Billed By</th>
                  <th className="font-sans text-[10px] font-bold text-[#7c839b] uppercase p-4">Date &amp; Time</th>
                  <th className="font-sans text-[10px] font-bold text-[#7c839b] uppercase p-4">Payment</th>
                  <th className="font-sans text-[10px] font-bold text-[#7c839b] uppercase p-4">Grand Total</th>
                  <th className="font-sans text-[10px] font-bold text-[#7c839b] uppercase p-4">Status</th>
                  <th className="font-sans text-[10px] font-bold text-[#7c839b] uppercase p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {filteredBills.map((bill) => (
                  <tr 
                    key={bill.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="p-4 font-sans font-bold text-[#006a61]">
                      {bill.billNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-[#0b1c30]">{bill.customerName || 'Walk-In'}</div>
                      <div className="text-[10px] text-[#7c839b]">{bill.customerPhone || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-semibold text-[#45464d]">
                      {bill.staffName || 'Owner'}
                    </td>
                    <td className="p-4 font-medium text-[#7c839b]">
                      {new Date(bill.createdAt).toLocaleDateString()} &bull; {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-semibold">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border text-slate-700 font-sans text-[9px] font-bold uppercase">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 font-display font-black text-[#0b1c30]">
                      ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-sans text-[9px] font-bold uppercase border ${
                        bill.status === 'Paid' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-1.5">
                      <button
                        title="View Details"
                        onClick={() => {
                          setSelectedBill(bill);
                          setIsDetailOpen(true);
                        }}
                        className="p-1.5 text-[#006a61] hover:bg-[#eff4ff] rounded transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        title="Print Receipt"
                        onClick={() => handlePrintReceipt(bill)}
                        className="p-1.5 text-[#7c839b] hover:bg-[#eff4ff] rounded transition-colors"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        title="Send via WhatsApp"
                        onClick={() => handleOpenWaPrompt(bill)}
                        className="p-1.5 text-[#25d366] hover:bg-emerald-50 rounded transition-colors"
                      >
                        <MessageSquare size={14} />
                      </button>
                      {isOwner && (
                        <button
                          title="Delete Permanently"
                          disabled={isDeleting === bill.id}
                          onClick={() => handleDeleteBill(bill.id, bill.billNumber)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invoice Detail PDF-style Modal Drawer */}
      <AnimatePresence>
        {isDetailOpen && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-4 border-b flex justify-between items-center bg-[#eff4ff]/60">
                <div className="flex items-center gap-2">
                  <Receipt className="text-[#006a61]" size={20} />
                  <span className="font-display font-black text-sm text-[#0b1c30]">Invoice #{selectedBill.billNumber}</span>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1 text-[#7c839b] hover:text-[#0b1c30] rounded-full hover:bg-slate-200/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Receipt Body Scroll Container */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Branch Branding */}
                <div className="text-center">
                  <h3 className="font-display font-black text-lg text-[#006a61]">{selectedBill.branchName || 'SmartBill Pro'}</h3>
                  <p className="text-[10px] text-[#7c839b] font-semibold mt-1">POS INVOICING RECEIPT</p>
                </div>

                {/* Audit Context Cards */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 border p-3 rounded-lg">
                  <div className="space-y-1">
                    <div className="text-[10px] text-[#7c839b] font-bold uppercase leading-none">Billed Date</div>
                    <div className="font-semibold text-[#0b1c30]">{new Date(selectedBill.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-[#7c839b] font-bold uppercase leading-none">Billed By Staff</div>
                    <div className="font-semibold text-[#0b1c30]">{selectedBill.staffName || 'Owner'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-[#7c839b] font-bold uppercase leading-none">Customer Contact</div>
                    <div className="font-semibold text-[#0b1c30]">{selectedBill.customerName || 'Walk-In Customer'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-[#7c839b] font-bold uppercase leading-none">Phone</div>
                    <div className="font-semibold text-[#0b1c30]">{selectedBill.customerPhone || 'N/A'}</div>
                  </div>
                </div>

                {/* Services lines table */}
                <div className="space-y-2">
                  <h4 className="font-bold text-[#0b1c30] uppercase text-[10px] tracking-wider text-[#7c839b]">Order Line Items</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="p-2.5 font-sans font-bold text-[#7c839b] text-[9px] uppercase">Service Name</th>
                          <th className="p-2.5 font-sans font-bold text-[#7c839b] text-[9px] uppercase text-center">Qty</th>
                          <th className="p-2.5 font-sans font-bold text-[#7c839b] text-[9px] uppercase text-right">Unit Price</th>
                          <th className="p-2.5 font-sans font-bold text-[#7c839b] text-[9px] uppercase text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedBill.items.map((it: any) => (
                          <tr key={it.id}>
                            <td className="p-2.5 font-medium text-[#0b1c30]">{it.serviceName}</td>
                            <td className="p-2.5 text-center font-bold text-[#45464d]">{it.quantity}</td>
                            <td className="p-2.5 text-right font-medium text-[#7c839b]">₹{it.unitPrice.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-semibold text-[#0b1c30]">₹{it.lineTotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subtotal calculations */}
                <div className="space-y-2 pt-2 border-t border-dashed">
                  <div className="flex justify-between">
                    <span className="text-[#7c839b] font-semibold">Subtotal</span>
                    <span className="font-bold text-[#45464d]">₹{selectedBill.subtotal.toFixed(2)}</span>
                  </div>

                  {selectedBill.discountAmount > 0 && (
                    <div className="flex justify-between text-[#006a61]">
                      <span className="font-semibold flex items-center gap-1">
                        <Tag size={12} />
                        <span>Promo Discount ({selectedBill.discountCode})</span>
                      </span>
                      <span className="font-bold">-₹{selectedBill.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-[#7c839b] font-semibold">Taxes &amp; Local Levies (5% Flat)</span>
                    <span className="font-bold text-[#45464d]">₹{selectedBill.taxAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-display font-black text-[#006a61] pt-2 border-t">
                    <span>Grand Total</span>
                    <span className="text-base text-[#006a61]">₹{selectedBill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="font-sans text-xs font-semibold px-4 py-2 border rounded-lg bg-white text-[#45464d] hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenWaPrompt(selectedBill);
                  }}
                  className="font-sans text-xs font-bold px-4 py-2 bg-[#25d366] text-white rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-[#22c55e]"
                >
                  <MessageSquare size={14} />
                  <span>Send WhatsApp</span>
                </button>
                <button
                  onClick={() => handlePrintReceipt(selectedBill)}
                  className="font-sans text-xs font-bold px-4 py-2 bg-[#006a61] text-white rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Send Prompt Modal */}
      <AnimatePresence>
        {isWaPromptOpen && selectedBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWaPromptOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b flex justify-between items-center bg-[#eff4ff]/60">
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-[#25d366]" size={20} />
                  <span className="font-display font-black text-sm text-[#0b1c30]">Send via WhatsApp</span>
                </div>
                <button
                  onClick={() => setIsWaPromptOpen(false)}
                  className="p-1 text-[#7c839b] hover:text-[#0b1c30] rounded-full hover:bg-slate-200/50 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSendWa} className="p-5 space-y-4 text-xs font-semibold text-[#45464d]">
                <div>
                  <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Recipient Phone Number</label>
                  <input
                    type="text"
                    required
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="e.g. +919876543210"
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  />
                  <p className="text-[10px] text-[#7c839b] font-medium mt-1">Include country code without spaces/special chars (e.g. +91...)</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#7c839b] uppercase mb-1">Caption (Optional)</label>
                  <input
                    type="text"
                    value={waCaption}
                    onChange={(e) => setWaCaption(e.target.value)}
                    placeholder="e.g. Invoice INV-12345"
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsWaPromptOpen(false)}
                    className="px-4 py-2 border rounded-lg bg-white text-[#45464d] hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingWa}
                    className="px-4 py-2 bg-[#25d366] text-white rounded-lg flex items-center gap-1.5 font-bold hover:bg-[#22c55e] disabled:opacity-50"
                  >
                    {isSendingWa ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare size={14} />
                        <span>Send Invoice</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
