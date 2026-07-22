import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Building2, 
  Phone, 
  MapPin, 
  UserCheck, 
  Hash, 
  Globe, 
  Percent, 
  Check, 
  HelpCircle 
} from 'lucide-react';
import { User } from '../../../types';
import { authService } from '../../../services/auth.service';
import { apiClient } from '../../../services/api.client';
import logo from '../../../assets/BillCom-full.svg';

const MARKETING_URL = (import.meta as any).env?.VITE_MARKETING_URL || 'http://localhost:5173';

interface AuthViewProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginMode = true;
  
  // Login / Common credentials
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');

  // Password Reset states
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  
  // Staff login states
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const [businessIdInput, setBusinessIdInput] = useState<string>('');
  
  // Register step 1: Account setup
  const [email, setEmail] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  // Register step 2: Business Branding
  const [legalName, setLegalName] = useState<string>('');
  const [tradingName, setTradingName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [website, setWebsite] = useState<string>('');

  // Register step 3: Business Contact
  const [businessPhone, setBusinessPhone] = useState<string>('');
  const [businessEmail, setBusinessEmail] = useState<string>('');
  const [gstIn, setGstIn] = useState<string>('');

  // Register step 4: Location & Tax Config
  const [businessAddress, setBusinessAddress] = useState<string>('');
  const [businessCity, setBusinessCity] = useState<string>('');
  const [businessState, setBusinessState] = useState<string>('');
  const [businessPostalCode, setBusinessPostalCode] = useState<string>('');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(18.00);
  const [pricesIncludeTax, setPricesIncludeTax] = useState<boolean>(true);

  // Wizard active step
  const [step, setStep] = useState<number>(1);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  React.useEffect(() => {
    const hashParts = window.location.hash.split('?');
    const searchString = hashParts.length > 1 ? hashParts[1] : window.location.search;
    const params = new URLSearchParams(searchString);
    if (params.get('expired') === 'true') {
      setErrorText('Your store subscription has expired or payment was cancelled. Please complete payment to resume access.');
    }
  }, [location]);

  const validateStep = (currentStep: number): boolean => {
    setErrorText('');
    
    if (currentStep === 1) {
      if (!username.trim()) {
        setErrorText('Username is required.');
        return false;
      }
      if (username.trim().length < 3) {
        setErrorText('Username must be at least 3 characters.');
        return false;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorText('Please enter a valid email address.');
        return false;
      }
      if (!password || password.length < 6) {
        setErrorText('Password must be at least 6 characters.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!legalName.trim()) {
        setErrorText('Business Legal Name is required.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!businessPhone.trim()) {
        setErrorText('Business Phone Number is required.');
        return false;
      }
    } else if (currentStep === 4) {
      if (!businessAddress.trim()) {
        setErrorText('Street Address is required.');
        return false;
      }
      if (!businessCity.trim()) {
        setErrorText('City is required.');
        return false;
      }
      if (!businessState.trim()) {
        setErrorText('State is required.');
        return false;
      }
      if (!businessPostalCode.trim()) {
        setErrorText('PIN / Postal Code is required.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = async () => {
    if (!validateStep(step)) return;

    if (step === 1) {
      setIsLoading(true);
      setErrorText('');
      try {
        const usernameCheck = await apiClient.get<boolean>(`/auth/check-username?username=${encodeURIComponent(username.trim())}`);
        if (usernameCheck.data === true) {
          setErrorText('Username is already taken.');
          setIsLoading(false);
          return;
        }
        const emailCheck = await apiClient.get<boolean>(`/auth/check-email?email=${encodeURIComponent(email.trim())}`);
        if (emailCheck.data === true) {
          setErrorText('Email is already registered.');
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        setErrorText('Failed to verify username/email availability.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorText('');
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (authMode === 'forgot') {
      setIsLoading(true);
      try {
        const res = await authService.forgotPassword(loginEmail);
        alert(`Verification reset code sent to email! (For testing, the code is: ${res.code})`);
        setAuthMode('reset');
      } catch (err: any) {
        setErrorText(err.response?.data || err.message || 'Failed to request reset code.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (authMode === 'reset') {
      setIsLoading(true);
      try {
        await authService.resetPassword({
          email: loginEmail,
          token: resetCode,
          newPassword
        });
        alert('Password has been reset successfully! You can now log in.');
        setAuthMode('login');
        setResetCode('');
        setNewPassword('');
      } catch (err: any) {
        setErrorText(err.response?.data || err.message || 'Failed to reset password.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!isLoginMode && step < 4) {
      await handleNextStep();
      return;
    }

    if (!isLoginMode && !validateStep(4)) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLoginMode) {
        const bId = isStaff && businessIdInput ? parseInt(businessIdInput) : undefined;
        const user = await authService.login(loginEmail, password, bId);
        if (user.onboardingPending) {
          localStorage.setItem('onboarding_pending', 'true');
        } else {
          localStorage.removeItem('onboarding_pending');
        }
        onLoginSuccess(user);
        navigate('/dashboard', { replace: true });
      } else {
        const user = await authService.register({
          username,
          email,
          password,
          role: 'Owner',
          legalName,
          tradingName: tradingName || legalName,
          businessPhone,
          businessAddress,
          businessCity,
          businessState,
          businessPostalCode,
          businessCountry: 'India',
          gstIn,
          logoUrl: (logoUrl || '').trim() || undefined,
          website: (website || '').trim() || undefined,
          businessEmail: (businessEmail || '').trim() || email,
          defaultTaxRate: Number(defaultTaxRate),
          pricesIncludeTax
        });

        // Set the user avatarUrl state locally to show either the uploaded avatarUrl or fallback to business logo
        const userWithAvatar = {
          ...user,
          avatarUrl: (avatarUrl || '').trim() || (logoUrl || '').trim() || undefined
        };
        if (user.onboardingPending) {
          localStorage.setItem('onboarding_pending', 'true');
        } else {
          localStorage.removeItem('onboarding_pending');
        }
        onLoginSuccess(userWithAvatar);
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const errMsg = err.response?.data || err.message || 'Authentication failed.';
      setErrorText(typeof errMsg === 'object' ? JSON.stringify(errMsg) : errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-terminal-root" className="w-full max-w-lg mx-auto">
      {/* Main Branding Logo */}
      <div className="text-center mb-6">
        <img src={logo} alt="SmartBill Pro" className="w-56 mx-auto mb-2 object-contain" />
        <p className="font-sans text-[10px] text-[#7c839b] font-semibold uppercase tracking-wider">Multi-Tenant Billing Solution</p>
      </div>

      {/* Form panel Card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-md p-6 relative overflow-hidden transition-all duration-300">
        
        {/* Dynamic header label instead of registration tab switcher */}
        <div className="border-b border-[#e2e8f0] pb-3 mb-6">
          <h2 className="text-xs font-bold text-[#006a61] uppercase tracking-wider text-center">
            Sign In to your workspace
          </h2>
        </div>

        {/* Wizard Progress Stepper (Only in Signup Mode) */}
        {!isLoginMode && (
          <div className="mb-8">
            {/* Mobile-only Step Description */}
            <div className="sm:hidden text-center mb-4 bg-[#eff4ff]/60 py-1.5 px-3 rounded-lg border border-[#eff4ff] w-full">
              <span className="text-[10px] font-bold text-[#006a61] uppercase tracking-wider">
                Step {step} of 4 · {['Account Details', 'Business Branding', 'Contact Channels', 'Location & Tax'][step - 1]}
              </span>
            </div>

            <div className="flex justify-between items-center relative">
              {/* Connector Line Background */}
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#eff4ff] z-0">
                <div 
                  className="h-full bg-[#006a61] transition-all duration-300 rounded"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>
              </div>

              {[
                { label: 'Account', icon: UserCheck },
                { label: 'Branding', icon: Globe },
                { icon: Phone, label: 'Contact' },
                { icon: MapPin, label: 'Tax & Location' }
              ].map((s, idx) => {
                const stepNum = idx + 1;
                const Icon = s.icon;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;

                return (
                  <div key={stepNum} className="flex flex-col items-center z-10 relative">
                    <button
                      type="button"
                      disabled={stepNum > step}
                      onClick={() => {
                        if (stepNum < step || validateStep(step)) {
                          setStep(stepNum);
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs font-bold border-2 transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? 'bg-[#006a61] border-[#006a61] text-white shadow-sm ring-4 ring-[#006a61]/15 scale-110' 
                          : isCompleted 
                          ? 'bg-[#eff4ff] border-[#006a61] text-[#006a61]' 
                          : 'bg-white border-[#c6c6cd] text-[#7c839b]'
                      }`}
                    >
                      {isCompleted ? <Check size={14} className="stroke-[3]" /> : stepNum}
                    </button>
                    <span 
                      className={`hidden sm:block font-sans text-[8.5px] font-bold uppercase tracking-wider mt-2 transition-colors ${
                        isActive ? 'text-[#0b1c30]' : 'text-[#7c839b]'
                      }`}
                    >
                      {s.label.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {authMode === 'forgot' ? (
              /* FORGOT PASSWORD FIELDS */
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border-b border-[#f1f5f9] pb-2 mb-1">
                  <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wide">Request Password Reset</h3>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            ) : authMode === 'reset' ? (
              /* RESET PASSWORD FIELDS */
              <motion.div
                key="reset"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border-b border-[#f1f5f9] pb-2 mb-1">
                  <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wide">Enter Reset Code &amp; New Password</h3>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">6-Digit Code</label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                    <input 
                      type="text" 
                      placeholder="Enter 6-digit code"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">New Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                    <input 
                      type="password" 
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            ) : isLoginMode ? (
              /* LOGIN FIELDS */
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Segmented Controller to Differentiate Login Type */}
                <div className="flex bg-[#eff4ff] p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setIsStaff(false); setErrorText(''); }}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${!isStaff ? 'bg-[#006a61] text-white shadow-sm' : 'text-[#45464d] hover:text-[#0b1c30]'}`}
                  >
                    Owner Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsStaff(true); setErrorText(''); }}
                    className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${isStaff ? 'bg-[#006a61] text-white shadow-sm' : 'text-[#45464d] hover:text-[#0b1c30]'}`}
                  >
                    Staff Account
                  </button>
                </div>
 
                {isStaff && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-1"
                  >
                    <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Business ID</label>
                    <div className="relative">
                      <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                      <input 
                        type="text" 
                        placeholder="Enter your Business ID (e.g. 1)"
                        value={businessIdInput}
                        onChange={(e) => setBusinessIdInput(e.target.value)}
                        className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] focus:ring-2 focus:ring-[#006a61]/10 outline-none transition-all"
                        required={isStaff}
                      />
                    </div>
                  </motion.div>
                )}
 
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">
                    {isStaff ? 'Login Email Address' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                    <input 
                      type="email" 
                      placeholder={isStaff ? 'staff@smartbill.com' : 'john@example.com'}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] focus:ring-2 focus:ring-[#006a61]/10 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
 
                <div>
                  <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                    <input 
                      type="password" 
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] focus:ring-2 focus:ring-[#006a61]/10 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => { setAuthMode('forgot'); setErrorText(''); }}
                      className="text-xs text-[#006a61] hover:underline font-bold transition-all cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* SIGNUP WIZARD STEPS */
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {step === 1 && (
                  /* STEP 1: ACCOUNT CREDENTIALS */
                  <div className="space-y-4">
                    <div className="border-b border-[#f1f5f9] pb-2 mb-1">
                      <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wide">Step 1: Owner Security Context</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Owner Username</label>
                        <input 
                          type="text" 
                          placeholder="e.g. john_doe"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Owner Personal Email</label>
                        <input 
                          type="email" 
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Security Password</label>
                      <input 
                        type="password" 
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        required
                      />
                    </div>

                  </div>
                )}

                {step === 2 && (
                  /* STEP 2: BUSINESS BRANDING */
                  <div className="space-y-4">
                    <div className="border-b border-[#f1f5f9] pb-2 mb-1">
                      <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wide">Step 2: Business Branding</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Business Legal Name</label>
                        <input 
                          type="text" 
                          placeholder="Acme Enterprises Ltd" 
                          value={legalName}
                          onChange={(e) => setLegalName(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Brand/Trading Name</label>
                        <input 
                          type="text" 
                          placeholder="Acme Salon (Optional)" 
                          value={tradingName}
                          onChange={(e) => setTradingName(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Website URL (Optional)</label>
                        <div className="relative">
                          <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                          <input 
                            type="url" 
                            placeholder="https://www.acmesalon.com" 
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo preview widget */}
                    <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#eff4ff] space-y-3">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5">
                        {logoUrl && logoUrl.trim() ? (
                          <img 
                            src={logoUrl} 
                            alt="Logo Preview" 
                            className="w-11 h-11 rounded-lg border border-[#c6c6cd] object-cover bg-white shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg border border-dashed border-[#c6c6cd] bg-white text-[#7c839b] flex items-center justify-center shadow-sm shrink-0">
                            <Building2 size={20} className="opacity-40" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="text-[10.5px] font-bold text-[#0b1c30] uppercase leading-none">Corporate Logo</h4>
                          <p className="text-[9.5px] text-[#7c839b] font-medium leading-snug mt-1">
                            Upload your brand logo or paste an image URL.
                          </p>
                          <div className="mt-2 flex gap-2 justify-center sm:justify-start">
                            <label className="bg-[#006a61] hover:bg-opacity-90 text-white text-[10px] font-bold px-2.5 py-1.5 rounded cursor-pointer transition-all">
                              Upload Logo
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      const response = await apiClient.post('/upload', formData, {
                                        headers: {
                                          'Content-Type': 'multipart/form-data',
                                        },
                                      });
                                      setLogoUrl(response.data.url);
                                      alert("Logo uploaded successfully!");
                                    } catch (err: any) {
                                      alert("Failed to upload logo: " + (err.response?.data || err.message));
                                    }
                                  }
                                }}
                              />
                            </label>
                            {logoUrl && (
                              <button
                                type="button"
                                onClick={() => setLogoUrl('')}
                                className="border border-[#c6c6cd] bg-white text-red-600 text-[10px] font-semibold px-2.5 py-1.5 rounded hover:bg-red-50 transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-[9.5px] font-bold text-[#7c839b] uppercase block mb-1">Or Paste Business Logo Image URL (Optional)</label>
                        <input 
                          type="url" 
                          placeholder="https://acme.com/assets/logo.png" 
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  /* STEP 3: BUSINESS CONTACT */
                  <div className="space-y-4">
                    <div className="border-b border-[#f1f5f9] pb-2 mb-1">
                      <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wide">Step 3: Contact Channels</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Business Phone Number</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                          <input 
                            type="text" 
                            placeholder="+91 99887 76655" 
                            value={businessPhone}
                            onChange={(e) => setBusinessPhone(e.target.value)}
                            className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Business Email (Optional)</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                          <input 
                            type="email" 
                            placeholder="support@acmesalon.com" 
                            value={businessEmail}
                            onChange={(e) => setBusinessEmail(e.target.value)}
                            className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">GSTIN Tax Registration Code</label>
                      <div className="relative">
                        <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
                        <input 
                          type="text" 
                          placeholder="36AAAAA1111A1Z1 (Optional)" 
                          value={gstIn}
                          onChange={(e) => setGstIn(e.target.value)}
                          className="w-full text-xs font-semibold pl-9 pr-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        />
                      </div>
                      <p className="text-[9.5px] text-[#7c839b] font-medium leading-normal mt-1">
                        If you have regional GST registry parameters, specifying them here binds it automatically to regional bills.
                      </p>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  /* STEP 4: TAX & LOCATION CONFIG */
                  <div className="space-y-4">
                    <div className="border-b border-[#f1f5f9] pb-2 mb-1">
                      <h3 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wide">Step 4: Location &amp; Tax Parameters</h3>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Headquarters Street Address</label>
                      <input 
                        type="text" 
                        placeholder="Suite 101, Business Park" 
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">City</label>
                        <input 
                          type="text" 
                          placeholder="Hyderabad" 
                          value={businessCity}
                          onChange={(e) => setBusinessCity(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">State</label>
                        <input 
                          type="text" 
                          placeholder="Telangana" 
                          value={businessState}
                          onChange={(e) => setBusinessState(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">PIN Code</label>
                        <input 
                          type="text" 
                          placeholder="500001" 
                          value={businessPostalCode}
                          onChange={(e) => setBusinessPostalCode(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="border-t border-[#f1f5f9] pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Default Tax Contribution</label>
                        <select 
                          value={defaultTaxRate}
                          onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                          className="w-full text-xs font-semibold px-2 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none h-9"
                        >
                          <option value="18.0">18.0% Standard GST Rule</option>
                          <option value="5.0">5.0% Beauty &amp; Food Services</option>
                          <option value="0.0">0.0% Tax Exempt Rule</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input 
                          type="checkbox" 
                          id="pricesIncludeTaxOnboarding"
                          checked={pricesIncludeTax}
                          onChange={(e) => setPricesIncludeTax(e.target.checked)}
                          className="w-4 h-4 text-[#006a61] border border-[#c6c6cd] rounded focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="pricesIncludeTaxOnboarding" className="text-[11px] font-semibold text-[#0b1c30] select-none cursor-pointer">
                          Catalog prices include GST contributions
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {errorText && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#ba1a1a]/5 border border-[#ba1a1a]/15 p-3 rounded-lg"
            >
              <p className="text-[10.5px] font-bold text-[#ba1a1a] leading-tight text-center">
                {errorText}
              </p>
            </motion.div>
          )}

          {/* CONTROL NAVIGATION BUTTONS WRAPPER */}
          <div className="space-y-3.5 pt-2">
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              {authMode !== 'login' ? (
                <button 
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorText(''); }}
                  className="px-4 py-2.5 border border-[#c6c6cd] text-[#45464d] font-display text-xs font-bold rounded-lg hover:bg-[#f8f9ff] active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back to Login</span>
                </button>
              ) : (!isLoginMode && step > 1) ? (
                <button 
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 border border-[#c6c6cd] text-[#45464d] font-display text-xs font-bold rounded-lg hover:bg-[#f8f9ff] active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              ) : null}

              <button 
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-[#006a61] text-white font-display text-xs font-bold rounded-lg hover:bg-opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#006a61]/10 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    <span>Processing...</span>
                  </>
                ) : authMode === 'forgot' ? (
                  <>
                    <span>Request Reset Code</span>
                    <ArrowRight size={13} />
                  </>
                ) : authMode === 'reset' ? (
                  <>
                    <span>Confirm Password Reset</span>
                    <ArrowRight size={13} />
                  </>
                ) : isLoginMode ? (
                  <>
                    <span>Sign In To Workspace</span>
                    <ArrowRight size={13} />
                  </>
                ) : step < 4 ? (
                  <>
                    <span>Continue Step {step + 1}</span>
                    <ArrowRight size={13} />
                  </>
                ) : (
                  <>
                    <span>Complete Setup &amp; Launch</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>

            {authMode === 'login' && (
              <div className="text-center pt-2.5 border-t border-[#f1f5f9] w-full">
                <span className="text-[11px] text-slate-400 font-semibold">New to SmartBill Pro? </span>
                <a 
                  href={`${MARKETING_URL}/#/pricing`}
                  className="text-[11px] text-[#006a61] hover:underline font-bold transition-all"
                >
                  Create an Account
                </a>
              </div>
            )}
          </div>
        </form>


      </div>

      {/* Footer legalities with Terms & Privacy policy */}
      <div className="text-center mt-6 space-y-1.5">
        <p className="font-sans text-[10px] text-[#7c839b] font-bold uppercase tracking-wider">
          Protected Workspace · Multi-Tenant Gateway
        </p>
        <div className="flex justify-center gap-3 text-[10px] font-bold text-[#006a61]">
          <a href={`${MARKETING_URL}/#/terms`} target="_blank" rel="noopener noreferrer" className="hover:underline">
            Terms of Service
          </a>
          <span className="text-slate-300 select-none">•</span>
          <a href={`${MARKETING_URL}/#/privacy`} target="_blank" rel="noopener noreferrer" className="hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
