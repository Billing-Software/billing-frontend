import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Building, 
  MessageSquare, 
  Lock, 
  Save, 
  CheckCircle2, 
  XCircle,
  Activity,
  Trash2,
  Plus,
  Loader2,
  Tag,
  Link,
  Unlink,
  Phone,
  Info,
  LogOut,
  ShieldAlert,
  Power,
  Send,
  Radio,
  Palette,
  Globe,
  Crown,
  ArrowRight,
  Sparkles,
  Store
} from 'lucide-react';
import SubscriptionView from '../Subscription/SubscriptionView';
import { businessService } from '../../services/business.service';
import { settingsService } from '../../services/settings.service';
import { smsService, BusinessSmsSettings } from '../../services/sms.service';
import { categoryService, Category } from '../../services/category.service';
import { apiClient } from '../../services/api.client';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/auth.service';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import { useAuth } from '../../hooks/useAuth';
import InvoiceCustomizerStudio from '../../components/invoice/InvoiceCustomizerStudio';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../utils/i18n';

type SettingsTab = 'business' | 'invoiceDesigner' | 'subscription';

export default function Settings() {
  const { showToast } = useToast();
  const { handleLogout, currentUser: user } = useAuth();
  const { config, updateConfig, refreshConfig } = useBusinessConfig();
  const [profile, setProfile] = useState<any>(null);
  const [smsSettings, setSmsSettings] = useState<BusinessSmsSettings | null>(null);
  const [senderId, setSenderId] = useState<string>('');
  const [dltEntityId, setDltEntityId] = useState<string>('');
  const [invoiceTemplateId, setInvoiceTemplateId] = useState<string>('');
  const [templateBody, setTemplateBody] = useState<string>('');
  const [isSmsActive, setIsSmsActive] = useState<boolean>(true);
  const [isSavingSms, setIsSavingSms] = useState<boolean>(false);
  const [showTestSmsModal, setShowTestSmsModal] = useState<boolean>(false);
  const [testPhone, setTestPhone] = useState<string>('');
  const [isSendingTestSms, setIsSendingTestSms] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as SettingsTab;
  const [settingsTab, setSettingsTab] = useState<SettingsTab>(() => {
    return tabFromUrl || 'business';
  });

  useEffect(() => {
    if (tabFromUrl && (tabFromUrl === 'business' || tabFromUrl === 'invoiceDesigner' || tabFromUrl === 'subscription')) {
      setSettingsTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleSelectSettingsTab = (tab: SettingsTab) => {
    setSettingsTab(tab);
    setSearchParams({ tab });
  };
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    return (localStorage.getItem('billcom_lang') as SupportedLanguage) || 'en';
  });

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setSelectedLang(langCode);
    localStorage.setItem('billcom_lang', langCode);
    window.dispatchEvent(new Event('languagechange'));
    const matched = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    showToast(`Display language updated to ${matched?.name || langCode} (${matched?.nativeName})!`, 'success');
  };

  // Password reset local states
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [isChangingPass, setIsChangingPass] = useState<boolean>(false);

  // Local profile states
  const [legalName, setLegalName] = useState<string>('');
  const [tradingName, setTradingName] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [gstIn, setGstIn] = useState<string>('');
  const [gstScheme, setGstScheme] = useState<string>('Regular');
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(18.00);
  const [pricesIncludeTax, setPricesIncludeTax] = useState<boolean>(true);
  const [receiptHeader, setReceiptHeader] = useState<string>('');
  const [receiptFooter, setReceiptFooter] = useState<string>('');
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState<boolean>(true);
  const [receiptTemplateType, setReceiptTemplateType] = useState<string>('Thermal80mm');

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const [profileData, smsData] = await Promise.all([
        businessService.getProfile().catch(() => null),
        smsService.getSettings().catch(() => null)
      ]);
      
      const safeProfile = profileData || {};
      setProfile(safeProfile);
      setSmsSettings(smsData);
      setSenderId(smsData?.senderId || '');
      setDltEntityId(smsData?.dltEntityId || '');
      setInvoiceTemplateId(smsData?.invoiceTemplateId || '');
      setTemplateBody(smsData?.templateBody || 'Dear {#var#}, your invoice {#var#} from {#var#} for Rs.{#var#} is ready. View: {#var#}');
      setIsSmsActive(smsData?.isActive ?? true);
      setLegalName(safeProfile.legalName || '');
      setTradingName(safeProfile.tradingName || '');
      setLogoUrl(safeProfile.logoUrl || '');
      setWebsite(safeProfile.website || '');
      setPhone(safeProfile.phone || '');
      setEmail(safeProfile.email || '');
      setAddress(safeProfile.address || '');
      setCity(safeProfile.city || '');
      setState(safeProfile.state || '');
      const scheme = safeProfile.gstScheme || (config?.gstScheme) || 'Regular';
      setGstScheme(scheme);
      setGstIn(safeProfile.gstIn || '');
      const isNonGst = scheme.toLowerCase() === 'none' || scheme.toLowerCase() === 'non-gst';
      setDefaultTaxRate(isNonGst ? 0 : (safeProfile.defaultTaxRate ?? 18.00));
      setPricesIncludeTax(safeProfile.pricesIncludeTax ?? true);
      setReceiptHeader(safeProfile.receiptHeader || '');
      setReceiptFooter(safeProfile.receiptFooter || '');
      setShowLogoOnReceipt(safeProfile.showLogoOnReceipt ?? true);
      setReceiptTemplateType(safeProfile.receiptTemplateType || 'Thermal80mm');
    } catch (e) {
      console.error('Error fetching settings', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;
    if (newPass.length < 6) {
      showToast("New password must be at least 6 characters.", "error");
      return;
    }

    try {
      setIsChangingPass(true);
      await authService.changePassword({
        currentPassword: currentPass,
        newPassword: newPass
      });
      showToast("Password updated successfully!", "success");
      setCurrentPass('');
      setNewPass('');
    } catch (err: any) {
      showToast("Error updating password: " + (err.response?.data || err.message), "error");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const updated = await businessService.updateProfile({
        ...profile,
        legalName,
        tradingName,
        logoUrl,
        website,
        phone,
        email,
        address,
        city,
        state,
        postalCode,
        gstIn,
        gstScheme,
        defaultTaxRate: Number(defaultTaxRate),
        pricesIncludeTax,
        receiptHeader,
        receiptFooter,
        showLogoOnReceipt,
        receiptTemplateType
      });
      setProfile(updated);
      await updateConfig({ gstScheme, gstIn, registeredState: state });
      showToast("Business profile & tax settings saved securely!", "success");
    } catch (err: any) {
      showToast("Error saving business profile: " + (err.response?.data || err.message), "error");
    }
  };

  const handleSaveReceiptSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const updated = await businessService.updateProfile({
        ...profile,
        legalName,
        tradingName,
        logoUrl,
        website,
        phone,
        email,
        address,
        city,
        state,
        postalCode,
        gstIn,
        defaultTaxRate: Number(defaultTaxRate),
        pricesIncludeTax,
        receiptHeader,
        receiptFooter,
        showLogoOnReceipt,
        receiptTemplateType
      });
      setProfile(updated);
      showToast("Receipt customization layout parameters saved securely!", "success");
    } catch (err: any) {
      showToast("Error saving receipt settings: " + (err.response?.data || err.message), "error");
    }
  };

  const handleSaveSmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSms(true);
      const updated = await smsService.saveSettings({
        senderId: senderId.trim().toUpperCase(),
        dltEntityId: dltEntityId.trim(),
        invoiceTemplateId: invoiceTemplateId.trim(),
        templateBody: templateBody.trim(),
        isActive: isSmsActive
      });
      setSmsSettings(updated);
      showToast("SMS gateway & DLT parameters saved securely!", "success");
    } catch (err: any) {
      showToast("Error saving SMS settings: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setIsSavingSms(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    try {
      setIsSendingTestSms(true);
      const res = await smsService.sendTestSms(testPhone.trim());
      if (res.success) {
        showToast(res.message, "success");
        setShowTestSmsModal(false);
        setTestPhone('');
      } else {
        showToast(res.message, "error");
      }
    } catch (err: any) {
      showToast("Failed to dispatch test SMS: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setIsSendingTestSms(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[#006a61]" size={36} />
        <p className="text-sm text-[#7c839b] font-bold uppercase tracking-wider">Synchronizing Node configurations...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Business Identity & Subscription HUD Banner (Mirroring mobile Settings header) */}
      {(() => {
        const planId = profile?.activePlanId ?? user?.activePlanId ?? 1;
        const planName = planId === 3 ? 'Enterprise Chain' : (planId === 2 ? 'Growth Business' : 'Starter Shop');
        const status = profile?.subscriptionStatus || user?.subscriptionStatus || 'Active';
        const isTrial = (profile?.isTrial ?? user?.isTrial) || status.toLowerCase() === 'trial';
        const isTrialExpired = status.toLowerCase() === 'trialexpired';
        const storeName = profile?.tradingName || profile?.legalName || user?.businessName || 'Your Store Business';
        const category = profile?.businessCategory || 'General Retail';
        const gstin = profile?.gstIn || '';

        return (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {profile?.logoUrl && profile.logoUrl.trim() ? (
                <img 
                  src={profile.logoUrl} 
                  alt="Store Logo" 
                  className="w-13 h-13 rounded-xl border border-slate-200 object-cover bg-white shadow-xs shrink-0" 
                />
              ) : (
                <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-[#004d46] to-[#006a61] text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                  {storeName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-black text-base sm:text-lg text-slate-900 leading-tight">
                    {storeName}
                  </h2>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border shadow-2xs ${
                    planId >= 2 ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-teal-50 text-[#006a61] border-teal-200'
                  }`}>
                    <Crown size={11} className={planId >= 2 ? 'text-amber-600' : 'text-[#006a61]'} />
                    {planName}
                  </span>
                  {isTrial && (
                    <span className="inline-flex items-center text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      ⚡ 7-Day Free Trial
                    </span>
                  )}
                  {isTrialExpired && (
                    <span className="inline-flex items-center text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                      ⚠️ Trial Expired
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                  <span>{category}</span>
                  {gstin && <span className="font-mono text-[#006a61] font-semibold">• GSTIN: {gstin}</span>}
                  <span className="text-slate-400">• Outlets: {profile?.allowedBranches === -1 ? 'Unlimited' : (profile?.allowedBranches ?? 1)}</span>
                  <span className="text-slate-400">• Staff: {profile?.allowedStaff === -1 ? 'Unlimited' : (profile?.allowedStaff ?? 2)}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectSettingsTab('subscription')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isTrialExpired
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : isTrial
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : settingsTab === 'subscription'
                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-[#006a61] hover:bg-[#005a52] text-white'
              }`}
            >
              <Crown size={14} />
              <span>{isTrialExpired ? 'Activate Plan Now' : isTrial ? 'Manage Trial & Plans' : 'View Quotas & Plans'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        );
      })()}

      {/* Settings Top Tab Navigation */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-fit">
        <button
          onClick={() => handleSelectSettingsTab('business')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            settingsTab === 'business'
              ? 'bg-[#006a61] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Building size={14} />
          Business & Tax
        </button>
        <button
          onClick={() => handleSelectSettingsTab('invoiceDesigner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            settingsTab === 'invoiceDesigner'
              ? 'bg-[#006a61] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Palette size={14} />
          Invoice Designer Studio
        </button>
        <button
          onClick={() => handleSelectSettingsTab('subscription')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            settingsTab === 'subscription'
              ? 'bg-[#006a61] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Crown size={14} />
          Subscription & Plans
        </button>
      </div>

      {/* Subscription & Plans Tab */}
      {settingsTab === 'subscription' && (
        <SubscriptionView />
      )}

      {/* Invoice Designer Studio Tab */}
      {settingsTab === 'invoiceDesigner' && (
        <div className="h-[calc(100vh-180px)]">
          <InvoiceCustomizerStudio
            businessProfile={profile}
            onSave={(settings) => {
              showToast('Invoice design saved!', 'success');
            }}
          />
        </div>
      )}

      {/* Business Settings Tab */}
      {settingsTab === 'business' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">

        {/* Display Language Selection Card */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 text-[#006a61] rounded-xl border border-teal-100">
              <Globe size={20} />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs text-[#0b1c30]">App Display Language (యాప్ భాష / भाषा)</h4>
              <p className="text-[11px] text-slate-500 font-medium">Select your preferred language for all menus, billing labels, and reports.</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-[#006a61] shadow-xs border border-teal-200 font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </button>
              );
            })}
          </div>
        </section>
        
        {/* Business Profile Panel Form */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-[#f8f9ff] flex items-center gap-2.5">
            <Building size={18} className="text-[#006f66]" />
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">Legal Business Node</h3>
              <p className="font-sans text-[10px] text-[#7c839b] font-medium uppercase mt-0.5">Define corporate credentials, tax rules, and registration codes.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Legal Company Name</label>
                <input 
                  type="text" 
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Trading Name (Brand Name)</label>
                <input 
                  type="text" 
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                />
              </div>

              <div className="sm:col-span-2 bg-[#f8f9ff] p-4 rounded-xl border border-[#eff4ff] space-y-3">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5">
                  {logoUrl && logoUrl.trim() ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      className="w-16 h-16 rounded-lg border border-[#c6c6cd] object-cover bg-white shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-dashed border-[#c6c6cd] bg-white text-[#7c839b] flex items-center justify-center shadow-sm shrink-0">
                      <Building className="opacity-40" size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-[#0b1c30] uppercase leading-none">Business Logo Image</h4>
                    <p className="text-[10px] text-[#7c839b] font-medium leading-snug mt-1.5">
                      Upload your business logo image to display it on billing page receipts and invoices.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <label className="bg-[#006a61] hover:bg-opacity-90 text-white text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-all flex items-center gap-1.5">
                        <span>Upload File</span>
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
                                showToast("Logo uploaded successfully!", "success");
                              } catch (err: any) {
                                showToast("Failed to upload logo: " + (err.response?.data || err.message), "error");
                              }
                            }
                          }}
                        />
                      </label>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="border border-[#c6c6cd] bg-white hover:bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#7c839b] uppercase block mb-1">Or Paste Logo Image URL</label>
                  <input 
                    type="url" 
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://acme.com/assets/logo.png" 
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Website URL</label>
                <input 
                  type="url" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Business Phone Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Business Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@business.com"
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Headquarters Street Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Corporate City</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Corporate State</label>
                <input 
                  type="text" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Telangana"
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Postal Code (ZIP)</label>
                <input 
                  type="text" 
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  required
                />
              </div>

            {/* GST Registration & Tax Setup Box - Matching Signup Page */}
            <div className="space-y-4 text-left bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Are you registered for GST?</label>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Auto-calculates CGST/SGST vs IGST on bills &amp; invoices</p>
                </div>
                <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setGstScheme('Regular');
                      if (defaultTaxRate === 0) setDefaultTaxRate(18.00);
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      gstScheme !== 'None' && gstScheme !== 'Non-GST' 
                        ? 'bg-white text-[#006a61] shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGstScheme('Non-GST');
                      setDefaultTaxRate(0);
                      setGstIn('');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      gstScheme === 'None' || gstScheme === 'Non-GST' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {gstScheme !== 'None' && gstScheme !== 'Non-GST' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">GST Registration Scheme</label>
                    <select
                      value={gstScheme}
                      onChange={(e) => setGstScheme(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#006a61] h-9"
                    >
                      <option value="Regular">Regular GST Scheme (Taxable 5%, 12%, 18%, 28%)</option>
                      <option value="Composition">Composition Scheme (1% / 6% Flat Rate)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">GSTIN Number (Optional)</label>
                    <input 
                      type="text" 
                      value={gstIn}
                      onChange={(e) => setGstIn(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#006a61]"
                      placeholder="e.g. 36AAAAA0000A1Z5"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Registered State</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#006a61] h-9"
                    >
                      {['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Delhi', 'Gujarat', 'Kerala', 'West Bengal', 'Odisha', 'Goa', 'Punjab', 'Rajasthan'].map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Primary CGST/SGST Tax Range</label>
                    <select 
                      value={Number(defaultTaxRate)}
                      onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#006a61] h-9"
                    >
                      <option value={18}>18% Standard GST Rule</option>
                      <option value={12}>12% Apparel &amp; Standard Goods</option>
                      <option value={5}>5% Food &amp; Essential Services</option>
                      <option value={0}>0% Tax Exempt Rule</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-bold text-amber-900">Non-GST Merchant (0% Tax Rate Applied)</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase bg-amber-200/60 px-2 py-0.5 rounded">
                    GST Tax Inactive
                  </span>
                </div>
              )}
            </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input 
                id="pricesIncludeTaxCheckbox"
                type="checkbox" 
                checked={pricesIncludeTax}
                onChange={(e) => setPricesIncludeTax(e.target.checked)}
                className="w-4 h-4 text-[#006a61] border border-[#c6c6cd] rounded focus:ring-0"
              />
              <label htmlFor="pricesIncludeTaxCheckbox" className="text-xs font-semibold text-[#0b1c30]">
                Advertised prices automatically include regional CGST/SGST tax contributions.
              </label>
            </div>

            {/* Business Type & Intelligent Vocabulary Configuration */}
            {config && (
              <div className="mt-6 pt-5 border-t border-[#e2e8f0] space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#006a61] uppercase tracking-wider bg-[#006a61]/10 px-2 py-0.5 rounded">Growth Feature</span>
                  <h4 className="font-display font-extrabold text-sm text-slate-900">Business Type & Vocabulary Configuration</h4>
                </div>
                <p className="text-xs text-slate-500 font-sans">
                  Configures navigation tabs, dashboard widgets, and user-facing terminology ("Menu Item" vs "Product", "Client" vs "Customer").
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Business Type</label>
                    <select
                      value={config.businessType}
                      onChange={async (e) => {
                        const val = e.target.value;
                        await updateConfig({ businessType: val });
                        showToast(`Configured layout for ${val}`, "success");
                        refreshConfig();
                      }}
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                    >
                      <option value="General Retail Store">General Retail Store</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Tiffin Center / Mess">Tiffin Center / Mess</option>
                      <option value="Bakery & Confectionery">Bakery & Confectionery</option>
                      <option value="Grocery / Kirana Store">Grocery / Kirana Store</option>
                      <option value="Clothing / Garments Store">Clothing / Garments Store</option>
                      <option value="Pharmacy / Medical Store">Pharmacy / Medical Store</option>
                      <option value="Electronics & Mobile Store">Electronics & Mobile Store</option>
                      <option value="Salon / Barber / Beauty Parlour">Salon / Barber / Beauty Parlour</option>
                      <option value="Repair & Maintenance Services">Repair & Maintenance Services</option>
                      <option value="Software / IT Services">Software / IT Services</option>
                      <option value="Consulting & Professional Services">Consulting & Professional Services</option>
                      <option value="Clinic / Healthcare Center">Clinic / Healthcare Center</option>
                      <option value="Tuition / Coaching Center">Tuition / Coaching Center</option>
                      <option value="Manufacturing & Production">Manufacturing & Production</option>
                      <option value="Wholesale & Trading">Wholesale & Trading</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Selling Model</label>
                    <select
                      value={config.sellingModel}
                      onChange={async (e) => {
                        const val = e.target.value;
                        await updateConfig({ sellingModel: val });
                        showToast(`Selling model updated to ${val}`, "info");
                        refreshConfig();
                      }}
                      className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                    >
                      <option value="GOODS_AND_SERVICES">Goods & Services (Products + Services)</option>
                      <option value="GOODS_ONLY">Goods Only (Physical Products)</option>
                      <option value="SERVICES_ONLY">Services Only (Non-Inventory Services)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-[#e2e8f0]/40 pt-4 flex justify-end">
              <button 
                type="submit"
                className="bg-[#006a61] text-white text-xs font-semibold px-4.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-opacity-95"
              >
                <Save size={13} />
                <span>Save Business Profile</span>
              </button>
            </div>
          </form>
        </section>

        {/* Invoice Designer CTA Banner */}
        <section className="bg-gradient-to-r from-[#006a61]/10 to-[#006a61]/5 rounded-xl border border-[#006a61]/20 p-5 flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#006a61] text-white rounded-xl">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">Invoice Designer Studio</h3>
              <p className="text-xs text-slate-500 mt-0.5">Design beautiful invoices with 5 themes, UPI QR codes, brand colors, and live preview</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsTab('invoiceDesigner')}
            className="px-4 py-2 bg-[#006a61] text-white text-xs font-bold rounded-lg hover:bg-[#005a52] transition-colors shadow-sm"
          >
            Open Designer →
          </button>
        </section>

        {/* SMS Gateway & DLT Configuration */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-[#f8f9ff] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare size={18} className="text-[#006f66]" />
              <div>
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">SMS &amp; DLT Gateway (Exotel Engine)</h3>
                <p className="font-sans text-[10px] text-[#7c839b] font-medium uppercase mt-0.5">Automated invoice SMS dispatches with Indian Telecom DLT Compliance.</p>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${isSmsActive && senderId ? 'bg-[#e2f3eb] text-[#1e8e3e]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
              {isSmsActive && senderId ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              <span>{isSmsActive && senderId ? 'Configured & Active' : 'Setup Required'}</span>
            </div>
          </div>

          <form onSubmit={handleSaveSmsSettings} className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">
                  Sender ID / Header <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value.toUpperCase())}
                  placeholder="e.g. SRILAX"
                  className="w-full text-xs font-mono font-bold p-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none tracking-wider"
                  required
                />
                <span className="text-[9px] text-[#7c839b] mt-1 block">Approved 6-character DLT Header</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">
                  DLT Principal Entity ID <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={dltEntityId}
                  onChange={(e) => setDltEntityId(e.target.value)}
                  placeholder="e.g. 1201159123456789012"
                  className="w-full text-xs font-mono p-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                  required
                />
                <span className="text-[9px] text-[#7c839b] mt-1 block">Registered Enterprise Entity ID</span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">
                  DLT Invoice Template ID <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={invoiceTemplateId}
                  onChange={(e) => setInvoiceTemplateId(e.target.value)}
                  placeholder="e.g. 1207161987654321098"
                  className="w-full text-xs font-mono p-2.5 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                  required
                />
                <span className="text-[9px] text-[#7c839b] mt-1 block">Approved Content Template ID</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">
                Approved DLT Template Body
              </label>
              <textarea
                value={templateBody}
                onChange={(e) => setTemplateBody(e.target.value)}
                placeholder="Dear {#var#}, your invoice {#var#} from {#var#} for Rs.{#var#} is ready. View: {#var#}"
                className="w-full text-xs font-medium p-3 bg-slate-50 border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none h-20 resize-none font-sans"
              />
              <span className="text-[9px] text-[#7c839b] mt-0.5 block">Placeholders: 1=Customer Name, 2=Invoice No, 3=Business Name, 4=Amount, 5=Invoice Link</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-[#0b1c30] block">Automated Dispatch Active</span>
                <span className="text-[10px] text-[#7c839b]">Automatically transmit SMS invoices when billing customers</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSmsActive}
                  onChange={(e) => setIsSmsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#006a61]"></div>
              </label>
            </div>

            <div className="border-t border-[#e2e8f0]/40 pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowTestSmsModal(true)}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send size={13} className="text-[#006a61]" />
                <span>Send Test SMS</span>
              </button>

              <button
                type="submit"
                disabled={isSavingSms}
                className="bg-[#006a61] text-white text-xs font-semibold px-5 py-2.5 rounded-lg flex items-center gap-1.5 hover:bg-opacity-95 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSavingSms ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save SMS Settings</span>
              </button>
            </div>
          </form>
        </section>



        {/* Change Account Password Section */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm overflow-hidden mt-6">
          <div className="p-5 border-b bg-[#f8f9ff] flex items-center gap-2.5">
            <Lock size={18} className="text-[#ba1a1a]" />
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">Change Account Password</h3>
              <p className="font-sans text-[10px] text-[#7c839b] font-medium uppercase mt-0.5">Update password credentials for your active account session.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  required
                />
              </div>
            </div>

            <div className="border-t border-[#e2e8f0]/40 pt-4 flex justify-end">
              <button 
                type="submit"
                disabled={isChangingPass}
                className="bg-[#006a61] text-white text-xs font-semibold px-4.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-opacity-95 disabled:opacity-50 cursor-pointer"
              >
                {isChangingPass ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Dedicated Account Session & Logout Section */}
        <section id="logout-settings-section" className="bg-white rounded-xl border border-rose-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                <LogOut size={18} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900">Account Session & Logout</h3>
                <p className="text-xs text-slate-500">Manage active authentication session and sign out securely</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase rounded-full tracking-wider">
              Session Active
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">Logged in as: <span className="text-[#006a61] font-extrabold">{user?.name || user?.username || 'Current User'}</span></p>
                <p className="text-[11px] text-slate-500 font-semibold">Role: <span className="uppercase text-slate-700">{user?.role || 'Owner'}</span> {user?.businessName ? `| Business: ${user.businessName}` : ''}</p>
                <p className="text-[11px] text-slate-400">Signing out will terminate your current session on this terminal.</p>
              </div>

              <button
                id="settings-logout-btn"
                onClick={handleLogout}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-sans text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Power size={15} />
                <span>Log Out of Workspace</span>
              </button>
            </div>
          </div>
        </section>
      </div>


      {/* Right Column details */}
      <aside className="lg:col-span-4 space-y-4">
        {/* Subscription & Resource Quotas Card (Mirroring mobile Settings Billing section) */}
        {(() => {
          const planId = profile?.activePlanId ?? user?.activePlanId ?? 1;
          const planName = planId === 3 ? 'Enterprise Chain' : (planId === 2 ? 'Growth Business' : 'Starter Shop');
          const isTrial = (profile?.isTrial ?? user?.isTrial) || (profile?.subscriptionStatus || '').toLowerCase() === 'trial';
          const isTrialExpired = (profile?.subscriptionStatus || '').toLowerCase() === 'trialexpired';

          return (
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
                    <Crown size={16} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-slate-900 leading-tight">Subscription Tier</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{planName}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isTrialExpired ? 'bg-rose-100 text-rose-800 border border-rose-300' : isTrial ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {isTrialExpired ? 'Expired' : isTrial ? '⚡ Trial' : 'Active'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Store Outlets:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {profile?.allowedBranches === -1 ? 'Unlimited (∞)' : `${profile?.allowedBranches ?? 1} Max`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Staff Profiles:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {profile?.allowedStaff === -1 ? 'Unlimited (∞)' : `${profile?.allowedStaff ?? 2} Seats`}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Tax Invoicing:</span>
                  <span className="font-bold text-emerald-600 uppercase font-mono">Unlimited</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectSettingsTab('subscription')}
                className="w-full py-2 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 text-[#006a61] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Manage & Upgrade Plan</span>
                <ArrowRight size={13} />
              </button>
            </div>
          );
        })()}

        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
          <h4 className="font-display font-bold text-xs text-[#0b1c30] uppercase tracking-wider mb-2">Platform Engine Details</h4>
          
          <div className="p-3 bg-[#eff4ff] border rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#006f66]" />
              <span className="text-xs font-semibold text-[#0b1c30]">Engine Hub</span>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#006f66]">Live v1.0.4-POS</span>
          </div>

          <div className="p-3 bg-[#eff4ff] border rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-[#006f66]" />
              <span className="text-xs font-semibold text-[#0b1c30]">Terminal Encrypt</span>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#006f66]">SHA256 Ready</span>
          </div>

          <div className="text-[11px] text-[#7c839b] font-semibold leading-normal pt-2">
            Workspace updates undergo real time validation against system rules. Audit trails are compiled securely.
          </div>
        </div>
      </aside>
      </div>
      )}

      {/* Test SMS Modal */}
      {showTestSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#006a61]/10 rounded-xl text-[#006a61]">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">Send Test SMS</h3>
                  <p className="text-xs text-slate-500">Verify Exotel gateway and Sender ID headers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestSmsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSendTestSms} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Active Sender ID:</span>
                  <span className="font-mono font-bold text-[#006a61]">{senderId || 'NOT SET'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">DLT Entity ID:</span>
                  <span className="font-mono text-slate-700">{dltEntityId || 'NOT SET'}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Recipient Mobile Number
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:border-[#006a61] outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSendingTestSms || !testPhone.trim()}
                className="w-full py-3 bg-[#006a61] hover:bg-[#00554e] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSendingTestSms ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>{isSendingTestSms ? 'Dispatching Test SMS...' : 'Dispatch Test SMS'}</span>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

interface FlattenedNode {
  category: Category;
  depth: number;
}

function buildCategoryTree(flatCats: Category[]): CategoryNode[] {
  const map: Record<number, CategoryNode> = {};
  flatCats.forEach(c => {
    map[c.id] = { category: c, children: [] };
  });
  const roots: CategoryNode[] = [];
  flatCats.forEach(c => {
    const node = map[c.id];
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function flattenCategoryTree(nodes: CategoryNode[], depth = 0): FlattenedNode[] {
  const result: FlattenedNode[] = [];
  nodes.forEach(node => {
    result.push({ category: node.category, depth });
    if (node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, depth + 1));
    }
  });
  return result;
}
