import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Zap, 
  Sparkles,
  Building2,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import logoText from '../../assets/BillCom-text.svg';

import { API_BASE_URL, RAZORPAY_KEY_ID as DEFAULT_KEY_ID, MARKETING_URL } from '../../config/env';
import { loadRazorpayScript } from '../../services/razorpay.service';

export interface PlanItem {
  id: number;
  name: string;
  subtitle?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  maxBranches: number;
  maxStaff: number;
  isPopular?: boolean;
}

const FALLBACK_PLANS: PlanItem[] = [
  {
    id: 1,
    name: 'Starter Shop',
    subtitle: 'Ideal for Single Kirana, Small Cafes & Standalone Stores',
    monthlyPrice: 499,
    yearlyPrice: 4999,
    maxBranches: 1,
    maxStaff: 2,
    isPopular: false
  },
  {
    id: 2,
    name: 'Growth Plan',
    subtitle: 'Perfect for High-Volume Retailers, Salons & Restaurants',
    monthlyPrice: 1499,
    yearlyPrice: 14999,
    maxBranches: 5,
    maxStaff: 10,
    isPopular: true
  },
  {
    id: 3,
    name: 'Enterprise Plan',
    subtitle: 'Custom Architecture for Large Multi-City Franchises',
    monthlyPrice: 4999,
    yearlyPrice: 49999,
    maxBranches: -1,
    maxStaff: -1,
    isPopular: false
  }
];

export default function RegisterCheckoutView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  // Query Parameters
  const planParam = searchParams.get('plan');
  const cycleParam = searchParams.get('cycle');
  const directParam = searchParams.get('direct');
  const trialParam = searchParams.get('trial');

  // Plan & Billing Mode States
  const [planId, setPlanId] = useState<number>(() => {
    const parsed = parseInt(planParam || '2', 10);
    return isNaN(parsed) ? 2 : parsed;
  });
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(() => {
    return cycleParam === 'yearly' ? 'yearly' : 'monthly';
  });
  const [isTrialMode, setIsTrialMode] = useState<boolean>(() => {
    if (directParam === 'true') return false;
    if (trialParam === 'false') return false;
    return true; // Default to 7-day risk-free trial
  });

  const [step, setStep] = useState<number>(1); // 1: Form, 2: Verifying, 3: Success
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(4);

  // Dynamic Plans & Razorpay Key from Backend
  const [razorpayKey, setRazorpayKey] = useState<string>(DEFAULT_KEY_ID);
  const [dbPlans, setDbPlans] = useState<PlanItem[]>(FALLBACK_PLANS);

  // Retry storage for failed payment verification
  const [failedPaymentDetails, setFailedPaymentDetails] = useState<{
    token: string;
    subId: string;
    paymentId: string;
    signature: string;
    orderId?: string;
  } | null>(null);

  // Registration Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    legalName: '',
    businessPhone: '',
    businessType: 'Grocery / Kirana Store',
    gstScheme: 'Regular',
    gstIn: '',
    registeredState: 'Andhra Pradesh',
  });

  const [valErrors, setValErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState<boolean>(true);

  // Fetch Backend Razorpay Key & Subscription Plans
  useEffect(() => {
    const fetchConfigAndPlans = async () => {
      try {
        const [configRes, plansRes] = await Promise.all([
          fetch(`${API_BASE_URL}/registration/config`),
          fetch(`${API_BASE_URL}/registration/plans`)
        ]);

        if (configRes.ok) {
          const config = await configRes.json();
          if (config.keyId) setRazorpayKey(config.keyId);
        }

        if (plansRes.ok) {
          const plans = await plansRes.json();
          if (Array.isArray(plans) && plans.length > 0) {
            setDbPlans(plans);
          }
        }
      } catch (err) {
        console.warn('Using fallback configuration/plans:', err);
      }
    };

    fetchConfigAndPlans();
  }, []);

  // Sync state if query params change
  useEffect(() => {
    if (planParam) {
      const parsed = parseInt(planParam, 10);
      if (!isNaN(parsed)) setPlanId(parsed);
    }
    if (cycleParam) {
      setBillingCycle(cycleParam === 'yearly' ? 'yearly' : 'monthly');
    }
    if (directParam === 'true') {
      setIsTrialMode(false);
    } else if (trialParam === 'true') {
      setIsTrialMode(true);
    }
  }, [planParam, cycleParam, directParam, trialParam]);

  // Countdown timer on success step
  useEffect(() => {
    if (step === 3 && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (step === 3 && countdown === 0) {
      navigate('/dashboard', { replace: true });
    }
  }, [step, countdown, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (valErrors[name]) {
      setValErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim() || formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Alphanumeric and underscores only.';
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.legalName.trim()) {
      errors.legalName = 'Business legal name is required.';
    }

    if (!formData.businessPhone.trim() || !/^\+?[0-9\s-]{10,15}$/.test(formData.businessPhone)) {
      errors.businessPhone = 'Please enter a valid 10-digit phone number.';
    }

    if (!acceptTerms) {
      errors.acceptTerms = 'You must accept the terms and conditions.';
    }

    setValErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getSelectedPlan = (): PlanItem => {
    return dbPlans.find(p => p.id === planId) || dbPlans[1] || FALLBACK_PLANS[1];
  };

  // Helper to establish user session and state
  const establishUserSession = (data: any) => {
    const user = {
      username: data.username,
      email: data.email,
      role: data.role || 'Owner',
      businessId: Number(data.businessId),
      businessName: data.businessName || formData.legalName,
      token: data.token
    };

    localStorage.setItem('auth_data', JSON.stringify(user));
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('onboarding_pending', 'true');
    setCurrentUser(user);
    setStep(3);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    if (isTrialMode) {
      // ⚡ Instant 7-Day Free Trial Provisioning Flow
      try {
        const response = await fetch(`${API_BASE_URL}/registration/trial?planId=${planId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            planId: planId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to activate 7-day free trial.');
        }

        const data = await response.json();
        establishUserSession(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'An unexpected error occurred while setting up your trial.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 💳 Paid Razorpay Subscription Flow
    try {
      const response = await fetch(`${API_BASE_URL}/registration/start?planId=${planId}&billingCycle=${billingCycle}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate registration.');
      }

      const session = await response.json();
      await launchRazorpayCheckout(session);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const verifyPayment = async (token: string, subId: string, paymentId: string, signature: string, orderId?: string) => {
    setLoading(true);
    setStep(2);
    setErrorMessage('');
    setFailedPaymentDetails(null);

    try {
      const verifyResponse = await fetch(`${API_BASE_URL}/registration/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token,
          razorpaySubscriptionId: subId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          razorpayOrderId: orderId
        }),
      });

      if (!verifyResponse.ok) {
        const errJson = await verifyResponse.json();
        throw new Error(errJson.message || 'Payment signature verification failed.');
      }

      const data = await verifyResponse.json();
      establishUserSession(data);
    } catch (verifyErr: any) {
      setErrorMessage(verifyErr.message || 'Payment verification failed.');
      setFailedPaymentDetails({ token, subId, paymentId, signature, orderId });
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const launchRazorpayCheckout = async (session: {
    token: string;
    orderId?: string;
    subscriptionId?: string;
    keyId?: string;
    amount: number;
    amountInPaise?: number;
    currency?: string;
    planName?: string;
    merchantName?: string;
  }) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setErrorMessage('Failed to load Razorpay payment client. Please check your network connection.');
      setLoading(false);
      return;
    }

    const currentPlan = getSelectedPlan();
    const keyToUse = (session.keyId || razorpayKey || DEFAULT_KEY_ID || '').trim();
    const calculatedAmount = session.amountInPaise || Math.round(session.amount * 100);

    const options: any = {
      key: keyToUse,
      name: session.merchantName || 'BillCom POS',
      description: `${session.planName || currentPlan.name} Subscription (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
      image: 'https://billcom.app/assets/BillCom-B.png',
      order_id: session.orderId,
      amount: calculatedAmount,
      currency: session.currency || 'INR',
      handler: async (response: any) => {
        await verifyPayment(
          session.token,
          session.subscriptionId || '',
          response.razorpay_payment_id || '',
          response.razorpay_signature || '',
          response.razorpay_order_id || session.orderId
        );
      },
      prefill: {
        name: formData.legalName || formData.username || 'Store Owner',
        email: formData.email,
        contact: formData.businessPhone || '',
      },
      notes: {
        registration_token: session.token,
        plan_id: String(planId),
        plan_name: session.planName || currentPlan.name,
        billing_cycle: billingCycle,
        business_legal_name: formData.legalName,
        merchant_email: formData.email
      },
      theme: {
        color: '#006a61',
        backdrop_color: 'rgba(15, 23, 42, 0.65)'
      },
      modal: {
        confirm_close: true,
        backdropclose: false,
        escape: true,
        handleback: true,
        animation: true,
        ondismiss: async () => {
          setLoading(false);
          try {
            await fetch(`${API_BASE_URL}/registration/mark-failed`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: session.token,
                reason: 'Payment checkout window closed by user.'
              }),
            });
          } catch (e) {
            console.warn('Failed to notify backend of payment cancellation', e);
          }
          setErrorMessage('Payment window was closed. Your details have been preserved so you can resume whenever you are ready.');
        },
      },
      retry: {
        enabled: true,
        max_count: 3
      }
    };

    if (session.subscriptionId && !session.subscriptionId.startsWith('sub_simulated_') && !session.orderId) {
      options.subscription_id = session.subscriptionId;
    }

    const rzp = new (window as any).Razorpay(options);

    // Official Razorpay failure event handling
    rzp.on('payment.failed', async (failResponse: any) => {
      setLoading(false);
      const error = failResponse?.error || {};
      const failureDesc = error.description || error.reason || 'Payment could not be completed by your bank.';
      const errorCode = error.code ? `[${error.code}] ` : '';

      try {
        await fetch(`${API_BASE_URL}/registration/mark-failed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: session.token,
            reason: `Razorpay Error ${errorCode}${failureDesc} (Source: ${error.source || 'N/A'}, Step: ${error.step || 'N/A'})`
          }),
        });
      } catch (e) {
        console.warn('Failed to notify backend of payment failure telemetry', e);
      }

      setErrorMessage(`Payment Failed: ${failureDesc}. Please check your payment details or try an alternate payment method.`);
    });

    rzp.open();
  };

  const currentPlan = getSelectedPlan();
  const planBasePrice = billingCycle === 'yearly' ? (currentPlan.yearlyPrice || 14999) : currentPlan.monthlyPrice;
  const planGst = Math.round(planBasePrice * 0.18);
  const planTotal = planBasePrice + planGst;

  // ─── Step 2: Verification Loading Screen ───
  if (step === 2) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 shadow-2xl text-center space-y-5"
        >
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#006a61] border-t-transparent mx-auto"></div>
          <h3 className="font-display font-extrabold text-xl text-slate-800">Verifying Payment &amp; Provisioning</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Cryptographically validating transaction signature with Razorpay and provisioning your cloud business workspace. Please wait...
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Step 3: Success Confirmation Screen ───
  if (step === 3) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-50 text-[#006a61] rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
            <Sparkles size={32} className="text-[#006a61]" />
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-black text-2xl text-slate-900">
              {isTrialMode ? '⚡ 7-Day Free Trial Activated!' : 'Subscription Successfully Configured!'}
            </h3>
            <p className="text-xs text-slate-600 font-semibold max-w-sm mx-auto">
              {isTrialMode
                ? `Welcome to BillCom POS! Your business is now live on the ${currentPlan.name} 7-day risk-free trial.`
                : `Your subscription to the ${currentPlan.name} is now fully active with verified Razorpay payment.`}
            </p>
          </div>

          <div className="p-4 bg-[#f0fdf4] rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium space-y-2 text-left">
            <p className="font-bold flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 size={16} className="text-[#006a61]" /> Store Node Provisioned Successfully
            </p>
            <p className="text-[11px] text-emerald-700">
              Store: <span className="font-bold text-slate-900">{formData.legalName || 'Your Store'}</span> • Role: <span className="font-bold text-slate-900">Owner</span>
            </p>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-emerald-100">
              Redirecting you directly to the POS Dashboard in <span className="font-mono font-bold text-[#006a61] text-sm">{countdown}</span> seconds...
            </p>
          </div>

          <button 
            onClick={() => navigate('/dashboard', { replace: true })}
            className="w-full py-3.5 bg-[#006a61] hover:bg-[#004d47] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#006a61]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Enter POS Workspace Now</span>
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Step 1: Main Dedicated Checkout Screen ───
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1a1c1e] py-8 px-4 font-sans select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation Topbar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <a 
            href={MARKETING_URL}
            title="BillCom Home" 
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img 
              src={logoText} 
              alt="BillCom GST Billing Software" 
              className="h-8 md:h-9 w-auto object-contain" 
            />
          </a>
          
          <div className="flex items-center gap-4 text-xs font-bold">
            <a 
              href={`${MARKETING_URL}/pricing`}
              className="text-slate-500 hover:text-slate-800 transition-colors hidden sm:inline"
            >
              ← View All Plans &amp; Pricing
            </a>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <Link 
              to="/login"
              className="text-[#006a61] hover:text-[#004d47] transition-colors flex items-center gap-1"
            >
              <User size={13} />
              <span>Already registered? Sign In</span>
            </Link>
          </div>
        </div>

        {/* Checkout Header & Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs font-bold uppercase tracking-wider font-mono mb-2">
              <Zap size={12} className="text-amber-600 fill-amber-500" />
              <span>{isTrialMode ? '⚡ 7-Day Risk-Free Trial' : '💳 Direct Paid Subscription'}</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
              {isTrialMode ? 'Start Your 7-Day Free Trial' : 'Complete Your Subscription Setup'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-0.5">
              Instant cloud workspace activation. Launch your POS billing counter in 60 seconds.
            </p>
          </div>

          {/* Mode Switcher Toggle */}
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center border border-slate-300/60 shadow-inner shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsTrialMode(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isTrialMode
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7-Day Free Trial (₹0)
            </button>
            <button
              type="button"
              onClick={() => setIsTrialMode(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isTrialMode
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid Subscription
            </button>
          </div>
        </div>

        {/* Two-Column Dedicated Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-2">
          
          {/* Left 2 Cols: Form Fields */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-[#006a61]" />
                <span>Store &amp; Account Information</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast 60-Sec Onboarding</span>
            </div>

            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex flex-col gap-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                {failedPaymentDetails && (
                  <button
                    onClick={() => verifyPayment(
                      failedPaymentDetails.token, 
                      failedPaymentDetails.subId, 
                      failedPaymentDetails.paymentId, 
                      failedPaymentDetails.signature,
                      failedPaymentDetails.orderId
                    )}
                    className="mt-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1.5 w-fit cursor-pointer"
                  >
                    <RefreshCw size={12} /> Retry Verification
                  </button>
                )}
              </motion.div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5 text-left">
              
              {/* Account Credentials */}
              <div className="space-y-3">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  1. Login Credentials (Store Owner)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Username</label>
                    <input 
                      type="text" 
                      name="username"
                      required
                      placeholder="e.g. janesmith"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                        valErrors.username ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-[#006a61]'
                      }`}
                    />
                    {valErrors.username && <p className="text-[10px] text-rose-500 font-semibold">{valErrors.username}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Personal Email</label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      placeholder="e.g. jane@company.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                        valErrors.email ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-[#006a61]'
                      }`}
                    />
                    {valErrors.email && <p className="text-[10px] text-rose-500 font-semibold">{valErrors.email}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                  <input 
                    type="password" 
                    name="password"
                    required
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                      valErrors.password ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-[#006a61]'
                    }`}
                  />
                  {valErrors.password && <p className="text-[10px] text-rose-500 font-semibold">{valErrors.password}</p>}
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  2. Store &amp; Business Profile
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Business / Shop Name</label>
                    <input 
                      type="text" 
                      name="legalName"
                      required
                      placeholder="e.g. Sri Lakshmi Supermarket"
                      value={formData.legalName}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                        valErrors.legalName ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-[#006a61]'
                      }`}
                    />
                    {valErrors.legalName && <p className="text-[10px] text-rose-500 font-semibold">{valErrors.legalName}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store Phone Number</label>
                    <input 
                      type="text" 
                      name="businessPhone"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.businessPhone}
                      onChange={handleInputChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold bg-slate-50 focus:bg-white focus:outline-none transition-all ${
                        valErrors.businessPhone ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-[#006a61]'
                      }`}
                    />
                    {valErrors.businessPhone && <p className="text-[10px] text-rose-500 font-semibold">{valErrors.businessPhone}</p>}
                  </div>
                </div>

                {/* Industry Presets */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Select Your Store Type (Configures POS Layout)
                  </label>
                  
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:border-[#006a61] focus:outline-none shadow-xs"
                  >
                    <option value="Grocery / Kirana Store">🛒 Grocery / Kirana Store</option>
                    <option value="Restaurant">🍛 Restaurant / Hotel</option>
                    <option value="Tiffin Center / Mess">🍲 Tiffin Center / Mess</option>
                    <option value="Bakery & Confectionery">🥐 Bakery &amp; Confectionery</option>
                    <option value="Clothing / Garments Store">👕 Clothing / Garments Store</option>
                    <option value="Pharmacy / Medical Store">💊 Pharmacy / Medical Store</option>
                    <option value="Electronics & Mobile Store">📱 Electronics &amp; Mobile Store</option>
                    <option value="Salon / Barber / Beauty Parlour">💇 Salon / Barber / Beauty Parlour</option>
                    <option value="Repair & Maintenance Services">🔧 Repair &amp; Maintenance Services</option>
                    <option value="Software / IT Services">💻 Software / IT Services</option>
                    <option value="General Retail Store">🏪 General Retail Store</option>
                  </select>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: 'Kirana', val: 'Grocery / Kirana Store' },
                      { label: 'Restaurant', val: 'Restaurant' },
                      { label: 'Mess / Tiffin', val: 'Tiffin Center / Mess' },
                      { label: 'Salon', val: 'Salon / Barber / Beauty Parlour' },
                      { label: 'Pharmacy', val: 'Pharmacy / Medical Store' },
                      { label: 'Electronics', val: 'Electronics & Mobile Store' }
                    ].map(chip => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, businessType: chip.val }))}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                          formData.businessType === chip.val
                            ? 'bg-[#006a61] text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GST Details */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Are you registered for GST?</label>
                      <p className="text-[10px] text-slate-500 font-medium">Enables auto-calculation of CGST/SGST on sales</p>
                    </div>
                    <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gstScheme: 'Regular' }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          formData.gstScheme !== 'None' ? 'bg-white text-[#006a61] shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, gstScheme: 'None', gstIn: '' }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          formData.gstScheme === 'None' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {formData.gstScheme !== 'None' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GSTIN (Optional)</label>
                        <input
                          type="text"
                          name="gstIn"
                          placeholder="e.g. 36AAAAA0000A1Z5"
                          value={formData.gstIn}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#006a61] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered State</label>
                        <select
                          name="registeredState"
                          value={formData.registeredState}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#006a61] outline-none"
                        >
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Telangana">Telangana</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Other State">Other State</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms & Privacy */}
              <div className="pt-2">
                <div className="flex items-start gap-2.5">
                  <input 
                    type="checkbox"
                    id="acceptTerms"
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (e.target.checked && valErrors.acceptTerms) {
                        setValErrors(prev => {
                          const copy = { ...prev };
                          delete copy.acceptTerms;
                          return copy;
                        });
                      }
                    }}
                    className="w-4 h-4 mt-0.5 text-[#006a61] border-slate-300 rounded focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="acceptTerms" className="text-[11px] text-slate-500 font-semibold cursor-pointer select-none">
                    I agree to the BillCom Terms of Service and Privacy Policy.
                  </label>
                </div>
                {valErrors.acceptTerms && <p className="text-[10px] text-rose-500 font-semibold mt-1">{valErrors.acceptTerms}</p>}
              </div>

              {/* Submit Primary CTA */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#006a61] hover:bg-[#004d47] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-[#006a61]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Setting Up Cloud Node...</span>
                ) : isTrialMode ? (
                  <>
                    <Zap size={16} />
                    <span>Launch 7-Day Free Trial Now (₹0 Due Today)</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>Pay ₹{planTotal.toLocaleString('en-IN')} via Razorpay</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right 1 Col: Sticky Order Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6 text-left sticky top-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                <ShoppingBag size={18} className="text-[#006a61]" /> 
                <span>Order Summary</span>
              </h3>
              <a 
                href={`${MARKETING_URL}/pricing`}
                className="text-[11px] font-extrabold text-[#006a61] hover:underline"
              >
                Change plan
              </a>
            </div>

            {/* Selected Plan Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-lg text-slate-900">{currentPlan.name}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#006a61]/10 text-[#006a61]">
                  {billingCycle === 'yearly' ? 'Annual' : 'Monthly'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">{currentPlan.subtitle}</p>
              <div className="pt-2 border-t border-slate-200/60 text-xs font-bold text-slate-700 flex justify-between">
                <span>Branch Limit:</span>
                <span className="text-[#006a61]">
                  {currentPlan.maxBranches === -1 ? 'Unlimited' : `${currentPlan.maxBranches} Outlets`}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-700 flex justify-between">
                <span>Staff Profiles:</span>
                <span className="text-[#006a61]">
                  {currentPlan.maxStaff === -1 ? 'Unlimited' : `${currentPlan.maxStaff} Users`}
                </span>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="space-y-2.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Base Subscription:</span>
                <span className="font-mono text-slate-900 font-bold">
                  ₹{Number(planBasePrice).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span className="font-mono text-slate-900 font-bold">
                  ₹{Number(planGst).toLocaleString('en-IN')}
                </span>
              </div>
              
              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Due Today:</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {isTrialMode ? '₹0.00 (FREE)' : `₹${Number(planTotal).toLocaleString('en-IN')}`}
                </span>
              </div>

              {isTrialMode && (
                <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
                  ⚡ 7 Days Full Access Included. No charge today. Cancel or upgrade anytime.
                </p>
              )}
            </div>

            {/* Perks Checklist */}
            <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/60 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Sparkles size={14} className="text-amber-600 fill-amber-500" />
                <span>What's Included:</span>
              </div>
              <ul className="text-[11px] text-amber-900/90 space-y-1.5 font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Full access to POS, Inventory &amp; CRM</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Instant multi-tenant cloud workspace</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  <span>Thermal barcode &amp; WhatsApp billing</span>
                </li>
              </ul>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-[10px] font-bold text-slate-400">
              <div className="flex items-center gap-2 justify-center">
                <ShieldCheck size={14} className="text-emerald-600" /> 
                <span>256-Bit SSL Bank Grade Security</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CreditCard size={14} className="text-emerald-600" /> 
                <span>Razorpay Standard Checkout Partner</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
