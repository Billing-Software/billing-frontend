import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Tag, 
  Calendar, 
  Loader2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText,
  DollarSign
} from 'lucide-react';
import { expenseService, purchaseService } from '../../services/expense.service';
import { categoryService, Category } from '../../services/category.service';
import { useToast } from '../../hooks/useToast';

export default function Expenses() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'purchases'>('expenses');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState<boolean>(false);
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState<boolean>(false);

  // Expense form variables
  const [expenseDesc, setExpenseDesc] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<string>('Rent');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().substring(0, 10));

  // Purchase form variables
  const [purchaseVendor, setPurchaseVendor] = useState<string>('');
  const [purchaseInvoice, setPurchaseInvoice] = useState<string>('');
  const [purchaseSubtotal, setPurchaseSubtotal] = useState<number>(0);
  const [purchaseTax, setPurchaseTax] = useState<number>(0);
  const [purchaseStatus, setPurchaseStatus] = useState<string>('Paid');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [expenseData, purchaseData] = await Promise.all([
        expenseService.getAll(),
        purchaseService.getAll()
      ]);
      setExpenses(expenseData);
      setPurchases(purchaseData);
    } catch (e) {
      console.error('Error fetching expenses/purchases', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const list = await categoryService.getAll();
      const expCats = list.filter(c => c.type === 'Expense');
      setDbCategories(expCats);
      if (expCats.length > 0) {
        setExpenseCategory(expCats[0].name);
      }
    } catch (e) {
      console.error('Error fetching expense categories', e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || expenseAmount <= 0) return;

    try {
      await expenseService.create({
        description: expenseDesc,
        amount: Number(expenseAmount),
        category: expenseCategory,
        expenseDate: new Date(expenseDate).toISOString()
      });
      showToast('Expense recorded successfully!', 'success');
      setIsExpenseFormOpen(false);
      setExpenseDesc('');
      setExpenseAmount(0);
      fetchData();
    } catch (err: any) {
      showToast('Error saving expense: ' + (err.response?.data || err.message), 'error');
    }
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseVendor || purchaseSubtotal <= 0) return;

    const total = Number(purchaseSubtotal) + Number(purchaseTax);

    try {
      await purchaseService.create({
        vendorName: purchaseVendor,
        invoiceNumber: purchaseInvoice || null,
        subtotal: Number(purchaseSubtotal),
        taxAmount: Number(purchaseTax),
        totalAmount: total,
        status: purchaseStatus,
        purchaseDate: new Date(purchaseDate).toISOString(),
        items: [] // No items for simple logging via form, items can be empty array
      });
      showToast('Purchase bill registered successfully!', 'success');
      setIsPurchaseFormOpen(false);
      setPurchaseVendor('');
      setPurchaseInvoice('');
      setPurchaseSubtotal(0);
      setPurchaseTax(0);
      fetchData();
    } catch (err: any) {
      showToast('Error saving purchase: ' + (err.response?.data || err.message), 'error');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await expenseService.delete(id);
      showToast('Expense deleted.', 'success');
      fetchData();
    } catch (err: any) {
      showToast('Error deleting expense: ' + (err.response?.data || err.message), 'error');
    }
  };

  const handleDeletePurchase = async (id: number) => {
    try {
      await purchaseService.delete(id);
      showToast('Purchase deleted.', 'success');
      fetchData();
    } catch (err: any) {
      showToast('Error deleting purchase: ' + (err.response?.data || err.message), 'error');
    }
  };

  // Summaries
  const totalExpensesSum = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalPurchasesSum = purchases.reduce((sum, item) => sum + item.totalAmount, 0);
  const combinedOutflow = totalExpensesSum + totalPurchasesSum;

  const filteredExpenses = expenses.filter(e => 
    e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPurchases = purchases.filter(p => 
    p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Expenses &amp; Purchases</h2>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">Audit daily operational outlays and vendor supply records.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpenseFormOpen(true)}
            className="bg-[#ba1a1a] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-opacity-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => setIsPurchaseFormOpen(true)}
            className="bg-[#006a61] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-opacity-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Log Vendor Bill</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#7c839b] uppercase tracking-wider">Total Expenses</p>
            <h4 className="text-xl font-bold text-[#0b1c30] mt-1">₹{totalExpensesSum.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#006a61] flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#7c839b] uppercase tracking-wider">Total Purchases</p>
            <h4 className="text-xl font-bold text-[#0b1c30] mt-1">₹{totalPurchasesSum.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#e2f3eb] text-[#1e8e3e] flex items-center justify-center">
            <ArrowDownLeft size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#7c839b] uppercase tracking-wider">Combined Outflow</p>
            <h4 className="text-xl font-bold text-[#0b1c30] mt-1">₹{combinedOutflow.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <section className="bg-white p-4 rounded-xl border border-[#e2e8f0]/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('expenses'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'expenses' 
                ? 'bg-[#006a61] text-white' 
                : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            Expenses List
          </button>
          <button
            onClick={() => { setActiveTab('purchases'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'purchases' 
                ? 'bg-[#006a61] text-white' 
                : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#dce9ff]'
            }`}
          >
            Vendor Purchases
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'expenses' ? "Search expenses..." : "Search purchases..."}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#c6c6cd] rounded-lg font-sans text-xs font-semibold focus:border-[#006a61] outline-none"
          />
        </div>
      </section>

      {/* Dynamic Data Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-[#006a61]" size={28} />
            <p className="text-xs text-[#7c839b] font-bold uppercase tracking-wider">Retrieving accounting spreadsheets...</p>
          </div>
        ) : activeTab === 'expenses' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-[#eff4ff]/60">
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Expense / Description</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Category</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Expense Date</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Amount</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((exp, idx) => (
                  <tr key={exp.id} className={`border-b hover:bg-[#eff4ff]/40 ${idx % 2 === 1 ? 'bg-[#f8f9ff]/60' : ''}`}>
                    <td className="py-3.5 px-4 font-sans text-xs font-bold text-[#0b1c30]">{exp.description}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-[#ffdad6] text-[#ba1a1a] px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-xs text-[#45464d]">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-sans text-xs font-bold text-right text-[#ba1a1a]">₹{exp.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#7c839b] font-semibold">
                      No expense records logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-[#eff4ff]/60">
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Vendor / Supplier</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Invoice Number</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Purchase Date</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Total Outflow</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((pur, idx) => (
                  <tr key={pur.id} className={`border-b hover:bg-[#eff4ff]/40 ${idx % 2 === 1 ? 'bg-[#f8f9ff]/60' : ''}`}>
                    <td className="py-3.5 px-4 font-sans text-xs font-bold text-[#0b1c30]">{pur.vendorName}</td>
                    <td className="py-3.5 px-4 font-sans text-xs text-[#45464d]">{pur.invoiceNumber || '—'}</td>
                    <td className="py-3.5 px-4 font-sans text-xs text-[#45464d]">{new Date(pur.purchaseDate).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pur.status.toLowerCase() === 'paid' 
                          ? 'bg-[#e2f3eb] text-[#1e8e3e]' 
                          : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}>
                        {pur.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-xs font-bold text-right text-[#0b1c30]">₹{pur.totalAmount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeletePurchase(pur.id)}
                        className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredPurchases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[#7c839b] font-semibold">
                      No purchase logs recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forms Modals */}
      {/* 1. Add Expense Modal */}
      <AnimatePresence>
        {isExpenseFormOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-display text-lg font-bold text-[#0b1c30]">Log Daily Expense</h3>
              <form onSubmit={handleSaveExpense} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    placeholder="e.g. Broadband internet payment"
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(Number(e.target.value))}
                      placeholder="e.g. 1500"
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Category</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 focus:border-[#006a61] outline-none"
                    >
                      {dbCategories.length > 0 ? (
                        dbCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                      ) : (
                        <>
                          <option value="Rent">Rent</option>
                          <option value="Salary">Salary</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Tax">Tax</option>
                          <option value="Others">Others</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsExpenseFormOpen(false)}
                    className="px-4 py-1.5 border border-[#c6c6cd] text-[#45464d] text-xs font-bold rounded hover:bg-[#eff4ff]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#ba1a1a] text-white text-xs font-bold rounded hover:bg-opacity-95"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Add Purchase Modal */}
      <AnimatePresence>
        {isPurchaseFormOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <h3 className="font-display text-lg font-bold text-[#0b1c30]">Log Vendor Bill / Purchase</h3>
              <form onSubmit={handleSavePurchase} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Vendor / Supplier *</label>
                  <input
                    type="text"
                    required
                    value={purchaseVendor}
                    onChange={(e) => setPurchaseVendor(e.target.value)}
                    placeholder="e.g. Loreal Cosmetics India"
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Invoice / Reference No.</label>
                  <input
                    type="text"
                    value={purchaseInvoice}
                    onChange={(e) => setPurchaseInvoice(e.target.value)}
                    placeholder="e.g. LCI-9871"
                    className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Subtotal (₹) *</label>
                    <input
                      type="number"
                      required
                      value={purchaseSubtotal}
                      onChange={(e) => setPurchaseSubtotal(Number(e.target.value))}
                      placeholder="e.g. 5000"
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Tax Amount (₹)</label>
                    <input
                      type="number"
                      value={purchaseTax}
                      onChange={(e) => setPurchaseTax(Number(e.target.value))}
                      placeholder="e.g. 900"
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Status</label>
                    <select
                      value={purchaseStatus}
                      onChange={(e) => setPurchaseStatus(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 focus:border-[#006a61] outline-none"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Bill Date</label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPurchaseFormOpen(false)}
                    className="px-4 py-1.5 border border-[#c6c6cd] text-[#45464d] text-xs font-bold rounded hover:bg-[#eff4ff]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#006a61] text-white text-xs font-bold rounded hover:bg-opacity-95"
                  >
                    Log Purchase
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
