import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Receipt, 
  Users, 
  AlertCircle, 
  Sparkles, 
  Coins, 
  Scissors, 
  Loader2, 
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Boxes,
  ChevronRight
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service';
import { customerService } from '../../services/customer.service';
import { billService } from '../../services/bill.service';
import { inventoryService } from '../../services/inventory.service';
import { expenseService } from '../../services/expense.service';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

interface DashboardProps {
  onNavigateToBilling: () => void;
  onNavigateToStaff: () => void;
  onNavigateToServices: () => void;
  onNavigateToCustomers?: () => void;
  currentBranch: 'Main' | 'Downtown';
}

export default function Dashboard({ 
  onNavigateToBilling, 
  onNavigateToStaff, 
  onNavigateToServices,
  onNavigateToCustomers,
  currentBranch 
}: DashboardProps) {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { config, t } = useBusinessConfig();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRep, setSelectedRep] = useState<string>('7days');
  const [heroMetrics, setHeroMetrics] = useState({
    youllGet: 0,
    dueCustomersCount: 0,
    youllGive: 0,
    cashInHand: 0,
    cashToday: 0,
    upiToday: 0,
    stockValue: 0,
    stockCount: 0
  });

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [data, customersData, billsData, inventoryData, expensesData] = await Promise.all([
        dashboardService.getDashboardData(),
        customerService.getAll().catch(() => []),
        billService.getAll().catch(() => []),
        inventoryService.getAll().catch(() => []),
        expenseService.getAll().catch(() => [])
      ]);
      setDashboardData(data);

      // 1. Calculate You'll Get (receivables from customers)
      let dueCount = 0;
      const youllGet = (customersData || []).reduce((sum: number, c: any) => {
        const ob = c.openingBalance > 0 ? c.openingBalance : 0;
        const unpaidBills = (billsData || []).filter((b: any) => b.customerId === c.id && b.status?.toLowerCase() !== 'paid');
        const unpaidSum = unpaidBills.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
        const total = ob + unpaidSum;
        if (total > 0) dueCount++;
        return sum + total;
      }, 0);

      // 2. Calculate You'll Give (payables: expenses / supplier payables)
      const youllGive = (expensesData || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      // 3. Cash in Hand & UPI today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayBills = (billsData || []).filter((b: any) => (b.createdAt || '').startsWith(todayStr));
      const cashToday = todayBills.filter((b: any) => b.paymentMethod === 'Cash').reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);
      const upiToday = todayBills.filter((b: any) => b.paymentMethod === 'UPI').reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);

      // 4. Total Stock Value (qty * cost/base price)
      const stockCount = (inventoryData || []).length;
      const stockValue = (inventoryData || []).reduce((sum: number, it: any) => {
        const qty = it.quantity || it.stockQuantity || 0;
        const price = it.costPrice || it.purchasePrice || it.unitPrice || 0;
        return sum + (qty * price);
      }, 0);

      setHeroMetrics({
        youllGet,
        dueCustomersCount: dueCount,
        youllGive,
        cashInHand: cashToday + upiToday,
        cashToday,
        upiToday,
        stockValue,
        stockCount
      });
    } catch (e) {
      console.error('Error fetching dashboard metrics', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading || !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[#006a61]" size={36} />
        <p className="text-sm text-[#7c839b] font-bold uppercase tracking-wider">Compiling Terminal Analytics...</p>
      </div>
    );
  }

  const { summary, recentBills, topServices, lowStockItems, salesTrend } = dashboardData;

  // Dynamic 7-day chronological calendar mapping to prevent seed data fallbacks
  const trendData = (() => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      list.push({
        matchDate: `${year}-${month}-${day}`,
        salesDate: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        dailyRevenue: 0,
        billsCount: 0
      });
    }
    return list;
  })();

  // Merge live database salesTrend into calendar dates
  if (salesTrend && salesTrend.length > 0) {
    salesTrend.forEach((item: any) => {
      const rawDateStr = typeof item.salesDate === 'string' ? item.salesDate.split('T')[0] : '';
      const matched = trendData.find(d => d.matchDate === rawDateStr);
      if (matched) {
        matched.dailyRevenue = Number(item.dailyRevenue);
        matched.billsCount = Number(item.billsCount);
      }
    });
  }

  const maxRevenue = Math.max(...trendData.map((d: any) => d.dailyRevenue), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-black text-[#0b1c30]">
            {currentUser?.role === 'Owner' ? "Today's Overview" : 'My Dashboard'}
          </h2>
          <p className="font-sans text-sm text-[#45464d] mt-1 font-medium">
            {currentUser?.role === 'Owner' 
              ? `Live metrics for ${currentBranch} Branch` 
              : `Logged in as ${currentUser?.role} - Shift Performance`}
          </p>
        </div>
        <div className="flex gap-2">
          {currentUser?.role === 'Owner' && (
            <button 
              id="reports-btn"
              onClick={() => showToast(`Generating PDF Reports for ${currentBranch} Branch...`, "info")}
              className="bg-white border border-[#c6c6cd] text-[#0b1c30] font-sans text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#eff4ff] shadow-sm transition-all cursor-pointer"
            >
              View Reports
            </button>
          )}
          <button 
            id="billing-shortcuts"
            onClick={onNavigateToBilling}
            className="bg-[#006a61] text-white font-sans text-xs font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 shadow-sm transition-all cursor-pointer"
          >
            + New Quick {t('invoice')}
          </button>
        </div>
      </div>

      {/* Progressive Onboarding Setup Checklist Banner */}
      {config && config.onboardingProgressPercentage < 100 && (
        <div className="bg-gradient-to-r from-[#006a61] to-[#0b1c30] text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#86f2e4]" size={20} />
                <h3 className="font-display font-extrabold text-lg text-white">Welcome to BillCom 👋</h3>
              </div>
              <p className="text-xs text-[#86f2e4] font-sans font-medium">
                Your business is set up for <strong>{config.businessType}</strong>. Let's finish your initial configuration:
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <div className="text-right">
                <span className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">Setup Status</span>
                <p className="text-sm font-extrabold text-white font-mono">{config.onboardingProgressPercentage}% Complete</p>
              </div>
              <div className="w-12 bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-[#86f2e4] h-full transition-all duration-500" style={{ width: `${config.onboardingProgressPercentage}%` }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-xs font-semibold">
            {config.completedSetupSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[#86f2e4]">
                <span>✓</span>
                <span className="line-through opacity-80">{step}</span>
              </div>
            ))}
            {config.pendingSetupSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-white/90">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vyapar Core Financial Hero Cards: You'll Get, You'll Give, Cash, Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. You'll Get (Receivables) */}
        <div 
          onClick={onNavigateToCustomers}
          className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>You'll Get (Receivables)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl lg:text-3xl font-black text-emerald-900">
              ₹{heroMetrics.youllGet.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-700 font-semibold">
              <span>{heroMetrics.dueCustomersCount} party dues pending</span>
              <span className="text-emerald-800 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                Khata &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* 2. You'll Give (Payables) */}
        <div className="bg-gradient-to-br from-rose-50 to-red-50/40 border border-rose-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>You'll Give (Payables)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl lg:text-3xl font-black text-rose-900">
              ₹{heroMetrics.youllGive.toLocaleString('en-IN')}
            </span>
            <p className="mt-1 text-[11px] text-rose-700 font-semibold">
              Supplier &amp; operational dues
            </p>
          </div>
        </div>

        {/* 3. Cash in Hand & Bank */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50/40 border border-indigo-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Cash in Hand &amp; UPI</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl lg:text-3xl font-black text-indigo-900">
              ₹{heroMetrics.cashInHand.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-indigo-700 font-semibold">
              <span>Cash: ₹{heroMetrics.cashToday.toLocaleString('en-IN')}</span>
              <span>&bull;</span>
              <span>UPI: ₹{heroMetrics.upiToday.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* 4. Total Stock Value */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Total Stock Value</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-display text-2xl lg:text-3xl font-black text-amber-900">
              ₹{heroMetrics.stockValue.toLocaleString('en-IN')}
            </span>
            <p className="mt-1 text-[11px] text-amber-700 font-semibold">
              {heroMetrics.stockCount} inventory SKUs cataloged
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white border border-[#e2e8f0]/80 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-ambient-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <Coins size={44} className="text-[#006a61]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#006a61]"></div>
            <span className="font-sans text-xs text-[#45464d] font-semibold tracking-wider uppercase">
              {currentUser?.role === 'Owner' ? "Today's Revenue" : 'My Revenue Contrib.'}
            </span>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl font-black text-[#0b1c30]">₹{summary.totalRevenue.toLocaleString()}</span>
            <div className="flex items-center gap-1 mt-1 text-[#006a61]">
              <TrendingUp size={14} />
              <span className="font-sans text-xs font-semibold">Live catalog data</span>
            </div>
          </div>
        </div>

        {/* Bills Generated */}
        <div className="bg-white border border-[#e2e8f0]/80 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-ambient-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <Receipt size={44} className="text-[#86f2e4]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#86f2e4]"></div>
            <span className="font-sans text-xs text-[#45464d] font-semibold tracking-wider uppercase">
              {currentUser?.role === 'Owner' ? 'Bills Generated' : 'My Invoices Compiled'}
            </span>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl font-black text-[#0b1c30]">{summary.totalBills}</span>
            <p className="font-sans text-xs text-[#7c839b] mt-1 font-medium">Accumulative invoice count</p>
          </div>
        </div>

        {/* Customers Served */}
        <div className="bg-white border border-[#e2e8f0]/80 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-ambient-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <Users size={44} className="text-[#45464d]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#131b2e]"></div>
            <span className="font-sans text-xs text-[#45464d] font-semibold tracking-wider uppercase">
              {currentUser?.role === 'Owner' ? 'Registered Customers' : 'Customers I Served'}
            </span>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl font-black text-[#0b1c30]">{summary.totalCustomers}</span>
            <p className="font-sans text-xs text-[#7c839b] mt-1 font-medium">Active CRM accounts</p>
          </div>
        </div>

        {/* Pending Payments / Shift Status */}
        <div className={`bg-white border rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-ambient-md transition-all ${
          currentUser?.role === 'Owner' ? 'border-[#ba1a1a]/20 bg-[#ffdad6]/10' : 'border-[#006a61]/20 bg-[#e6f4ea]/10'
        }`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            {currentUser?.role === 'Owner' ? (
              <AlertCircle size={44} className="text-[#ba1a1a]" />
            ) : (
              <Sparkles size={44} className="text-[#006a61]" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentUser?.role === 'Owner' ? 'bg-[#ba1a1a]' : 'bg-[#006a61]'}`}></div>
            <span className={`font-sans text-xs font-semibold tracking-wider uppercase ${
              currentUser?.role === 'Owner' ? 'text-[#ba1a1a]' : 'text-[#006a61]'
            }`}>
              {currentUser?.role === 'Owner' ? 'Low Stock Alerts' : 'Shift Status'}
            </span>
          </div>
          <div className="mt-4">
            <span className={`font-display text-3xl font-black ${
              currentUser?.role === 'Owner' ? 'text-[#ba1a1a]' : 'text-[#006a61]'
            }`}>
              {currentUser?.role === 'Owner' ? summary.lowStockCount : 'Active'}
            </span>
            <p className="font-sans text-xs text-[#45464d] mt-1 font-medium">
              {currentUser?.role === 'Owner' ? 'SKUs below safety limit' : `Logged in as ${currentUser?.role}`}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts & Top Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend last 7 Days */}
        <div className="bg-white border border-[#e2e8f0]/80 rounded-xl p-6 shadow-sm col-span-1 lg:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-[#0b1c30]">Revenue Trend</h3>
              <p className="font-sans text-xs text-[#7c839b] font-medium">Daily billing aggregates</p>
            </div>
            <div className="flex gap-1.5 bg-[#eff4ff] p-1 rounded-lg">
              <button 
                onClick={() => setSelectedRep('7days')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${selectedRep === '7days' ? 'bg-white text-[#006f66] shadow-sm' : 'text-[#45464d]'}`}
              >
                7 Days
              </button>
            </div>
          </div>

          {/* svg-based chart */}
          <div className="bg-[#eff4ff]/60 rounded-xl p-4 flex-1 min-h-[180px] flex items-end gap-2 relative">
            {trendData.map((d: any, idx: number) => {
              const heightPercent = Math.max((d.dailyRevenue / maxRevenue) * 90, 5);
              const label = d.salesDate;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                  <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-[#0b1c30] text-[#86f2e4] text-[10px] font-bold px-2 py-1 rounded-md shadow-lg transition-all transform pointer-events-none z-10">
                    ₹{d.dailyRevenue.toLocaleString()}
                  </div>
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-lg transition-all duration-500 hover:scale-x-105 ${
                      idx === trendData.length - 1 
                        ? 'bg-[#006a61]' 
                        : 'bg-[#006a61]/35 group-hover:bg-[#006a61]/60'
                    }`}
                  ></div>
                  <span className="font-sans text-[10px] text-[#7c839b] font-semibold mt-2">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Services */}
        <div className="bg-white border border-[#e2e8f0]/80 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold text-[#0b1c30]">Top Services</h3>
            <p className="font-sans text-xs text-[#7c839b] font-medium">By revenue contribution</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-1">
            {topServices && topServices.length > 0 ? (
              topServices.map((service: any) => (
                <div key={service.serviceId} className="flex items-center justify-between p-3 hover:bg-[#eff4ff] rounded-xl transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#86f2e4] flex items-center justify-center text-[#006a61]">
                      <Scissors size={16} />
                    </div>
                    <div>
                      <h4 className="font-sans text-xs font-bold text-[#0b1c30]">{service.serviceName}</h4>
                      <p className="font-sans text-[10px] text-[#7c839b] font-semibold leading-none mt-0.5">{service.totalQuantity} bookings</p>
                    </div>
                  </div>
                  <span className="font-sans text-sm font-bold text-[#0b1c30]">₹{service.totalRevenue.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <Sparkles size={24} className="text-[#c6c6cd] mb-2" />
                <p className="text-xs text-[#7c839b] font-bold">No sales data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Recent Activity Transaction Table */}
      <div className={`grid grid-cols-1 ${currentUser?.role === 'Owner' ? 'lg:grid-cols-3' : ''} gap-6`}>
        <div className={`bg-white border border-[#e2e8f0]/80 rounded-xl shadow-sm p-6 ${currentUser?.role === 'Owner' ? 'lg:col-span-2' : 'col-span-full'}`}>
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#e2e8f0]/40">
            <div>
              <h3 className="font-display text-lg font-bold text-[#0b1c30]">
                {currentUser?.role === 'Owner' ? 'Recent Activity Logs' : 'My Recent Invoices'}
              </h3>
              <p className="font-sans text-xs text-[#7c839b] font-medium">
                {currentUser?.role === 'Owner' ? 'Real-time point-of-sale audits' : 'List of invoices processed in this shift'}
              </p>
            </div>
            <button 
              id="view-all-bills-dashboard"
              onClick={onNavigateToBilling}
              className="text-[#006f66] hover:text-[#0b1c30] text-xs font-bold transition-colors cursor-pointer"
            >
              Terminal Panel →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Bill Number</th>
                  <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Customer</th>
                  {currentUser?.role === 'Owner' && (
                    <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Billed By</th>
                  )}
                  <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Timestamp</th>
                  <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Status</th>
                  <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBills && recentBills.length > 0 ? (
                  recentBills.map((bill: any, index: number) => (
                    <tr 
                      key={bill.id} 
                      className={`hover:bg-[#eff4ff] transition-all duration-150 ${index % 2 === 1 ? 'bg-[#f8f9ff]/50' : ''}`}
                    >
                      <td className="py-3 px-3 font-sans text-xs font-bold text-[#006f66]">{bill.billNumber}</td>
                      <td className="py-3 px-3 font-sans text-xs font-semibold text-[#0b1c30]">{bill.customerName}</td>
                      {currentUser?.role === 'Owner' && (
                        <td className="py-3 px-3 font-sans text-xs font-semibold text-[#45464d]">{bill.staffName || 'Owner'}</td>
                      )}
                      <td className="py-3 px-3 font-sans text-xs text-[#45464d]">{new Date(bill.createdAt).toLocaleTimeString()}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          bill.status === 'Paid' 
                            ? 'bg-[#e6f4ea] text-[#1e8e3e]' 
                            : 'bg-[#ffdad6] text-[#ba1a1a]'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-xs font-bold text-[#0b1c30] text-right">
                        ₹{bill.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={currentUser?.role === 'Owner' ? 6 : 5} className="py-8 text-center text-xs text-[#7c839b] font-semibold">No recent invoices recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {currentUser?.role === 'Owner' && (
          <div className="bg-white border border-[#e2e8f0]/80 rounded-xl shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#e2e8f0]/40">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#0b1c30]">Stock Safeguards</h3>
                  <p className="font-sans text-xs text-[#7c839b] font-medium">Critical reorder status</p>
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[220px]">
              {lowStockItems && lowStockItems.length > 0 ? (
                lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-[#ffdad6]/10 border border-[#ba1a1a]/10 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="text-[#ba1a1a]" size={16} />
                      <div>
                        <h4 className="font-sans text-xs font-bold text-[#0b1c30]">{item.name}</h4>
                        <p className="font-mono text-[9px] text-[#ba1a1a] uppercase mt-0.5">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-[#ba1a1a]">{item.currentStock} {item.unit}</p>
                      <p className="text-[9px] text-[#7c839b] font-bold">Limit: {item.reorderLevel}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="text-[#1e8e3e] mb-2" size={24} />
                  <p className="text-xs text-[#1e8e3e] font-bold">All items fully stocked!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </motion.div>
  );
}
