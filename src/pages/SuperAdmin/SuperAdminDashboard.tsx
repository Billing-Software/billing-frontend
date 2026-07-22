import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Receipt, CreditCard, AlertTriangle, ShieldCheck, 
  Trash2, Search, ArrowLeft, Loader2, DollarSign, LogOut, CheckCircle2,
  AlertCircle, Copy, Clock
} from 'lucide-react';
import { superAdminService } from '../../services/superadmin.service';
import { useAuth } from '../../hooks/useAuth';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'payments'>('overview');
  
  // States
  const [stats, setStats] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string>('');
  
  // Search & Filter
  const [clientSearch, setClientSearch] = useState<string>('');
  const [paymentSearch, setPaymentSearch] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setErrorText('');
    try {
      const [statsRes, clientsRes, paymentsRes] = await Promise.all([
        superAdminService.getStats(),
        superAdminService.getClients(),
        superAdminService.getPayments()
      ]);
      setStats(statsRes);
      setClients(clientsRes);
      setPaymentsData(paymentsRes);
    } catch (err: any) {
      setErrorText(err.response?.data || err.message || 'Failed to fetch admin stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSuspension = async (id: number) => {
    try {
      await superAdminService.toggleSuspension(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data || err.message || 'Failed to update client status.');
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!window.confirm('Are you absolutely sure you want to delete this tenant business and its associated owner profile? This cannot be undone.')) {
      return;
    }
    try {
      await superAdminService.deleteClient(id);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data || err.message || 'Failed to delete client.');
    }
  };

  const handleCopyLink = (token: string) => {
    const marketingUrl = (import.meta as any).env?.VITE_MARKETING_URL || 'http://localhost:5173';
    const resumeUrl = `${marketingUrl}/checkout/resume?token=${token}`;
    navigator.clipboard.writeText(resumeUrl);
    alert('Checkout recovery magic link copied to clipboard!');
  };

  const filteredClients = clients.filter(c => 
    c.legalName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.ownerUsername?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.ownerEmail?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const filteredTransactions = (paymentsData?.transactions || []).filter((t: any) => 
    t.businessName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    t.ownerEmail?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    t.razorpayPaymentId?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    t.razorpaySubscriptionId?.toLowerCase().includes(paymentSearch.toLowerCase())
  );

  const filteredPending = (paymentsData?.pendingRegistrations || []).filter((p: any) => 
    p.legalName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.email?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.status?.toLowerCase().includes(paymentSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <Loader2 className="animate-spin text-[#006a61] w-12 h-12 mb-4" />
        <h3 className="font-semibold text-base">Loading Super Admin Panel...</h3>
        <p className="text-xs text-slate-400">Fetching global metrics and transaction histories.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Banner Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-[#006a61] p-2 rounded-lg text-white font-black text-xs tracking-wider">
            SUPER ADMIN
          </div>
          <div>
            <h1 className="font-display font-extrabold text-lg leading-none">SmartBill Pro Host Operator</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Multi-Tenant Global Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={loadData}
            className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-all cursor-pointer"
          >
            Refresh Data
          </button>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-950/20"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Stats KPI Widgets Ribbon */}
      <div className="max-w-7xl w-full mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Global Platform Revenue</span>
            <h2 className="text-xl font-black text-slate-900 font-mono">₹{stats?.totalRevenue?.toLocaleString('en-IN') || '0'}</h2>
            <span className="text-[9px] text-slate-400 font-medium">Sum of all POS tenant invoices</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Active Subscriptions</span>
            <h2 className="text-xl font-black text-slate-900 font-mono">{paymentsData?.totalActiveSubscriptions || '0'}</h2>
            <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
              <CheckCircle2 size={10} /> Active billing tenants
            </span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Building2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Successful Payments</span>
            <h2 className="text-xl font-black text-slate-900 font-mono">{paymentsData?.successfulPaymentsCount || '0'}</h2>
            <span className="text-[9px] text-slate-400 font-medium">Captured via Razorpay</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">Failed / Abandoned</span>
            <h2 className="text-xl font-black text-rose-600 font-mono">{(paymentsData?.failedPaymentsCount || 0) + (paymentsData?.abandonedCheckoutsCount || 0)}</h2>
            <span className="text-[9px] text-slate-400 font-medium">
              {paymentsData?.abandonedCheckoutsCount || 0} abandoned checkouts
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Main Tabs Controller */}
      <div className="max-w-7xl w-full mx-auto px-6 flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'overview' ? 'border-[#006a61] text-[#006a61]' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Tenant Business Clients ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === 'payments' ? 'border-[#006a61] text-[#006a61]' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Subscriptions &amp; Payments Panel
        </button>
      </div>

      {/* Content panel */}
      <main className="max-w-7xl w-full mx-auto px-6 py-6 flex-1">
        {errorText && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            {errorText}
          </div>
        )}

        {activeTab === 'overview' ? (
          /* TAB 1: CLIENT OVERVIEW */
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <h3 className="font-display font-extrabold text-sm text-slate-800">Global Tenant Database</h3>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search clients, owner, email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#006a61]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 text-[10px]">Business ID</th>
                    <th className="p-4 text-[10px]">Legal Entity Name</th>
                    <th className="p-4 text-[10px]">Owner Username / Email</th>
                    <th className="p-4 text-[10px]">Contact Info</th>
                    <th className="p-4 text-[10px] text-center">Branches</th>
                    <th className="p-4 text-[10px] text-center">Staff Members</th>
                    <th className="p-4 text-[10px] text-right">Bills Issued</th>
                    <th className="p-4 text-[10px] text-center">Status</th>
                    <th className="p-4 text-[10px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredClients.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/40">
                      <td className="p-4 font-mono font-bold text-slate-500">#{c.id}</td>
                      <td className="p-4">
                        <span className="font-extrabold text-slate-900 block">{c.legalName}</span>
                        {c.tradingName && c.tradingName !== c.legalName && (
                          <span className="text-[10px] text-slate-400">Brand: {c.tradingName}</span>
                        )}
                        <span className="text-[9px] text-slate-400 block mt-0.5">Registered: {new Date(c.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-800 font-bold block">{c.ownerUsername}</span>
                        <span className="text-[10px] text-slate-400">{c.ownerEmail}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-800 block font-semibold">{c.phone || 'No Phone'}</span>
                        <span className="text-[10px] text-slate-400 block">{c.city}, {c.state}</span>
                      </td>
                      <td className="p-4 text-center font-mono font-bold text-slate-700">{c.branchCount}</td>
                      <td className="p-4 text-center font-mono font-bold text-slate-700">{c.staffCount}</td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-bold text-slate-800 block">{c.billCount} bills</span>
                        <span className="text-[10px] text-slate-400 font-mono">₹{c.totalRevenue?.toLocaleString('en-IN') || 0}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          c.isSuspended 
                            ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}>
                          {c.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleSuspension(c.id)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              c.isSuspended 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' 
                                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {c.isSuspended ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => handleDeleteClient(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Client"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No clients found matching the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 2: IN-DEPTH PAYMENTS & CHECKOUT TRACKING */
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="font-display font-extrabold text-base text-slate-800 self-start sm:self-center">Subscription Billing Logs</h3>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search payments, email, subscription ID..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#006a61]"
                />
              </div>
            </div>

            {/* Sub-Section A: Successful Captured Payments */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-emerald-50/20 text-left">
                <h4 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Captured Transactions
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Subscriptions that successfully generated client accounts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <th className="p-4">Transaction ID</th>
                      <th className="p-4">Business Client</th>
                      <th className="p-4">Owner Email</th>
                      <th className="p-4">Razorpay Subscription ID</th>
                      <th className="p-4">Razorpay Payment ID</th>
                      <th className="p-4 text-right">Amount Charged</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4">Captured Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTransactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/40">
                        <td className="p-4 font-mono font-bold text-slate-500">#{t.id}</td>
                        <td className="p-4">
                          <span className="font-extrabold text-slate-900 block">{t.businessName}</span>
                          <span className="text-[10px] text-slate-400">ID: {t.businessId}</span>
                        </td>
                        <td className="p-4 text-slate-800">{t.ownerEmail}</td>
                        <td className="p-4 font-mono font-bold text-slate-500 text-[11px]">{t.razorpaySubscriptionId || 'N/A'}</td>
                        <td className="p-4 font-mono text-slate-500 text-[11px]">{t.razorpayPaymentId || 'N/A'}</td>
                        <td className="p-4 text-right font-mono font-extrabold text-slate-900">₹{t.amount}</td>
                        <td className="p-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No successful payments matching the filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-Section B: Failed or Pending Checkouts */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-rose-50/15 text-left">
                <h4 className="font-display font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                  <Clock size={16} className="text-slate-500" /> Pending Checkouts &amp; Failed Attempts
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Unfinished checkouts, payment link targets, or canceled sessions.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                      <th className="p-4">Session Token</th>
                      <th className="p-4">Owner Name</th>
                      <th className="p-4">Personal Email</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Selected Plan</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4">Created Date</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredPending.map((p: any) => {
                      const isExpired = new Date(p.expiresAt) < new Date() && p.status === 'PendingPayment';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/40">
                          <td className="p-4 font-mono text-[10px] text-slate-400" title={p.token}>
                            {p.token.substring(0, 8)}...
                          </td>
                          <td className="p-4">
                            <span className="font-extrabold text-slate-900 block">{p.legalName}</span>
                            <span className="text-[10px] text-slate-400">Username: {p.username}</span>
                          </td>
                          <td className="p-4 text-slate-800">{p.email}</td>
                          <td className="p-4 font-semibold text-slate-700">{p.phone || 'N/A'}</td>
                          <td className="p-4 text-slate-600">{p.planName}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              isExpired 
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : p.status === 'Failed' 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : p.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {isExpired ? 'Abandoned/Expired' : p.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">
                            <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{new Date(p.createdAt).toLocaleTimeString()}</span>
                          </td>
                          <td className="p-4 text-center">
                            {p.status === 'PendingPayment' && !isExpired && (
                              <button
                                onClick={() => handleCopyLink(p.token)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                              >
                                <Copy size={10} />
                                <span>Copy Recovery Link</span>
                              </button>
                            )}
                            {(p.status === 'Completed' || isExpired || p.status === 'Failed') && (
                              <span className="text-[10px] text-slate-400 font-semibold">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPending.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No pending checkouts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="py-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-white">
        SmartBill Pro SaaS Host Administrator Portal
      </footer>
    </div>
  );
}
