import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Store, 
  Users, 
  Receipt, 
  CloudCheck, 
  MessageSquare, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  RotateCw, 
  Headphones, 
  Check, 
  X,
  CreditCard,
  Building2,
  Lock,
  Zap,
  Clock,
  AlertTriangle,
  Copy,
  QrCode,
  Smartphone,
  CheckCheck
} from 'lucide-react';
import { subscriptionService, DEFAULT_PLANS } from '../../services/subscription.service';
import { SubscriptionOverview, SubscriptionPlan } from '../../types/subscription.types';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

export default function SubscriptionView() {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const [overview, setOverview] = useState<SubscriptionOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<SubscriptionPlan | null>(null);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<'gateway' | 'upi'>('gateway');
  const [upiUtrRef, setUpiUtrRef] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await subscriptionService.getOverview();
      setOverview(data);
    } catch (err: any) {
      showToast('Error loading subscription details: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRazorpayPayment = () => {
    if (!upgradeModalPlan) return;
    const basePrice = billingCycle === 'yearly' ? upgradeModalPlan.yearlyPrice : upgradeModalPlan.monthlyPrice;
    const gst = Math.round(basePrice * 0.18);
    const total = basePrice + gst;

    if (typeof (window as any).Razorpay === 'undefined') {
      showToast('Razorpay payment gateway is loading. Please wait 2 seconds.', 'info');
      return;
    }

    try {
      setIsProcessingUpgrade(true);
      const rzpKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TOC2CA6GYJnxxx';
      const rzp = new (window as any).Razorpay({
        key: rzpKey,
        amount: total * 100, // in paise
        currency: 'INR',
        name: 'BillCom POS',
        description: `${upgradeModalPlan.name} Subscription (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
        prefill: {
          name: currentUser?.name || currentUser?.username || 'BillCom Merchant',
          email: currentUser?.email || 'merchant@billcom.in',
          contact: ''
        },
        theme: {
          color: '#006a61'
        },
        modal: {
          ondismiss: () => {
            setIsProcessingUpgrade(false);
            showToast('Payment cancelled by user. Subscription was not upgraded.', 'info');
          }
        },
        handler: async (response: any) => {
          try {
            const paymentId = response.razorpay_payment_id || `pay_rzp_${Date.now()}`;
            await subscriptionService.upgradeSubscription({
              planId: upgradeModalPlan.id,
              billingCycle,
              paymentMethod: 'Razorpay',
              razorpayPaymentId: paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            showToast(`Payment of ₹${total} received! Upgraded to ${upgradeModalPlan.name}!`, 'success');
            setUpgradeModalPlan(null);
            await loadData();
            window.dispatchEvent(new Event('subscription_updated'));
          } catch (err: any) {
            showToast('Activation failed: ' + (err.message || 'Unknown error'), 'error');
          } finally {
            setIsProcessingUpgrade(false);
          }
        }
      });

      rzp.on('payment.failed', (response: any) => {
        setIsProcessingUpgrade(false);
        showToast(`Payment declined: ${response.error?.description || 'Transaction failed'}`, 'error');
      });

      rzp.open();
    } catch (err: any) {
      setIsProcessingUpgrade(false);
      showToast('Payment initialization error: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUpi(true);
    showToast('UPI VPA copied to clipboard: ' + text, 'info');
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleUpiPayment = async () => {
    if (!upgradeModalPlan) return;
    const basePrice = billingCycle === 'yearly' ? upgradeModalPlan.yearlyPrice : upgradeModalPlan.monthlyPrice;
    const gst = Math.round(basePrice * 0.18);
    const total = basePrice + gst;
    const refId = upiUtrRef.trim() || `upi_txn_${Date.now()}`;

    try {
      setIsProcessingUpgrade(true);
      await subscriptionService.upgradeSubscription({
        planId: upgradeModalPlan.id,
        billingCycle,
        paymentMethod: 'UPI',
        razorpayPaymentId: refId
      });

      showToast(`UPI Payment of ₹${total.toLocaleString('en-IN')} verified! Upgraded to ${upgradeModalPlan.name}!`, 'success');
      setUpgradeModalPlan(null);
      setUpiUtrRef('');
      await loadData();
      window.dispatchEvent(new Event('subscription_updated'));
    } catch (err: any) {
      showToast('Activation failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-9 h-9 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading subscription parameters...</p>
      </div>
    );
  }

  const plans = overview?.plans || DEFAULT_PLANS;
  const activePlanId = overview?.activePlanId || 1;
  const isActive = overview?.subscriptionStatus?.toLowerCase() === 'active' && !overview?.isExpired;
  const branchMax = (overview?.allowedBranches === -1 || (overview?.allowedBranches ?? 1) > 90) ? 99 : (overview?.allowedBranches ?? 1);
  const staffMax = (overview?.allowedStaff === -1 || (overview?.allowedStaff ?? 2) > 90) ? 99 : (overview?.allowedStaff ?? 2);

  const branchProgress = Math.min(100, Math.round(((overview?.usedBranches ?? 1) / (branchMax || 1)) * 100));
  const staffProgress = Math.min(100, Math.round(((overview?.usedStaff ?? 1) / (staffMax || 1)) * 100));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#004d46] via-[#006a61] to-[#0a7e74] text-white p-6 sm:p-8 shadow-lg shadow-[#006a61]/15">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#ffd54f] text-[11px] font-black uppercase tracking-wider border border-white/10">
                <Crown size={14} className="text-[#ffd54f]" />
                CURRENT ACTIVE SUBSCRIPTION
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${
                overview?.isTrialExpired
                  ? 'bg-rose-600 text-white shadow-rose-600/30'
                  : overview?.isTrial
                  ? 'bg-amber-500 text-white shadow-amber-500/30'
                  : isActive
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-rose-500 text-white'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                {overview?.isTrialExpired ? 'TRIAL EXPIRED' : overview?.isTrial ? '7-DAY TRIAL' : (overview?.subscriptionStatus || 'ACTIVE')}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{overview?.planName || 'Starter Shop'}</h2>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl font-medium">
              {overview?.planSubtitle || 'General Point of Sale and Single Store Operations.'}
            </p>
          </div>

          {/* Expiry Pill & Refresh Action */}
          <div className="flex flex-col sm:items-end gap-2 bg-black/20 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-xs text-white/90">
              <Calendar size={15} className="text-[#86f2e4]" />
              <span className="font-semibold">
                {overview?.isTrialExpired
                  ? `7-Day Free Trial expired on ${new Date(overview.trialEndsAt || overview.subscriptionExpiresAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : overview?.isTrial
                  ? `Free Trial ends on ${new Date(overview.trialEndsAt || overview.subscriptionExpiresAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${overview.trialDaysRemaining} days remaining)`
                  : overview?.subscriptionExpiresAt 
                  ? `Renews on ${new Date(overview.subscriptionExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${overview?.daysRemaining ?? 30} days remaining)`
                  : 'Active Perpetual License'}
              </span>
            </div>
            <div className="text-[11px] font-medium text-teal-200">
              {overview?.isTrialExpired
                ? '⚠️ Trial period completed. Please upgrade to continue.'
                : overview?.isTrial
                ? `⚡ ${overview?.trialDaysRemaining ?? 7} days of full feature access remaining`
                : isActive
                ? `✓ ${overview?.daysRemaining ?? 30} days validity remaining`
                : 'Subscription expired. Please renew.'}
            </div>
            <button
              onClick={loadData}
              className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#86f2e4] hover:text-white transition-colors cursor-pointer"
            >
              <RotateCw size={12} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1.5 Trial Tracker Banner */}
      {overview?.isTrial && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 sm:p-6 border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
            overview.isTrialExpired
              ? 'bg-gradient-to-r from-rose-50 via-rose-100/60 to-amber-50 border-rose-200 text-rose-900'
              : 'bg-gradient-to-r from-amber-50 via-orange-50/70 to-teal-50/60 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${
              overview.isTrialExpired
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
            }`}>
              {overview.isTrialExpired ? <AlertTriangle size={24} /> : <Zap size={24} />}
            </div>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-base sm:text-lg">
                  {overview.isTrialExpired ? '7-Day Free Trial Expired' : '7-Day Free Trial Active'}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  overview.isTrialExpired
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-600 text-white animate-pulse'
                }`}>
                  {overview.isTrialExpired ? 'EXPIRED' : `${overview.trialDaysRemaining} DAYS LEFT`}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium opacity-90 max-w-xl">
                {overview.isTrialExpired
                  ? `Your 7-day trial ended on ${new Date(overview.trialEndsAt || overview.subscriptionExpiresAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Activate a subscription plan to retain uninterrupted access to your invoices, branches, and staff.`
                  : `Your free trial concludes in ${overview.trialDaysRemaining} day${overview.trialDaysRemaining === 1 ? '' : 's'} on ${new Date(overview.trialEndsAt || overview.subscriptionExpiresAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}. Choose a subscription plan today to lock in continuous store operations.`
                }
              </p>

              {/* Visual Day Progress Tracker */}
              <div className="pt-2 space-y-1.5">
                <div className="w-48 sm:w-72 h-2.5 bg-amber-200/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      overview.isTrialExpired
                        ? 'bg-rose-600 w-full'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{
                      width: overview.isTrialExpired
                        ? '100%'
                        : `${Math.min(100, Math.max(14, ((7 - (overview.trialDaysRemaining ?? 0)) / 7) * 100))}%`
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-900/80 max-w-[288px]">
                  <span>Day 1 (Started)</span>
                  <span className={overview.isTrialExpired ? 'text-rose-700 font-black' : 'text-emerald-700 font-bold'}>
                    {overview.isTrialExpired ? 'Upgrade required' : 'Full access included'}
                  </span>
                  <span>Day 7 (Limit)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={() => {
                const growthPlan = plans.find(p => p.id === 2) || plans[1] || plans[0];
                setUpgradeModalPlan(growthPlan);
              }}
              className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                overview.isTrialExpired
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
              }`}
            >
              <Crown size={15} />
              <span>{overview.isTrialExpired ? 'Activate Plan Now' : 'Upgrade & Keep Access'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. Usage & Quotas (Live Gauges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outlets Gauge */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="p-2 rounded-lg bg-teal-50 text-[#006a61]">
                <Store size={18} />
              </div>
              <span className="text-xs font-bold">Store Outlets</span>
            </div>
            <span className="text-xs font-black text-slate-800">
              {overview?.usedBranches} / {overview?.allowedBranches === -1 ? '∞' : overview?.allowedBranches}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#006a61] h-full rounded-full transition-all duration-500" 
              style={{ width: `${branchProgress}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            {overview?.usedBranches && branchMax && overview.usedBranches >= branchMax 
              ? 'Branch allocation reached' 
              : `${branchMax - (overview?.usedBranches || 1)} additional outlet slots left`}
          </p>
        </div>

        {/* Staff Profiles Gauge */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users size={18} />
              </div>
              <span className="text-xs font-bold">Staff Accounts</span>
            </div>
            <span className="text-xs font-black text-slate-800">
              {overview?.usedStaff} / {overview?.allowedStaff === -1 ? '∞' : overview?.allowedStaff}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${staffProgress}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            {overview?.usedStaff && staffMax && overview.usedStaff >= staffMax 
              ? 'Staff account limit reached' 
              : `${staffMax - (overview?.usedStaff || 1)} cashier profile slots available`}
          </p>
        </div>

        {/* Unlimited Invoicing */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Receipt size={18} />
            </div>
            <div>
              <span className="text-xs font-bold block">Tax Invoices</span>
              <span className="text-[10px] text-slate-500 font-medium">Monthly volume</span>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base font-black text-emerald-600 uppercase tracking-wider">Unlimited</span>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Zero per-bill commission fee</p>
          </div>
        </div>

        {/* Cloud & SMS Status */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <MessageSquare size={18} />
            </div>
            <div>
              <span className="text-xs font-bold block">SMS & Cloud</span>
              <span className="text-[10px] text-slate-500 font-medium">Sync engine</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#006a61] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              <ShieldCheck size={13} />
              DLT Enabled
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              24/7 Cloud
            </span>
          </div>
        </div>
      </div>

      {/* 3. Billing Cycle Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
        <div>
          <h3 className="text-base font-bold text-slate-900">Available Subscription Tiers</h3>
          <p className="text-xs text-slate-500 font-medium">Choose the ideal billing infrastructure for your store scale.</p>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'yearly'
                ? 'bg-white text-[#006a61] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* 4. Plan Cards Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === activePlanId;
          const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
          const period = billingCycle === 'yearly' ? '/year' : '/month';

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between bg-white rounded-2xl transition-all duration-300 ${
                isCurrent 
                  ? 'border-2 border-[#006a61] shadow-md shadow-[#006a61]/10' 
                  : plan.isPopular
                  ? 'border-2 border-blue-500 shadow-md shadow-blue-500/10'
                  : 'border border-slate-200/90 shadow-sm hover:border-slate-300'
              }`}
            >
              {/* Header Badges */}
              {plan.isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  Recommended For Retailers
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#006a61] text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  Your Current Plan
                </div>
              )}

              <div className="p-6 space-y-4 flex-1">
                <div>
                  <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                  <p className="text-xs text-slate-500 font-medium min-h-[32px] mt-1">{plan.subtitle}</p>
                </div>

                {/* Price Display */}
                <div className="py-2 border-y border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#006a61]">₹{price}</span>
                    <span className="text-xs text-slate-400 font-semibold">{period}</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mt-1 inline-block">
                      Includes 2 Months Free
                    </span>
                  )}
                </div>

                {/* Key Capacity Badges */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                    {plan.maxBranches === -1 ? 'Unlimited Outlets' : `${plan.maxBranches} Store Outlet${plan.maxBranches > 1 ? 's' : ''}`}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                    {plan.maxStaff === -1 ? 'Unlimited Staff' : `${plan.maxStaff} Staff Profiles`}
                  </span>
                </div>

                {/* Features Checklist */}
                <ul className="space-y-2.5 pt-2">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      {feat.included ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={15} className="text-slate-300 shrink-0 mt-0.5" />
                      )}
                      <span className={feat.included ? 'text-slate-700 font-medium' : 'text-slate-400 line-through'}>
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                {isCurrent && !overview?.isTrial && !overview?.isTrialExpired ? (
                  <div className="w-full py-2.5 bg-slate-100 text-[#006a61] text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 border border-slate-200">
                    <Check size={15} />
                    <span>Active Plan</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setUpgradeModalPlan(plan)}
                    className={`w-full py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 ${
                      plan.isPopular
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-[#006a61] hover:bg-[#005a52]'
                    }`}
                  >
                    <span>
                      {isCurrent
                        ? `Activate ${plan.name} (End Trial)`
                        : (plan.id > activePlanId
                            ? `Upgrade to ${plan.name}`
                            : `Switch to ${plan.name}`)}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. GST & Tax Invoicing Info */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-teal-50 text-[#006a61]">
              <Building2 size={18} />
            </span>
            <h4 className="text-sm font-bold text-slate-800">GST Input Tax Credit (ITC) Compliance</h4>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl font-medium">
            All subscription invoices include 18% GST. Software fees are 100% tax-deductible for commercial businesses in India.
          </p>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To Entity</span>
            <span className="text-xs font-bold text-slate-800 block truncate max-w-[200px]">{overview?.legalName || 'Your Business'}</span>
            <span className="text-[11px] font-mono text-emerald-600 font-bold block">
              {overview?.gstIn ? `GSTIN: ${overview.gstIn}` : 'No GSTIN registered'}
            </span>
          </div>
          {overview?.gstIn && (
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md">
              ITC ELIGIBLE
            </span>
          )}
        </div>
      </div>

      {/* 6. Past Transactions Ledger */}
      {overview?.billingHistory && overview.billingHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">Recent Payment Transactions</h4>
            <span className="text-xs text-slate-500 font-semibold">{overview.billingHistory.length} Recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Reference ID</th>
                  <th className="py-2.5">Method</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {overview.billingHistory.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 font-mono text-slate-500">
                      {tx.razorpayPaymentId || `TXN-${tx.id}`}
                    </td>
                    <td className="py-3 capitalize">{tx.paymentMethod || 'Razorpay'}</td>
                    <td className="py-3 font-bold text-emerald-600">₹{tx.amount}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                        {tx.status || 'Captured'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Enterprise Custom Callout */}
      <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Headphones size={20} />
          </div>
          <div>
            <h5 className="text-xs font-bold text-emerald-950">Need Custom Franchise Limits or Multi-City Deployment?</h5>
            <p className="text-[11px] text-emerald-700 font-medium">
              We provide custom SLA, on-premise cloud sync, and dedicated account manager services for 25+ outlets.
            </p>
          </div>
        </div>
        <button
          onClick={() => window.open('https://wa.me/919999999999?text=Hi%20BillCom%20Enterprise%20Sales', '_blank')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          Contact Enterprise Team
        </button>
      </div>

      {/* Upgrade & Payment Checkout Modal */}
      <AnimatePresence>
        {upgradeModalPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-50 text-[#006a61]">
                    <Crown size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">Secure Plan Upgrade</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Complete payment to activate your store features</p>
                  </div>
                </div>
                <button
                  onClick={() => setUpgradeModalPlan(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Price Breakdown & Secure Checkout */}
              {(() => {
                const basePrice = billingCycle === 'yearly' ? upgradeModalPlan.yearlyPrice : upgradeModalPlan.monthlyPrice;
                const gst = Math.round(basePrice * 0.18);
                const total = basePrice + gst;

                return (
                  <div className="space-y-4">
                    {/* Summary Row */}
                    <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/80 text-xs font-medium">
                      <div className="flex justify-between text-slate-600">
                        <span>Selected Plan:</span>
                        <strong className="text-slate-900">{upgradeModalPlan.name} ({billingCycle === 'yearly' ? 'Annual Cycle' : 'Monthly Cycle'})</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Base Subscription Fee:</span>
                        <span>₹{basePrice.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>GST (18% Statutory ITC):</span>
                        <span>₹{gst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                        <span>Total Payable:</span>
                        <span className="text-[#006a61]">₹{total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Payment Mode Segmented Switcher */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPaymentMode('gateway')}
                        className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMode === 'gateway'
                            ? 'bg-white text-[#006a61] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CreditCard size={14} />
                        <span>Razorpay Gateway</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('upi')}
                        className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          paymentMode === 'upi'
                            ? 'bg-white text-[#006a61] shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <QrCode size={14} />
                        <span>Direct UPI & QR</span>
                      </button>
                    </div>

                    {/* Mode 1: Razorpay Payment Gateway */}
                    {paymentMode === 'gateway' && (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                            <Lock size={13} className="text-emerald-700" />
                            <span>Official Razorpay Payment Gateway</span>
                          </div>
                          <p className="text-[11px] text-emerald-700 leading-normal">
                            Supports all payment options: UPI (Google Pay, PhonePe, Paytm, BHIM, QR code), Debit/Credit Cards (RuPay, Visa, Mastercard), and NetBanking. Instant auto-activation.
                          </p>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setUpgradeModalPlan(null)}
                            className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleRazorpayPayment}
                            disabled={isProcessingUpgrade}
                            className="flex-2 py-2.5 bg-[#006a61] hover:bg-[#005a52] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            <Lock size={14} />
                            <span>{isProcessingUpgrade ? 'Connecting to Gateway...' : `Pay ₹${total.toLocaleString('en-IN')} via Razorpay`}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mode 2: Direct UPI & QR Code */}
                    {paymentMode === 'upi' && (() => {
                      const upiUri = `upi://pay?pa=billcom.payments@okaxis&pn=BillCom%20Technologies&am=${total}&cu=INR&tn=${encodeURIComponent(upgradeModalPlan.name + ' Plan Activation')}`;
                      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUri)}`;

                      return (
                        <div className="space-y-3">
                          {/* Live Dynamic UPI QR & Payee Details */}
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                              <img 
                                src={qrCodeUrl} 
                                alt="UPI QR Code" 
                                className="w-28 h-28 object-contain"
                              />
                            </div>
                            <div className="space-y-2 flex-1">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Official Merchant VPA</span>
                                <div className="flex items-center gap-2 mt-0.5 justify-center sm:justify-start">
                                  <code className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                                    billcom.payments@okaxis
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard('billcom.payments@okaxis')}
                                    className="p-1 text-[#006a61] hover:bg-teal-50 rounded transition-colors cursor-pointer"
                                    title="Copy UPI VPA"
                                  >
                                    {copiedUpi ? <CheckCheck size={16} className="text-emerald-600" /> : <Copy size={16} />}
                                  </button>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                Scan with any UPI app (GPay, PhonePe, Paytm, BHIM, Cred) to complete ₹{total.toLocaleString('en-IN')}.
                              </p>
                            </div>
                          </div>

                          {/* UTR / Reference ID input */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              UPI Transaction ID / 12-Digit UTR Number
                            </label>
                            <input
                              type="text"
                              value={upiUtrRef}
                              onChange={(e) => setUpiUtrRef(e.target.value)}
                              placeholder="e.g. 423589012345 or UPI Ref ID"
                              className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-xl focus:border-[#006a61] focus:ring-1 focus:ring-[#006a61] outline-none"
                            />
                            <span className="text-[10px] text-slate-400 font-medium">Found under transaction details in your UPI payment app</span>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setUpgradeModalPlan(null)}
                              className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleUpiPayment}
                              disabled={isProcessingUpgrade}
                              className="flex-2 py-2.5 bg-[#006a61] hover:bg-[#005a52] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 size={14} />
                              <span>{isProcessingUpgrade ? 'Verifying Activation...' : `Verify & Activate via UPI`}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
