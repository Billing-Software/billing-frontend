import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Receipt, 
  Users, 
  AlertCircle, 
  Sparkles, 
  Coins, 
  Scissors 
} from 'lucide-react';
import { Bill } from '../../types';

interface DashboardProps {
  bills: Bill[];
  onNavigateToBilling: () => void;
  onNavigateToStaff: () => void;
  onNavigateToServices: () => void;
  currentBranch: 'Main' | 'Downtown';
}

export default function Dashboard({ 
  bills, 
  onNavigateToBilling, 
  onNavigateToStaff, 
  onNavigateToServices,
  currentBranch 
}: DashboardProps) {
  const [selectedRep, setSelectedRep] = useState<string>('weekly');

  const paidBills = bills.filter(b => b.status === 'Paid');
  const pendingBills = bills.filter(b => b.status === 'Pending');

  const multiplier = currentBranch === 'Downtown' ? 0.8 : 1.0;
  
  const todayRevenue = Math.round(12450 * multiplier);
  const billsGenerated = Math.round(24 * multiplier);
  const customersServed = Math.round(18 * multiplier);
  const pendingAmount = Math.round(1200 * multiplier);

  const last7DaysRevenue = [40, 60, 30, 80, 70, 90, 100].map(v => v * multiplier);
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const recentBills = bills;

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
          <h2 className="font-display text-3xl font-black text-[#0b1c30]">Today's Overview</h2>
          <p className="font-sans text-sm text-[#45464d] mt-1 font-medium">Live metrics for {currentBranch} Branch</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="reports-btn"
            onClick={() => alert(`Generating PDF Reports for ${currentBranch} Branch...`)}
            className="bg-white border border-[#c6c6cd] text-[#0b1c30] font-sans text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#eff4ff] shadow-sm transition-all"
          >
            View Reports
          </button>
          <button 
            id="billing-shortcuts"
            onClick={onNavigateToBilling}
            className="bg-[#006a61] text-white font-sans text-xs font-semibold px-4 py-2 rounded-lg hover:bg-opacity-90 shadow-sm transition-all"
          >
            New Quick Bill
          </button>
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
            <span className="font-sans text-xs text-[#45464d] font-semibold tracking-wider uppercase">Today's Revenue</span>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl font-black text-[#0b1c30]">₹{todayRevenue.toLocaleString()}</span>
            <div className="flex items-center gap-1 mt-1 text-[#006a61]">
              <TrendingUp size={14} />
              <span className="font-sans text-xs font-semibold">+14% vs yesterday</span>
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
            <span className="font-sans text-xs text-[#45464d] font-semibold tracking-wider uppercase">Bills Generated</span>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl font-black text-[#0b1c30]">{billsGenerated}</span>
            <p className="font-sans text-xs text-[#7c839b] mt-1 font-medium">Standard ticket sizes</p>
          </div>
        </div>

        {/* Customers Served */}
        <div className="bg-white border border-[#e2e8f0]/80 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-ambient-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <Users size={44} className="text-[#45464d]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#131b2e]"></div>
            <span className="font-sans text-xs text-[#45464d] font-semibold tracking-wider uppercase">Customers Served</span>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl font-black text-[#0b1c30]">{customersServed}</span>
            <p className="font-sans text-xs text-[#7c839b] mt-1 font-medium">92% retention rate</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white border border-[#ba1a1a]/20 bg-[#ffdad6]/10 rounded-xl p-5 shadow-sm relative overflow-hidden group hover:shadow-ambient-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <AlertCircle size={44} className="text-[#ba1a1a]" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#ba1a1a]"></div>
            <span className="font-sans text-xs text-[#ba1a1a] font-semibold tracking-wider uppercase">Pending Payments</span>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl font-black text-[#ba1a1a]">₹{pendingAmount.toLocaleString()}</span>
            <p className="font-sans text-xs text-[#45464d] mt-1 font-medium">3 invoices overdue</p>
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
              <p className="font-sans text-xs text-[#7c839b] font-medium">Last 7 operational days</p>
            </div>
            <div className="flex gap-1.5 bg-[#eff4ff] p-1 rounded-lg">
              <button 
                onClick={() => setSelectedRep('weekly')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedRep === 'weekly' ? 'bg-white text-[#006f66] shadow-sm' : 'text-[#45464d]'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setSelectedRep('monthly')}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${selectedRep === 'monthly' ? 'bg-white text-[#006f66] shadow-sm' : 'text-[#45464d]'}`}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* D3/Custom High Fidelity Interactive SVG Graph */}
          <div className="bg-[#eff4ff]/60 rounded-xl p-4 flex-1 min-h-[180px] flex items-end gap-2 relative">
            {last7DaysRevenue.map((heightPercent, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-[#0b1c30] text-[#86f2e4] text-[10px] font-bold px-2 py-1 rounded-md shadow-lg transition-all transform pointer-events-none z-10">
                  ₹{Math.round((heightPercent * 250) * multiplier).toLocaleString()}
                </div>
                <div 
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t-lg transition-all duration-500 hover:scale-x-105 ${
                    idx === 6 
                      ? 'bg-[#006a61]' 
                      : 'bg-[#006a61]/35 group-hover:bg-[#006a61]/60'
                  }`}
                ></div>
                <span className="font-sans text-[10px] text-[#7c839b] font-semibold mt-2">{weekdays[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Services */}
        <div className="bg-white border border-[#e2e8f0]/80 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="font-display text-lg font-bold text-[#0b1c30]">Top Services</h3>
            <p className="font-sans text-xs text-[#7c839b] font-medium">By weekly volume</p>
          </div>

          <div className="flex-1 space-y-3">
            {/* Top 1 */}
            <div className="flex items-center justify-between p-3 hover:bg-[#eff4ff] rounded-xl transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#86f2e4] flex items-center justify-center text-[#006a61]">
                  <Scissors size={16} />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-[#0b1c30]">Hair Cut</h4>
                  <p className="font-sans text-[10px] text-[#7c839b] font-semibold leading-none mt-0.5">38 bookings</p>
                </div>
              </div>
              <span className="font-sans text-sm font-bold text-[#0b1c30]">₹4,500</span>
            </div>

            {/* Top 2 */}
            <div className="flex items-center justify-between p-3 hover:bg-[#eff4ff] rounded-xl transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#dce9ff] flex items-center justify-center text-[#131b2e]">
                  <Receipt size={16} />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-[#0b1c30]">Consultation</h4>
                  <p className="font-sans text-[10px] text-[#7c839b] font-semibold leading-none mt-0.5">14 bookings</p>
                </div>
              </div>
              <span className="font-sans text-sm font-bold text-[#0b1c30]">₹3,200</span>
            </div>

            {/* Top 3 */}
            <div className="flex items-center justify-between p-3 hover:bg-[#eff4ff] rounded-xl transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#006f66]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="font-sans text-xs font-bold text-[#0b1c30]">Spa Therapy</h4>
                  <p className="font-sans text-[10px] text-[#7c839b] font-semibold leading-none mt-0.5">9 bookings</p>
                </div>
              </div>
              <span className="font-sans text-sm font-bold text-[#0b1c30]">₹2,800</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Activity Transaction Table */}
      <div className="bg-white border border-[#e2e8f0]/80 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#e2e8f0]/40">
          <div>
            <h3 className="font-display text-lg font-bold text-[#0b1c30]">Recent Activity Logs</h3>
            <p className="font-sans text-xs text-[#7c839b] font-medium">Real-time point-of-sale audits</p>
          </div>
          <button 
            id="view-all-bills-dashboard"
            onClick={onNavigateToBilling}
            className="text-[#006f66] hover:text-[#0b1c30] text-xs font-bold transition-colors"
          >
            Terminal Panel →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Bill ID</th>
                <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Customer</th>
                <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Timestamp</th>
                <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30">Status</th>
                <th className="py-2.5 px-3 font-sans text-xs font-bold text-[#7c839b] uppercase tracking-wider border-b border-[#e2e8f0]/30 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBills.slice(0, 5).map((bill, index) => (
                <tr 
                  key={bill.id} 
                  className={`hover:bg-[#eff4ff] transition-all duration-150 ${index % 2 === 1 ? 'bg-[#f8f9ff]/50' : ''}`}
                >
                  <td className="py-3 px-3 font-sans text-xs font-bold text-[#006f66]">{bill.id}</td>
                  <td className="py-3 px-3 font-sans text-xs font-semibold text-[#0b1c30]">{bill.customerName}</td>
                  <td className="py-3 px-3 font-sans text-xs text-[#45464d]">{bill.timestamp}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
