import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  FileText, 
  RotateCcw, 
  Send, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  MessageCircle, 
  Phone, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X,
  Boxes,
  Printer
} from 'lucide-react';
import { Supplier, PurchaseBill, PurchaseItem, PurchaseOrder, DebitNote } from '../../types/purchase.types';
import { supplierService } from '../../services/supplier.service';
import { purchasesService } from '../../services/purchases.service';
import { inventoryService } from '../../services/inventory.service';
import { useToast } from '../../hooks/useToast';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

export default function Purchases() {
  const { showToast } = useToast();
  const { config } = useBusinessConfig();

  // Active Tab: bills | suppliers | orders | debit_notes
  const [activeTab, setActiveTab] = useState<'bills' | 'suppliers' | 'orders' | 'debit_notes'>('bills');

  // Data states
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [debitNotes, setDebitNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isAddBillOpen, setIsAddBillOpen] = useState<boolean>(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState<boolean>(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState<boolean>(false);
  const [isAddDebitNoteOpen, setIsAddDebitNoteOpen] = useState<boolean>(false);
  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<Supplier | null>(null);

  // Form states for New Bill
  const [newBillSupplierId, setNewBillSupplierId] = useState<number | ''>('');
  const [newBillNumber, setNewBillNumber] = useState<string>(`PUR-${Date.now().toString().slice(-4)}`);
  const [newBillDate, setNewBillDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newBillPaymentMethod, setNewBillPaymentMethod] = useState<'Cash' | 'Bank' | 'UPI' | 'Cheque' | 'Credit'>('Bank');
  const [newBillPaidAmount, setNewBillPaidAmount] = useState<number>(0);
  const [newBillNotes, setNewBillNotes] = useState<string>('');
  const [newBillAutoUpdateStock, setNewBillAutoUpdateStock] = useState<boolean>(true);
  const [newBillItems, setNewBillItems] = useState<PurchaseItem[]>([
    { itemName: '', quantity: 1, unit: 'Pcs', unitPrice: 0, gstRate: 18, taxAmount: 0, lineTotal: 0 }
  ]);

  // Form states for New Supplier
  const [newSupName, setNewSupName] = useState<string>('');
  const [newSupContact, setNewSupContact] = useState<string>('');
  const [newSupPhone, setNewSupPhone] = useState<string>('');
  const [newSupEmail, setNewSupEmail] = useState<string>('');
  const [newSupGstin, setNewSupGstin] = useState<string>('');
  const [newSupAddress, setNewSupAddress] = useState<string>('');
  const [newSupBankName, setNewSupBankName] = useState<string>('');
  const [newSupAccountNo, setNewSupAccountNo] = useState<string>('');
  const [newSupIfsc, setNewSupIfsc] = useState<string>('');
  const [newSupOpeningBalance, setNewSupOpeningBalance] = useState<number>(0);

  // Form states for Debit Note
  const [dnSupplierId, setDnSupplierId] = useState<number | ''>('');
  const [dnReason, setDnReason] = useState<'Damaged Goods' | 'Defective' | 'Shortage' | 'Rate Difference' | 'Expired'>('Damaged Goods');
  const [dnAmount, setDnAmount] = useState<number>(0);
  const [dnNotes, setDnNotes] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsData, suppliersData, ordersData, dnData] = await Promise.all([
        purchasesService.getAllBills(),
        supplierService.getAll(),
        purchasesService.getAllOrders(),
        purchasesService.getAllDebitNotes()
      ]);
      setBills(billsData);
      setSuppliers(suppliersData);
      setOrders(ordersData);
      setDebitNotes(dnData);
    } catch (e) {
      console.error('Failed to load purchases data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary Metrics
  const totalPurchasesAmount = bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
  const totalPayables = suppliers.reduce((acc, s) => acc + (Number(s.currentBalance) || 0), 0);
  const totalDebitNotesAmount = debitNotes.reduce((acc, d) => acc + (Number(d.totalAmount) || 0), 0);

  // Handle items calculation in new bill
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const items = [...newBillItems];
    const target = { ...items[index], [field]: value };
    
    // Auto recalculate line total
    const qty = Number(target.quantity) || 0;
    const price = Number(target.unitPrice) || 0;
    const rate = Number(target.gstRate) || 0;
    const rawTotal = qty * price;
    const tax = (rawTotal * rate) / 100;
    target.taxAmount = tax;
    target.lineTotal = rawTotal + tax;

    items[index] = target;
    setNewBillItems(items);
  };

  const addItemRow = () => {
    setNewBillItems([
      ...newBillItems,
      { itemName: '', quantity: 1, unit: 'Pcs', unitPrice: 0, gstRate: 18, taxAmount: 0, lineTotal: 0 }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (newBillItems.length > 1) {
      setNewBillItems(newBillItems.filter((_, i) => i !== index));
    }
  };

  const billSubtotal = newBillItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const billTaxTotal = newBillItems.reduce((acc, item) => acc + item.taxAmount, 0);
  const billGrandTotal = billSubtotal + billTaxTotal;

  // Submit New Purchase Bill
  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillSupplierId) {
      showToast('Please select a supplier', 'error');
      return;
    }
    const supplier = suppliers.find(s => s.id === Number(newBillSupplierId));
    if (!supplier) return;

    const paid = Number(newBillPaidAmount) || 0;
    const balance = Math.max(0, billGrandTotal - paid);
    let status: 'Paid' | 'Unpaid' | 'Partial' = 'Paid';
    if (paid === 0) status = 'Unpaid';
    else if (paid < billGrandTotal) status = 'Partial';

    try {
      await purchasesService.createBill({
        billNumber: newBillNumber,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierGstin: supplier.gstin,
        purchaseDate: newBillDate,
        subtotal: billSubtotal,
        taxAmount: billTaxTotal,
        totalAmount: billGrandTotal,
        paidAmount: paid,
        balanceAmount: balance,
        paymentMethod: newBillPaymentMethod,
        status,
        notes: newBillNotes,
        items: newBillItems
      });

      // If auto-update stock is enabled, adjust inventory items
      if (newBillAutoUpdateStock) {
        try {
          const invList = await inventoryService.getAll();
          for (const item of newBillItems) {
            const matched = invList.find((i: any) => i.name.toLowerCase() === item.itemName.toLowerCase());
            if (matched) {
              await inventoryService.updateStock(matched.id, matched.stockQuantity + item.quantity);
            }
          }
        } catch {
          // Gracefully continue
        }
      }

      showToast(`Purchase Bill ${newBillNumber} saved successfully!`, 'success');
      setIsAddBillOpen(false);
      // Reset form
      setNewBillNumber(`PUR-${Date.now().toString().slice(-4)}`);
      setNewBillPaidAmount(0);
      setNewBillNotes('');
      setNewBillItems([{ itemName: '', quantity: 1, unit: 'Pcs', unitPrice: 0, gstRate: 18, taxAmount: 0, lineTotal: 0 }]);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save purchase bill', 'error');
    }
  };

  // Submit New Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim() || !newSupPhone.trim()) {
      showToast('Supplier name and phone are required', 'error');
      return;
    }

    try {
      await supplierService.create({
        name: newSupName.trim(),
        contactPerson: newSupContact.trim(),
        phone: newSupPhone.trim(),
        email: newSupEmail.trim(),
        gstin: newSupGstin.trim().toUpperCase(),
        billingAddress: newSupAddress.trim(),
        bankName: newSupBankName.trim(),
        accountNumber: newSupAccountNo.trim(),
        ifscCode: newSupIfsc.trim().toUpperCase(),
        openingBalance: Number(newSupOpeningBalance) || 0,
        currentBalance: Number(newSupOpeningBalance) || 0,
        status: 'Active'
      });

      showToast(`Supplier ${newSupName} added successfully!`, 'success');
      setIsAddSupplierOpen(false);
      setNewSupName('');
      setNewSupPhone('');
      setNewSupGstin('');
      setNewSupOpeningBalance(0);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to add supplier', 'error');
    }
  };

  // Submit New Debit Note
  const handleCreateDebitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dnSupplierId || dnAmount <= 0) {
      showToast('Please select supplier and enter valid return amount', 'error');
      return;
    }
    const supplier = suppliers.find(s => s.id === Number(dnSupplierId));
    if (!supplier) return;

    try {
      await purchasesService.createDebitNote({
        debitNoteNumber: `DN-${Date.now().toString().slice(-4)}`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        date: new Date().toISOString().split('T')[0],
        reason: dnReason,
        totalAmount: Number(dnAmount),
        notes: dnNotes,
        items: []
      });

      showToast('Debit Note recorded and supplier balance adjusted!', 'success');
      setIsAddDebitNoteOpen(false);
      setDnAmount(0);
      setDnNotes('');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to create debit note', 'error');
    }
  };

  // WhatsApp Supplier Reminder
  const handleSendSupplierWhatsApp = (supplier: Supplier) => {
    const text = `Namaste ${supplier.name},\nThis is from *${config?.businessName || 'Our Business'}*.\nOur ledger shows an outstanding payable balance of *₹${supplier.currentBalance.toLocaleString('en-IN')}*.\nPlease share bank account details or updated bill statement for settlement.\nThank you!`;
    window.open(`https://wa.me/91${supplier.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* ─── Header & Primary CTA ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0b1c30] tracking-tight">Purchases &amp; Suppliers</h1>
            <span className="bg-[#006a61]/10 text-[#006a61] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Inward &amp; Accounts Payable
            </span>
          </div>
          <p className="text-xs text-[#7c839b] font-medium mt-1">
            Manage vendor purchase invoices, inventory additions, purchase orders, and supplier ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="flex items-center gap-2 bg-white border border-[#c6c6cd] text-[#0b1c30] font-semibold text-xs py-2.5 px-4 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <Building2 size={16} className="text-[#006a61]" />
            <span>+ Add Supplier</span>
          </button>
          <button
            onClick={() => setIsAddDebitNoteOpen(true)}
            className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs py-2.5 px-3 rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>Debit Note</span>
          </button>
          <button
            onClick={() => setIsAddBillOpen(true)}
            className="flex items-center gap-2 bg-[#006a61] text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-[#005a52] transition-all cursor-pointer shadow-sm shadow-[#006a61]/20"
          >
            <Plus size={16} />
            <span>+ New Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* ─── Top 4 KPI Metrics ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Purchases */}
        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#7c839b] tracking-wider">Total Purchases</p>
            <h3 className="text-xl font-black text-[#0b1c30] mt-1">₹{totalPurchasesAmount.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{bills.length} Inward bills</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#006a61]/10 text-[#006a61] flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Card 2: Accounts Payable ("You'll Give") */}
        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">You'll Give (Payables)</p>
            <h3 className="text-xl font-black text-amber-700 mt-1">₹{totalPayables.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-[#7c839b] font-medium mt-0.5">To {suppliers.filter(s => s.currentBalance > 0).length} suppliers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
        </div>

        {/* Card 3: Active Suppliers */}
        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#7c839b] tracking-wider">Registered Suppliers</p>
            <h3 className="text-xl font-black text-[#0b1c30] mt-1">{suppliers.length}</h3>
            <p className="text-[10px] text-[#7c839b] font-medium mt-0.5">Vendors &amp; Distributors</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>

        {/* Card 4: Debit Notes (Purchase Returns) */}
        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#7c839b] tracking-wider">Purchase Returns</p>
            <h3 className="text-xl font-black text-rose-600 mt-1">₹{totalDebitNotesAmount.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-[#7c839b] font-medium mt-0.5">{debitNotes.length} Debit notes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <RotateCcw size={20} />
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs & Search ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#e2e8f0] pb-2">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'bills'
                ? 'bg-[#006a61] text-white shadow-sm'
                : 'text-[#45464d] hover:bg-slate-100'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Purchase Bills ({bills.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-[#006a61] text-white shadow-sm'
                : 'text-[#45464d] hover:bg-slate-100'
            }`}
          >
            <Building2 size={14} />
            <span>Suppliers Directory ({suppliers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#006a61] text-white shadow-sm'
                : 'text-[#45464d] hover:bg-slate-100'
            }`}
          >
            <FileText size={14} />
            <span>Purchase Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('debit_notes')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'debit_notes'
                ? 'bg-[#006a61] text-white shadow-sm'
                : 'text-[#45464d] hover:bg-slate-100'
            }`}
          >
            <RotateCcw size={14} />
            <span>Debit Notes ({debitNotes.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
          <input
            type="text"
            placeholder="Search by vendor, bill #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#006a61]"
          />
        </div>
      </div>

      {/* ─── TAB 1: Purchase Bills Table ─── */}
      {activeTab === 'bills' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-[#7c839b] uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bill #</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {bills
                  .filter(b => 
                    b.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    b.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-[#45464d]">{bill.purchaseDate}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006a61]">{bill.billNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#0b1c30]">{bill.supplierName}</p>
                        {bill.supplierGstin && (
                          <p className="text-[10px] text-[#7c839b] font-mono">{bill.supplierGstin}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#45464d]">
                        <span className="bg-slate-100 text-[#45464d] px-2 py-0.5 rounded text-[10px] font-bold">
                          {bill.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-[#0b1c30]">
                        ₹{bill.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        ₹{bill.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-600">
                        ₹{bill.balanceAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          bill.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          bill.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={async () => {
                            if (confirm(`Delete Purchase Bill ${bill.billNumber}?`)) {
                              await purchasesService.deleteBill(bill.id);
                              showToast('Bill deleted', 'info');
                              loadData();
                            }
                          }}
                          className="text-[#7c839b] hover:text-rose-600 p-1 transition-colors cursor-pointer"
                          title="Delete Bill"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#7c839b]">
                      <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-xs">No purchase bills recorded yet.</p>
                      <p className="text-[10px]">Click "+ New Purchase Bill" to record incoming stock.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Suppliers Directory ─── */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm))
            .map((sup) => (
              <div key={sup.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-[#0b1c30] text-sm leading-tight">{sup.name}</h4>
                    {sup.contactPerson && (
                      <p className="text-[11px] text-[#7c839b] mt-0.5">Contact: {sup.contactPerson}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    sup.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {sup.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-[#45464d]">
                  <div className="flex items-center gap-2">
                    <Phone size={12} className="text-[#7c839b]" />
                    <span>+91 {sup.phone}</span>
                  </div>
                  {sup.gstin && (
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-[#7c839b] font-sans">GSTIN:</span>
                      <span className="font-bold text-[#006a61]">{sup.gstin}</span>
                    </div>
                  )}
                  {sup.bankName && (
                    <div className="text-[10px] text-[#7c839b]">
                      Bank: {sup.bankName} (A/C: {sup.accountNumber?.slice(-4) ? `****${sup.accountNumber.slice(-4)}` : 'N/A'})
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#7c839b]">You'll Give</span>
                    <p className={`font-black text-sm ${sup.currentBalance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      ₹{sup.currentBalance.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSendSupplierWhatsApp(sup)}
                      className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Send WhatsApp Balance Reminder"
                    >
                      <MessageCircle size={15} />
                    </button>
                    <button
                      onClick={() => setSelectedSupplierForLedger(sup)}
                      className="px-3 py-1.5 rounded-xl bg-[#006a61]/10 text-[#006a61] font-bold text-xs hover:bg-[#006a61]/20 transition-colors cursor-pointer"
                    >
                      Statement
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ─── TAB 3: Purchase Orders ─── */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 text-center shadow-sm">
          <FileText size={32} className="mx-auto text-slate-400 mb-2" />
          <h3 className="font-bold text-sm text-[#0b1c30]">Purchase Orders (Pre-Stock Ordering)</h3>
          <p className="text-xs text-[#7c839b] max-w-md mx-auto mt-1 mb-4">
            Issue formal Purchase Orders (PO) to suppliers with estimated costs and expected delivery dates.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-[#7c839b] uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-4">PO #</th>
                  <th className="py-2.5 px-4">Supplier</th>
                  <th className="py-2.5 px-4">Order Date</th>
                  <th className="py-2.5 px-4 text-right">Estimated Amount</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#006a61]">{po.poNumber}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#0b1c30]">{po.supplierName}</td>
                    <td className="py-2.5 px-4 text-[#7c839b]">{po.orderDate}</td>
                    <td className="py-2.5 px-4 text-right font-black">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No purchase orders issued yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Debit Notes (Purchase Returns) ─── */}
      {activeTab === 'debit_notes' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-[#7c839b] uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Debit Note #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Return Reason</th>
                  <th className="py-3 px-4 text-right">Debit Amount</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {debitNotes.map((dn) => (
                  <tr key={dn.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">{dn.debitNoteNumber}</td>
                    <td className="py-3 px-4 text-[#7c839b]">{dn.date}</td>
                    <td className="py-3 px-4 font-bold text-[#0b1c30]">{dn.supplierName}</td>
                    <td className="py-3 px-4">
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                        {dn.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600">
                      ₹{dn.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-[#7c839b]">{dn.notes || '-'}</td>
                  </tr>
                ))}
                {debitNotes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#7c839b]">
                      No debit notes recorded. Click "Debit Note" above to record returns.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: New Purchase Bill ─── */}
      {isAddBillOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl border border-[#e2e8f0] shadow-2xl overflow-hidden my-8">
            <div className="bg-[#006a61] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Record Purchase Bill (Inward Stock)</h3>
                <p className="text-[11px] text-white/80">Add vendor invoice details to automatically update inventory.</p>
              </div>
              <button onClick={() => setIsAddBillOpen(false)} className="text-white/80 hover:text-white p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#7c839b] block mb-1">Supplier *</label>
                  <select
                    value={newBillSupplierId}
                    onChange={(e) => setNewBillSupplierId(Number(e.target.value))}
                    required
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl focus:border-[#006a61]"
                  >
                    <option value="">-- Select Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#7c839b] block mb-1">Bill / Invoice # *</label>
                  <input
                    type="text"
                    value={newBillNumber}
                    onChange={(e) => setNewBillNumber(e.target.value)}
                    required
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-mono focus:border-[#006a61]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#7c839b] block mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    value={newBillDate}
                    onChange={(e) => setNewBillDate(e.target.value)}
                    required
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl focus:border-[#006a61]"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-[#e2e8f0] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-[#0b1c30] uppercase">Purchased Items</h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-[11px] font-bold text-[#006a61] hover:underline cursor-pointer"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="space-y-2">
                  {newBillItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-[#e2e8f0]">
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Item Name (e.g. Rice 25kg)"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                          required
                          className="w-full p-1.5 text-xs bg-white border border-[#c6c6cd] rounded-lg"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          required
                          className="w-full p-1.5 text-xs bg-white border border-[#c6c6cd] rounded-lg text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Unit Price ₹"
                          min={0}
                          value={item.unitPrice || ''}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          required
                          className="w-full p-1.5 text-xs bg-white border border-[#c6c6cd] rounded-lg text-right"
                        />
                      </div>
                      <div className="col-span-2">
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(idx, 'gstRate', Number(e.target.value))}
                          className="w-full p-1.5 text-xs bg-white border border-[#c6c6cd] rounded-lg"
                        >
                          <option value={0}>0%</option>
                          <option value={5}>5%</option>
                          <option value={12}>12%</option>
                          <option value={18}>18%</option>
                          <option value={28}>28%</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-right font-bold text-xs">
                        ₹{item.lineTotal.toFixed(0)}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-[#7c839b] hover:text-rose-600 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Payment */}
              <div className="border-t border-[#e2e8f0] pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-[#7c839b] block mb-1">Payment Method</label>
                    <select
                      value={newBillPaymentMethod}
                      onChange={(e: any) => setNewBillPaymentMethod(e.target.value)}
                      className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                    >
                      <option value="Bank">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit">Credit (Full Payables)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase text-[#7c839b] block mb-1">Amount Paid Now (₹)</label>
                    <input
                      type="number"
                      min={0}
                      max={billGrandTotal}
                      value={newBillPaidAmount}
                      onChange={(e) => setNewBillPaidAmount(Number(e.target.value))}
                      className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-bold"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#006a61] cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={newBillAutoUpdateStock}
                      onChange={(e) => setNewBillAutoUpdateStock(e.target.checked)}
                      className="rounded"
                    />
                    <span>Automatically increment item stock in Inventory</span>
                  </label>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-[#e2e8f0] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#7c839b]">Subtotal:</span>
                    <span className="font-semibold">₹{billSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7c839b]">GST Tax:</span>
                    <span className="font-semibold">₹{billTaxTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-[#e2e8f0]">
                    <span>Total Amount:</span>
                    <span className="text-[#006a61]">₹{billGrandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 text-amber-600">
                    <span>Balance Due (Payable):</span>
                    <span>₹{Math.max(0, billGrandTotal - (Number(newBillPaidAmount) || 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#006a61] text-white rounded-xl hover:bg-[#005a52] transition-all cursor-pointer shadow-sm"
                >
                  Save Purchase Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Supplier ─── */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#e2e8f0] shadow-2xl overflow-hidden">
            <div className="bg-[#006a61] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Supplier / Vendor</h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Balaji Agro Pvt Ltd"
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl focus:border-[#006a61]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9848012345"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="37AAAAA0000A1Z5"
                    value={newSupGstin}
                    onChange={(e) => setNewSupGstin(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="SBI, HDFC..."
                    value={newSupBankName}
                    onChange={(e) => setNewSupBankName(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Opening Payable (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={newSupOpeningBalance || ''}
                    onChange={(e) => setNewSupOpeningBalance(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-bold"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#006a61] text-white rounded-xl hover:bg-[#005a52] transition-all cursor-pointer shadow-sm"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Debit Note (Purchase Return) ─── */}
      {isAddDebitNoteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#e2e8f0] shadow-2xl overflow-hidden">
            <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Debit Note (Purchase Return)</h3>
              <button onClick={() => setIsAddDebitNoteOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateDebitNote} className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Supplier *</label>
                <select
                  value={dnSupplierId}
                  onChange={(e) => setDnSupplierId(Number(e.target.value))}
                  required
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Payable: ₹{s.currentBalance})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Return Reason *</label>
                <select
                  value={dnReason}
                  onChange={(e: any) => setDnReason(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                >
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Defective">Defective / Quality Issue</option>
                  <option value="Expired">Expired Stock</option>
                  <option value="Shortage">Shortage in Shipment</option>
                  <option value="Rate Difference">Rate Difference / Price Discount</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Return Amount (₹) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={dnAmount || ''}
                  onChange={(e) => setDnAmount(Number(e.target.value))}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-black text-rose-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Narration / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. 5 bags returned due to bag leakage"
                  value={dnNotes}
                  onChange={(e) => setDnNotes(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsAddDebitNoteOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all cursor-pointer shadow-sm"
                >
                  Issue Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DRAWER: Supplier Statement / Ledger ─── */}
      {selectedSupplierForLedger && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
                <div>
                  <h3 className="font-bold text-base text-[#0b1c30]">{selectedSupplierForLedger.name}</h3>
                  <p className="text-xs text-[#7c839b] font-medium">+91 {selectedSupplierForLedger.phone}</p>
                </div>
                <button onClick={() => setSelectedSupplierForLedger(null)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Current Outstanding Payable</span>
                <h2 className="text-2xl font-black text-amber-800 mt-0.5">
                  ₹{selectedSupplierForLedger.currentBalance.toLocaleString('en-IN')}
                </h2>
                <p className="text-[10px] text-amber-700/80 mt-1">Amount owed to vendor for inward supplies.</p>
              </div>

              <div className="mt-6">
                <h4 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider mb-2">Bills From This Supplier</h4>
                <div className="space-y-2">
                  {bills.filter(b => b.supplierId === selectedSupplierForLedger.id).map(b => (
                    <div key={b.id} className="p-3 bg-slate-50 border border-[#e2e8f0] rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono font-bold text-[#006a61]">{b.billNumber}</p>
                        <p className="text-[10px] text-[#7c839b]">{b.purchaseDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#0b1c30]">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] font-semibold text-amber-600">Due: ₹{b.balanceAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                  {bills.filter(b => b.supplierId === selectedSupplierForLedger.id).length === 0 && (
                    <p className="text-xs text-slate-400 italic">No bills found for this supplier.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e2e8f0] flex items-center gap-2">
              <button
                onClick={() => handleSendSupplierWhatsApp(selectedSupplierForLedger)}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>Send WhatsApp Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
