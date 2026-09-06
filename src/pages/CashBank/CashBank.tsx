import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Wallet, 
  CreditCard, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  DollarSign, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { BankAccount, CashAccount, ChequeRecord, ContraTransaction } from '../../types/cashbank.types';
import { cashBankService } from '../../services/cashbank.service';
import { useToast } from '../../hooks/useToast';

export default function CashBank() {
  const { showToast } = useToast();

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [cheques, setCheques] = useState<ChequeRecord[]>([]);
  const [contraTxns, setContraTxns] = useState<ContraTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active view: 'cheques' | 'contra'
  const [activeTab, setActiveTab] = useState<'cheques' | 'contra'>('cheques');
  const [chequeFilter, setChequeFilter] = useState<'All' | 'Received' | 'Issued'>('All');
  const [chequeStatusFilter, setChequeStatusFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isAddBankOpen, setIsAddBankOpen] = useState<boolean>(false);
  const [isAddChequeOpen, setIsAddChequeOpen] = useState<boolean>(false);
  const [isContraOpen, setIsContraOpen] = useState<boolean>(false);

  // Form states for Add Bank
  const [newBankName, setNewBankName] = useState<string>('');
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newAccountNo, setNewAccountNo] = useState<string>('');
  const [newIfsc, setNewIfsc] = useState<string>('');
  const [newOpeningBal, setNewOpeningBal] = useState<number>(0);
  const [newUpiId, setNewUpiId] = useState<string>('');

  // Form states for Add Cheque
  const [newChequeType, setNewChequeType] = useState<'Received' | 'Issued'>('Received');
  const [newChequeNo, setNewChequeNo] = useState<string>('');
  const [newChequeBank, setNewChequeBank] = useState<string>('');
  const [newChequeParty, setNewChequeParty] = useState<string>('');
  const [newChequePartyType, setNewChequePartyType] = useState<'Customer' | 'Supplier'>('Customer');
  const [newChequeAmount, setNewChequeAmount] = useState<number>(0);
  const [newChequeIssueDate, setNewChequeIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newChequeDueDate, setNewChequeDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newChequeNotes, setNewChequeNotes] = useState<string>('');

  // Form states for Contra Transfer
  const [contraFromType, setContraFromType] = useState<'Cash' | 'Bank'>('Cash');
  const [contraFromId, setContraFromId] = useState<number | ''>('');
  const [contraToType, setContraToType] = useState<'Cash' | 'Bank'>('Bank');
  const [contraToId, setContraToId] = useState<number | ''>('');
  const [contraAmount, setContraAmount] = useState<number>(0);
  const [contraNarration, setContraNarration] = useState<string>('Cash deposit to business account');

  const loadData = async () => {
    setLoading(true);
    try {
      const [banks, cash, chqs, contras] = await Promise.all([
        cashBankService.getBankAccounts(),
        cashBankService.getCashAccounts(),
        cashBankService.getCheques(),
        cashBankService.getContraTransactions()
      ]);
      setBankAccounts(banks);
      setCashAccounts(cash);
      setCheques(chqs);
      setContraTxns(contras);
      if (banks.length > 0) setContraToId(banks[0].id);
      if (cash.length > 0) setContraFromId(cash[0].id);
    } catch (e) {
      console.error('Failed to load cash bank data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Aggregates
  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + (Number(b.currentBalance) || 0), 0);
  const totalCashBalance = cashAccounts.reduce((acc, c) => acc + (Number(c.currentBalance) || 0), 0);
  const totalLiquidFunds = totalBankBalance + totalCashBalance;
  const pendingChequesAmount = cheques
    .filter(c => c.status === 'Open' || c.status === 'Deposited')
    .reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // Submit Add Bank
  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName || !newAccountNo || !newBankName) {
      showToast('Please fill in bank and account details', 'error');
      return;
    }

    try {
      await cashBankService.addBankAccount({
        accountName: newAccountName.trim(),
        bankName: newBankName.trim(),
        accountNumber: newAccountNo.trim(),
        ifscCode: newIfsc.trim().toUpperCase(),
        openingBalance: Number(newOpeningBal) || 0,
        currentBalance: Number(newOpeningBal) || 0,
        isDefault: false,
        upiId: newUpiId.trim(),
        status: 'Active'
      });

      showToast(`Bank account ${newAccountName} added successfully!`, 'success');
      setIsAddBankOpen(false);
      setNewBankName('');
      setNewAccountName('');
      setNewAccountNo('');
      setNewIfsc('');
      setNewOpeningBal(0);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to add bank account', 'error');
    }
  };

  // Submit Add Cheque
  const handleCreateCheque = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChequeNo || !newChequeParty || newChequeAmount <= 0) {
      showToast('Please enter valid cheque number, party name, and amount', 'error');
      return;
    }

    try {
      await cashBankService.createCheque({
        type: newChequeType,
        chequeNumber: newChequeNo.trim(),
        bankName: newChequeBank.trim() || 'Bank Cheque',
        partyName: newChequeParty.trim(),
        partyType: newChequePartyType,
        amount: Number(newChequeAmount),
        issueDate: newChequeIssueDate,
        dueDate: newChequeDueDate,
        status: 'Open',
        notes: newChequeNotes
      });

      showToast(`Cheque #${newChequeNo} recorded successfully!`, 'success');
      setIsAddChequeOpen(false);
      setNewChequeNo('');
      setNewChequeParty('');
      setNewChequeAmount(0);
      setNewChequeNotes('');
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to record cheque', 'error');
    }
  };

  // Update Cheque Status
  const handleUpdateStatus = async (id: number, status: ChequeRecord['status']) => {
    await cashBankService.updateChequeStatus(id, status);
    showToast(`Cheque status updated to "${status}"`, 'success');
    loadData();
  };

  // Submit Contra Transfer
  const handleContraTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contraAmount <= 0) {
      showToast('Please enter a valid transfer amount', 'error');
      return;
    }

    const fromAccName = contraFromType === 'Cash' 
      ? cashAccounts.find(c => c.id === Number(contraFromId))?.accountName || 'Cash'
      : bankAccounts.find(b => b.id === Number(contraFromId))?.accountName || 'Bank';

    const toAccName = contraToType === 'Cash'
      ? cashAccounts.find(c => c.id === Number(contraToId))?.accountName || 'Cash'
      : bankAccounts.find(b => b.id === Number(contraToId))?.accountName || 'Bank';

    try {
      await cashBankService.recordContraTransfer({
        date: new Date().toISOString().split('T')[0],
        fromAccountType: contraFromType,
        fromAccountId: Number(contraFromId),
        fromAccountName: fromAccName,
        toAccountType: contraToType,
        toAccountId: Number(contraToId),
        toAccountName: toAccName,
        amount: Number(contraAmount),
        narration: contraNarration
      });

      showToast(`Transferred ₹${contraAmount.toLocaleString('en-IN')} successfully!`, 'success');
      setIsContraOpen(false);
      setContraAmount(0);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to execute transfer', 'error');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0b1c30] tracking-tight">Cash, Bank &amp; Cheque Register</h1>
            <span className="bg-[#006a61]/10 text-[#006a61] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Treasury &amp; Contra
            </span>
          </div>
          <p className="text-xs text-[#7c839b] font-medium mt-1">
            Track bank balances, cash drawers, cheque clearance lifecycles, and internal contra transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsContraOpen(true)}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs py-2.5 px-3 rounded-xl hover:bg-amber-100 transition-all cursor-pointer"
          >
            <ArrowLeftRight size={15} />
            <span>Contra Transfer</span>
          </button>
          <button
            onClick={() => setIsAddBankOpen(true)}
            className="flex items-center gap-2 bg-white border border-[#c6c6cd] text-[#0b1c30] font-semibold text-xs py-2.5 px-3.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <Building2 size={15} className="text-[#006a61]" />
            <span>+ Add Bank Account</span>
          </button>
          <button
            onClick={() => setIsAddChequeOpen(true)}
            className="flex items-center gap-2 bg-[#006a61] text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-[#005a52] transition-all cursor-pointer shadow-sm shadow-[#006a61]/20"
          >
            <Plus size={16} />
            <span>+ Record Cheque</span>
          </button>
        </div>
      </div>

      {/* ─── Top 4 Treasury Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#7c839b] tracking-wider">Total Liquid Funds</p>
            <h3 className="text-xl font-black text-[#0b1c30] mt-1">₹{totalLiquidFunds.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Bank + Cash Combined</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#006a61]/10 text-[#006a61] flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#7c839b] tracking-wider">Bank Balance</p>
            <h3 className="text-xl font-black text-blue-700 mt-1">₹{totalBankBalance.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-[#7c839b] font-medium mt-0.5">{bankAccounts.length} Bank accounts</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-[#7c839b] tracking-wider">Cash in Hand</p>
            <h3 className="text-xl font-black text-emerald-700 mt-1">₹{totalCashBalance.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-[#7c839b] font-medium mt-0.5">{cashAccounts.length} Cash registers</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">Uncleared Cheques</p>
            <h3 className="text-xl font-black text-amber-700 mt-1">₹{pendingChequesAmount.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-[#7c839b] font-medium mt-0.5">In Clearing Pipeline</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>
      </div>

      {/* ─── Accounts Cards Grid ─── */}
      <div>
        <h3 className="text-xs font-bold uppercase text-[#7c839b] tracking-wider mb-3">Accounts &amp; Cash Registers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {bankAccounts.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:border-[#006a61] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{b.bankName}</span>
                {b.isDefault && <span className="text-[9px] font-bold text-[#006a61]">Primary</span>}
              </div>
              <h4 className="font-bold text-sm text-[#0b1c30] mt-2 truncate">{b.accountName}</h4>
              <p className="text-[10px] font-mono text-[#7c839b] mt-0.5">A/C: ****{b.accountNumber.slice(-4)} | {b.ifscCode}</p>
              <div className="mt-3 pt-2 border-t border-[#e2e8f0] flex items-baseline justify-between">
                <span className="text-[10px] text-[#7c839b]">Current Balance:</span>
                <span className="font-black text-sm text-[#0b1c30]">₹{b.currentBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}

          {cashAccounts.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:border-emerald-500 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Cash Drawer</span>
                {c.isDefault && <span className="text-[9px] font-bold text-emerald-700">Primary</span>}
              </div>
              <h4 className="font-bold text-sm text-[#0b1c30] mt-2 truncate">{c.accountName}</h4>
              <p className="text-[10px] text-[#7c839b] mt-0.5">Physical Counter Cash</p>
              <div className="mt-3 pt-2 border-t border-[#e2e8f0] flex items-baseline justify-between">
                <span className="text-[10px] text-[#7c839b]">Available Cash:</span>
                <span className="font-black text-sm text-emerald-700">₹{c.currentBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Cheque Register / Contra Tabs ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#e2e8f0] pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('cheques')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cheques' ? 'bg-[#006a61] text-white shadow-sm' : 'text-[#45464d] hover:bg-slate-100'
            }`}
          >
            <CreditCard size={14} />
            <span>Cheque Register ({cheques.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('contra')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'contra' ? 'bg-[#006a61] text-white shadow-sm' : 'text-[#45464d] hover:bg-slate-100'
            }`}
          >
            <ArrowLeftRight size={14} />
            <span>Contra Transfers ({contraTxns.length})</span>
          </button>
        </div>

        {activeTab === 'cheques' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={chequeFilter}
              onChange={(e: any) => setChequeFilter(e.target.value)}
              className="p-1.5 text-xs bg-white border border-[#e2e8f0] rounded-xl"
            >
              <option value="All">All Cheques</option>
              <option value="Received">Received (Inflow)</option>
              <option value="Issued">Issued (Outflow)</option>
            </select>
            <select
              value={chequeStatusFilter}
              onChange={(e) => setChequeStatusFilter(e.target.value)}
              className="p-1.5 text-xs bg-white border border-[#e2e8f0] rounded-xl"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Deposited">Deposited</option>
              <option value="Cleared">Cleared</option>
              <option value="Bounced">Bounced</option>
            </select>
          </div>
        )}
      </div>

      {/* ─── TAB: Cheques Table ─── */}
      {activeTab === 'cheques' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-[#7c839b] uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Cheque #</th>
                  <th className="py-3 px-4">Bank</th>
                  <th className="py-3 px-4">Party Name</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {cheques
                  .filter(c => chequeFilter === 'All' || c.type === chequeFilter)
                  .filter(c => chequeStatusFilter === 'All' || c.status === chequeStatusFilter)
                  .map((chq) => (
                    <tr key={chq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                          chq.type === 'Received' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {chq.type === 'Received' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                          <span>{chq.type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#006a61]">{chq.chequeNumber}</td>
                      <td className="py-3 px-4 text-[#45464d]">{chq.bankName}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-[#0b1c30]">{chq.partyName}</p>
                        <span className="text-[10px] text-[#7c839b]">{chq.partyType}</span>
                      </td>
                      <td className="py-3 px-4 text-[#7c839b]">{chq.issueDate}</td>
                      <td className="py-3 px-4 font-medium text-[#45464d]">{chq.dueDate}</td>
                      <td className="py-3 px-4 text-right font-black text-[#0b1c30]">
                        ₹{chq.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          chq.status === 'Cleared' ? 'bg-emerald-100 text-emerald-800' :
                          chq.status === 'Deposited' ? 'bg-blue-100 text-blue-800' :
                          chq.status === 'Bounced' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {chq.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={chq.status}
                          onChange={(e: any) => handleUpdateStatus(chq.id, e.target.value)}
                          className="p-1 text-[11px] font-bold border border-[#c6c6cd] rounded-lg bg-white"
                        >
                          <option value="Open">Open</option>
                          <option value="Deposited">Deposited</option>
                          <option value="Cleared">Cleared</option>
                          <option value="Bounced">Bounced</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                {cheques.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#7c839b]">
                      No cheques recorded yet. Click "+ Record Cheque" to start tracking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: Contra Transfers Table ─── */}
      {activeTab === 'contra' && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-[#7c839b] uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">From Account</th>
                  <th className="py-3 px-4">To Account</th>
                  <th className="py-3 px-4 text-right">Transferred Amount</th>
                  <th className="py-3 px-4">Narration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {contraTxns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-[#7c839b]">{c.date}</td>
                    <td className="py-3 px-4 font-bold text-[#0b1c30]">
                      <span className="text-[10px] text-[#7c839b] uppercase mr-1">[{c.fromAccountType}]</span>
                      {c.fromAccountName}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#006a61]">
                      <span className="text-[10px] text-[#7c839b] uppercase mr-1">[{c.toAccountType}]</span>
                      {c.toAccountName}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#0b1c30]">
                      ₹{c.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-[#7c839b]">{c.narration || '-'}</td>
                  </tr>
                ))}
                {contraTxns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#7c839b]">
                      No contra fund transfers recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: Add Bank Account ─── */}
      {isAddBankOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#e2e8f0] shadow-2xl overflow-hidden">
            <div className="bg-[#006a61] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Business Bank Account</h3>
              <button onClick={() => setIsAddBankOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateBank} className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Account Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Current A/C"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl focus:border-[#006a61]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="HDFC, SBI, ICICI"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="502000123456"
                    value={newAccountNo}
                    onChange={(e) => setNewAccountNo(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="HDFC0001234"
                    value={newIfsc}
                    onChange={(e) => setNewIfsc(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={newOpeningBal || ''}
                    placeholder="0"
                    onChange={(e) => setNewOpeningBal(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">UPI ID (Optional)</label>
                <input
                  type="text"
                  placeholder="business@hdfcbank"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsAddBankOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#006a61] text-white rounded-xl hover:bg-[#005a52] transition-all cursor-pointer shadow-sm"
                >
                  Save Bank Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Record Cheque ─── */}
      {isAddChequeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#e2e8f0] shadow-2xl overflow-hidden">
            <div className="bg-[#006a61] text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Cheque Transaction</h3>
              <button onClick={() => setIsAddChequeOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateCheque} className="p-5 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Cheque Flow *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewChequeType('Received');
                      setNewChequePartyType('Customer');
                    }}
                    className={`p-2 text-xs font-bold rounded-xl border ${
                      newChequeType === 'Received' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-[#c6c6cd] text-[#45464d]'
                    }`}
                  >
                    📥 Received (From Customer)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewChequeType('Issued');
                      setNewChequePartyType('Supplier');
                    }}
                    className={`p-2 text-xs font-bold rounded-xl border ${
                      newChequeType === 'Issued' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-[#c6c6cd] text-[#45464d]'
                    }`}
                  >
                    📤 Issued (To Supplier)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Cheque Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 482019"
                    value={newChequeNo}
                    onChange={(e) => setNewChequeNo(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="SBI, HDFC..."
                    value={newChequeBank}
                    onChange={(e) => setNewChequeBank(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Party Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Customer or Supplier Name"
                  value={newChequeParty}
                  onChange={(e) => setNewChequeParty(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Cheque Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="₹ 0.00"
                    value={newChequeAmount || ''}
                    onChange={(e) => setNewChequeAmount(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-black text-[#006a61]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Due / Clearing Date *</label>
                  <input
                    type="date"
                    required
                    value={newChequeDueDate}
                    onChange={(e) => setNewChequeDueDate(e.target.value)}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsAddChequeOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#006a61] text-white rounded-xl hover:bg-[#005a52] transition-all cursor-pointer shadow-sm"
                >
                  Save Cheque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Contra Transfer ─── */}
      {isContraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#e2e8f0] shadow-2xl overflow-hidden">
            <div className="bg-amber-600 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Contra Internal Transfer</h3>
                <p className="text-[11px] text-white/80">Transfer funds between Cash Drawers and Bank Accounts.</p>
              </div>
              <button onClick={() => setIsContraOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleContraTransfer} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">From Type</label>
                  <select
                    value={contraFromType}
                    onChange={(e: any) => {
                      setContraFromType(e.target.value);
                      if (e.target.value === 'Cash' && cashAccounts[0]) setContraFromId(cashAccounts[0].id);
                      if (e.target.value === 'Bank' && bankAccounts[0]) setContraFromId(bankAccounts[0].id);
                    }}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  >
                    <option value="Cash">Cash Drawer</option>
                    <option value="Bank">Bank Account</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">From Account</label>
                  <select
                    value={contraFromId}
                    onChange={(e) => setContraFromId(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  >
                    {contraFromType === 'Cash' 
                      ? cashAccounts.map(c => <option key={c.id} value={c.id}>{c.accountName} (₹{c.currentBalance})</option>)
                      : bankAccounts.map(b => <option key={b.id} value={b.id}>{b.accountName} (₹{b.currentBalance})</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">To Type</label>
                  <select
                    value={contraToType}
                    onChange={(e: any) => {
                      setContraToType(e.target.value);
                      if (e.target.value === 'Cash' && cashAccounts[0]) setContraToId(cashAccounts[0].id);
                      if (e.target.value === 'Bank' && bankAccounts[0]) setContraToId(bankAccounts[0].id);
                    }}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  >
                    <option value="Bank">Bank Account</option>
                    <option value="Cash">Cash Drawer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">To Account</label>
                  <select
                    value={contraToId}
                    onChange={(e) => setContraToId(Number(e.target.value))}
                    className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                  >
                    {contraToType === 'Bank' 
                      ? bankAccounts.map(b => <option key={b.id} value={b.id}>{b.accountName} (₹{b.currentBalance})</option>)
                      : cashAccounts.map(c => <option key={c.id} value={c.id}>{c.accountName} (₹{c.currentBalance})</option>)
                    }
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="₹ 0.00"
                  value={contraAmount || ''}
                  onChange={(e) => setContraAmount(Number(e.target.value))}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl font-black text-amber-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#7c839b] block mb-1">Narration / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Daily cash collection deposited into HDFC bank"
                  value={contraNarration}
                  onChange={(e) => setContraNarration(e.target.value)}
                  className="w-full p-2 text-xs border border-[#c6c6cd] rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setIsContraOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all cursor-pointer shadow-sm"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
