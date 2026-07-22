import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Globe, Phone, MapPin, Building2, ArrowRight, ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { businessService } from '../../services/business.service';
import logo from '../../assets/BillCom-full.svg';
import { apiClient } from '../../services/api.client';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');

  // Business profile data matching business DTO structure
  const [profileData, setProfileData] = useState({
    id: 0,
    legalName: '',
    tradingName: '',
    logoUrl: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    phone: '',
    email: '',
    website: '',
    gstIn: '',
    defaultTaxRate: 18.00,
    pricesIncludeTax: true,
  });

  useEffect(() => {
    // Load pre-filled basic registration data (like Legal Name and Phone) from the database
    const loadProfile = async () => {
      try {
        const data = await businessService.getProfile();
        setProfileData(prev => ({
          ...prev,
          ...data,
          tradingName: data.tradingName || data.legalName || '',
          email: data.email || '',
        }));
      } catch (err: any) {
        console.error('Failed to load pre-filled profile details:', err);
      }
    };
    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as any).checked : value;
    setProfileData(prev => ({ ...prev, [name]: val }));
  };

  const validateStep = (currentStep: number): boolean => {
    setErrorText('');
    
    if (currentStep === 1) {
      if (!profileData.tradingName.trim()) {
        setErrorText('Brand/Trading Name is required.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!profileData.phone.trim()) {
        setErrorText('Contact phone number is required.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!profileData.address.trim()) {
        setErrorText('Street address is required.');
        return false;
      }
      if (!profileData.city.trim()) {
        setErrorText('City is required.');
        return false;
      }
      if (!profileData.state.trim()) {
        setErrorText('State is required.');
        return false;
      }
      if (!profileData.postalCode.trim()) {
        setErrorText('PIN / Postal Code is required.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorText('');
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (step < 3) {
      handleNextStep();
      return;
    }

    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      // Complete profile update
      await businessService.updateProfile({
        ...profileData,
        defaultTaxRate: Number(profileData.defaultTaxRate),
      });

      // Clear the onboarding pending check to grant dashboard access
      localStorage.removeItem('onboarding_pending');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setErrorText(err.response?.data || err.message || 'Failed to complete profile onboarding.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.removeItem('onboarding_pending');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-6">
      {/* Brand logo header */}
      <div className="text-center mb-6">
        <img src={logo} alt="SmartBill Pro" className="w-56 mx-auto mb-2 object-contain" />
        <p className="font-sans text-[10px] text-[#7c839b] font-semibold uppercase tracking-wider">Configure Workspace Settings</p>
      </div>

      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-md p-6 relative overflow-hidden">
        <div className="text-center mb-6 space-y-1">
          <h3 className="font-semibold text-lg text-slate-900">Welcome to SmartBill Pro!</h3>
          <p className="text-xs text-slate-400 font-medium">Let's finish setting up your business account details.</p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#eff4ff] z-0">
              <div 
                className="h-full bg-[#006a61] transition-all duration-300 rounded"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              ></div>
            </div>

            {[
              { label: 'Branding', icon: Globe },
              { icon: Phone, label: 'Contact Details' },
              { icon: MapPin, label: 'Tax & Location' }
            ].map((s, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;

              return (
                <div key={stepNum} className="flex flex-col items-center z-10 relative">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-xs font-bold border-2 transition-all duration-300 ${
                      isActive 
                        ? 'bg-[#006a61] border-[#006a61] text-white shadow-sm ring-4 ring-[#006a61]/15 scale-110' 
                        : isCompleted 
                        ? 'bg-[#eff4ff] border-[#006a61] text-[#006a61]' 
                        : 'bg-white border-[#c6c6cd] text-[#7c839b]'
                    }`}
                  >
                    {isCompleted ? <Check size={14} className="stroke-[3]" /> : stepNum}
                  </div>
                  <span 
                    className={`hidden sm:block font-sans text-[8.5px] font-bold uppercase tracking-wider mt-2 transition-colors ${
                      isActive ? 'text-[#0b1c30]' : 'text-[#7c839b]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 text-left"
            >
              {step === 1 && (
                /* STEP 1: BUSINESS BRANDING */
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Step 1: Business Branding</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Legal Entity Name</label>
                      <input 
                        type="text" 
                        disabled
                        value={profileData.legalName}
                        className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Brand / Trading Name</label>
                      <input 
                        type="text" 
                        name="tradingName"
                        placeholder="e.g. Acme Salon" 
                        value={profileData.tradingName}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Website URL (Optional)</label>
                    <input 
                      type="url" 
                      name="website"
                      placeholder="https://www.acme.com" 
                      value={profileData.website}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                    />
                  </div>

                  {/* Logo preview widget */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-start gap-3">
                      {profileData.logoUrl && profileData.logoUrl.trim() ? (
                        <img 
                          src={profileData.logoUrl} 
                          alt="Logo Preview" 
                          className="w-11 h-11 rounded-lg border border-[#c6c6cd] object-cover bg-white shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg border border-dashed border-[#c6c6cd] bg-white text-slate-400 flex items-center justify-center shadow-sm shrink-0">
                          <Building2 size={20} className="opacity-40" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-[10.5px] font-bold text-slate-800 uppercase leading-none">Corporate Logo</h4>
                        <p className="text-[9.5px] text-slate-400 font-medium leading-snug mt-1">
                          Upload your brand logo or paste an image URL.
                        </p>
                        <div className="mt-2 flex gap-2">
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
                                    setProfileData(prev => ({ ...prev, logoUrl: response.data.url }));
                                    alert("Logo uploaded successfully!");
                                  } catch (err: any) {
                                    alert("Failed to upload logo: " + (err.response?.data || err.message));
                                  }
                                }
                              }}
                            />
                          </label>
                          {profileData.logoUrl && (
                            <button
                              type="button"
                              onClick={() => setProfileData(prev => ({ ...prev, logoUrl: '' }))}
                              className="border border-[#c6c6cd] bg-white text-red-600 text-[10px] font-semibold px-2.5 py-1.5 rounded hover:bg-red-50 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1">Or Paste Logo Image URL (Optional)</label>
                      <input 
                        type="url" 
                        name="logoUrl"
                        placeholder="https://acme.com/assets/logo.png" 
                        value={profileData.logoUrl}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                /* STEP 2: CONTACT DETAILS */
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Step 2: Contact Channels</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Business Phone Number</label>
                      <input 
                        type="text" 
                        name="phone"
                        placeholder="+91 99887 76655" 
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Business Email (Optional)</label>
                      <input 
                        type="email" 
                        name="email"
                        placeholder="support@acme.com" 
                        value={profileData.email}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GSTIN Tax Registration Code (Optional)</label>
                    <input 
                      type="text" 
                      name="gstIn"
                      placeholder="36AAAAA1111A1Z1" 
                      value={profileData.gstIn}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                    />
                    <p className="text-[9.5px] text-slate-400 font-medium mt-1 leading-normal">
                      Specifying your GST registry code will automatically attach it to all invoice printouts.
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                /* STEP 3: TAX & LOCATION */
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Step 3: Location &amp; Tax Parameters</h4>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Street Address</label>
                    <input 
                      type="text" 
                      name="address"
                      placeholder="Suite 101, Business Park" 
                      value={profileData.address}
                      onChange={handleInputChange}
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">City</label>
                      <input 
                        type="text" 
                        name="city"
                        placeholder="Hyderabad" 
                        value={profileData.city}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">State</label>
                      <input 
                        type="text" 
                        name="state"
                        placeholder="Telangana" 
                        value={profileData.state}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PIN Code</label>
                      <input 
                        type="text" 
                        name="postalCode"
                        placeholder="500001" 
                        value={profileData.postalCode}
                        onChange={handleInputChange}
                        className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Default Tax Contribution</label>
                      <select 
                        name="defaultTaxRate"
                        value={profileData.defaultTaxRate}
                        onChange={handleInputChange}
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
                        name="pricesIncludeTax"
                        id="pricesIncludeTaxOnboardingPage"
                        checked={profileData.pricesIncludeTax}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#006a61] border border-[#c6c6cd] rounded focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="pricesIncludeTaxOnboardingPage" className="text-[11px] font-semibold text-slate-700 select-none cursor-pointer">
                        Catalog prices include GST
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {errorText && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-100 p-3 rounded-lg"
            >
              <p className="text-[10.5px] font-bold text-rose-600 text-center leading-tight">
                {errorText}
              </p>
            </motion.div>
          )}

          {/* Navigation Controls */}
          <div className="flex flex-col pt-4 border-t border-slate-100 space-y-3">
            <div className="flex gap-3">
              {step > 1 && (
                <button 
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 font-display text-xs font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 bg-[#006a61] hover:bg-[#004d47] text-white font-display text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#006a61]/10 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : step < 3 ? (
                  <>
                    <span>Continue Step {step + 1}</span>
                    <ArrowRight size={13} />
                  </>
                ) : (
                  <>
                    <span>Complete Setup &amp; Launch Dashboard</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>

            <button 
              type="button"
              onClick={handleSkip}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-display text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center"
            >
              Skip Setup (Complete Later)
            </button>

            <p className="text-[10px] text-slate-400 text-center font-medium leading-normal italic">
              * Note: You can skip this setup. You can always configure all branding, locations, and tax parameters later within the Settings panel.
            </p>
          </div>
        </form>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
        <ShieldCheck size={13} className="text-emerald-500" />
        <span>SECURE DATA TRANSFER GUARANTEED</span>
      </div>
    </div>
  );
}
