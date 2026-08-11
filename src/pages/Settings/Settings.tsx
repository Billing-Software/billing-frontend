import React, { useState, useEffect } from 'react';
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
  Power
} from 'lucide-react';
import { businessService } from '../../services/business.service';
import { settingsService } from '../../services/settings.service';
import { whatsAppService, WhatsAppAccountStatus, WhatsAppTemplate } from '../../services/whatsapp.service';
import { categoryService, Category } from '../../services/category.service';
import { apiClient } from '../../services/api.client';
import { useToast } from '../../hooks/useToast';
import { useMetaSDK } from '../../hooks/useMetaSDK';
import { authService } from '../../services/auth.service';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import { useAuth } from '../../hooks/useAuth';

export default function Settings() {
  const { showToast } = useToast();
  const { handleLogout, currentUser: user } = useAuth();
  const { config, updateConfig, refreshConfig } = useBusinessConfig();
  const [profile, setProfile] = useState<any>(null);
  const [waStatus, setWaStatus] = useState<WhatsAppAccountStatus | null>(null);
  const [isWaConnecting, setIsWaConnecting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  // WhatsApp Cloud API states are now in waStatus
  const [waTemplate, setWaTemplate] = useState<WhatsAppTemplate | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const [profileData, waStatusData] = await Promise.all([
        businessService.getProfile(),
        whatsAppService.getStatus()
      ]);
      
      setProfile(profileData);
      setWaStatus(waStatusData);

      if (waStatusData?.status === 'Connected') {
        whatsAppService.getTemplates().then(templates => {
          if (templates && templates.length > 0) setWaTemplate(templates[0]);
        }).catch(() => {});
      }
      setLegalName(profileData.legalName || '');
      setTradingName(profileData.tradingName || '');
      setLogoUrl(profileData.logoUrl || '');
      setWebsite(profileData.website || '');
      setPhone(profileData.phone || '');
      setEmail(profileData.email || '');
      setAddress(profileData.address || '');
      setCity(profileData.city || '');
      setState(profileData.state || '');
      const scheme = profileData.gstScheme || (config?.gstScheme) || 'Regular';
      setGstScheme(scheme);
      setGstIn(profileData.gstIn || '');
      const isNonGst = scheme.toLowerCase() === 'none' || scheme.toLowerCase() === 'non-gst';
      setDefaultTaxRate(isNonGst ? 0 : (profileData.defaultTaxRate ?? 18.00));
      setPricesIncludeTax(profileData.pricesIncludeTax ?? true);
      setReceiptHeader(profileData.receiptHeader || '');
      setReceiptFooter(profileData.receiptFooter || '');
      setShowLogoOnReceipt(profileData.showLogoOnReceipt ?? true);
      setReceiptTemplateType(profileData.receiptTemplateType || 'Thermal80mm');

      setWaStatus(waStatusData);
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

  const metaSDK = useMetaSDK({
    onSuccess: async (result) => {
      try {
        setIsWaConnecting(true);
        const status = await whatsAppService.connect({
          code: result.code,
          wabaId: result.wabaId,
          phoneNumberId: result.phoneNumberId,
          displayPhoneNumber: result.displayPhoneNumber,
        });
        setWaStatus(status);
        showToast('WhatsApp Business connected successfully via Meta Embedded Signup!', 'success');
      } catch (err: any) {
        showToast('Connection failed: ' + (err.response?.data?.error || err.message), 'error');
      } finally {
        setIsWaConnecting(false);
      }
    },
    onError: (error) => {
      showToast('Embedded Signup error: ' + error, 'error');
      setIsWaConnecting(false);
    },
  });

  const [showWaModal, setShowWaModal] = useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');

  const handleConnectWhatsApp = () => {
    // Open the WhatsApp Connection Modal
    setShowWaModal(true);
  };

  const handleLaunchMetaSDK = () => {
    setIsWaConnecting(true);
    const launched = metaSDK.launchEmbeddedSignup();
    if (!launched) {
      showToast('Meta SDK popup is not ready or blocked by browser. You can use Demo WABA or manual code.', 'info');
      setIsWaConnecting(false);
    }
  };

  const handleConnectDemoWaba = async () => {
    setIsWaConnecting(true);
    try {
      const status = await whatsAppService.connect({
        code: 'EAAPXJmR6jU8BSHWhyNFz3rz2lZANRyvsjaONhQE8X5D7LihFf6IkKRDvcB1OS7kIfAXRMXX6xFWp3cGTuSKyuzVPOyt8bVRZBq6jEI50QGdfsDsoHfcZBFVoE7Wb5XKgnFXnPZARn5DegoLy2dsEDZAGRMYWImvkmr9FeSAiZCsYSFM7ZAEn97TxPYrtia1ZCJJjWmZAeSUbwLOAlFEpjXGWvbVAZAh1C8gIXETLJs2hGBqOssFSgMAS0eK3zo3FZBtJ2mZCbQ2xasQMsM2W8N7qsXGGEj0JsQZDZD',
        wabaId: '1063228732791303',
        phoneNumberId: '1273696479156949',
        displayPhoneNumber: '+1 (555) 672-6923',
      });
      setWaStatus(status);
      setShowWaModal(false);
      showToast('WhatsApp Business connected successfully (Demo WABA)!', 'success');

      // Fetch auto-provisioned template
      whatsAppService.getTemplates().then(templates => {
        if (templates && templates.length > 0) setWaTemplate(templates[0]);
      }).catch(() => {});
    } catch (err: any) {
      showToast('Connection failed: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setIsWaConnecting(false);
    }
  };

  const handleConnectManualCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    setIsWaConnecting(true);
    try {
      const status = await whatsAppService.connect({
        code: manualCodeInput.trim(),
        wabaId: '1063228732791303',
        phoneNumberId: '1273696479156949',
        displayPhoneNumber: '+1 (555) 672-6923',
      });
      setWaStatus(status);
      setShowWaModal(false);
      setManualCodeInput('');
      showToast('WhatsApp Business connected successfully!', 'success');

      whatsAppService.getTemplates().then(templates => {
        if (templates && templates.length > 0) setWaTemplate(templates[0]);
      }).catch(() => {});
    } catch (err: any) {
      showToast('Connection failed: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setIsWaConnecting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!confirm('Are you sure you want to disconnect your WhatsApp Business account? You will no longer be able to send invoices via WhatsApp.')) return;
    try {
      await whatsAppService.disconnect();
      setWaStatus({ id: 0, status: 'NotConnected' });
      setWaTemplate(null);
      showToast('WhatsApp disconnected.', 'success');
    } catch (err: any) {
      showToast('Disconnect failed: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleSyncTemplate = async () => {
    try {
      showToast('Provisioning BillCom Invoice Template on WABA...', 'info');
      const t = await whatsAppService.syncTemplates();
      setWaTemplate(t);
      showToast('BillCom Invoice Template synced successfully!', 'success');
    } catch (err: any) {
      showToast('Template sync failed: ' + (err.response?.data?.error || err.message), 'error');
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
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
    >
      <div className="lg:col-span-8 space-y-6">
        
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

        {/* Receipt Customization & Thermal Layout Section */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm overflow-hidden mt-6">
          <div className="p-5 border-b bg-[#f8f9ff] flex items-center gap-2.5">
            <Building size={18} className="text-[#006f66]" />
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">Receipt Customization &amp; Thermal Layout</h3>
              <p className="font-sans text-[10px] text-[#7c839b] font-medium uppercase mt-0.5">Customize layout types, logo toggles, headers, and footers for thermal print receipts.</p>
            </div>
          </div>

          <form onSubmit={handleSaveReceiptSettings} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Receipt Template Type</label>
                <select 
                  value={receiptTemplateType}
                  onChange={(e) => setReceiptTemplateType(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none h-9"
                >
                  <option value="Thermal80mm">Thermal 80mm Printer (48 Chars)</option>
                  <option value="Thermal58mm">Thermal 58mm Printer (32 Chars)</option>
                  <option value="StandardA4">Standard A4 Layout</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input 
                  id="showLogoOnReceiptCheckbox"
                  type="checkbox" 
                  checked={showLogoOnReceipt}
                  onChange={(e) => setShowLogoOnReceipt(e.target.checked)}
                  className="w-4 h-4 text-[#006a61] border border-[#c6c6cd] rounded focus:ring-0"
                />
                <label htmlFor="showLogoOnReceiptCheckbox" className="text-xs font-semibold text-[#0b1c30]">
                  Print Business Logo on Invoices
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Receipt Header Text</label>
                <textarea 
                  value={receiptHeader}
                  onChange={(e) => setReceiptHeader(e.target.value)}
                  placeholder="e.g. Welcome to SmartBill Retail Spa! Visit again."
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none h-16 resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Receipt Footer Text</label>
                <textarea 
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="e.g. For support contact: support@business.com. Thank you!"
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none h-16 resize-none"
                />
              </div>
            </div>

            <div className="border-t border-[#e2e8f0]/40 pt-4 flex justify-end">
              <button 
                type="submit"
                className="bg-[#006a61] text-white text-xs font-semibold px-4.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-opacity-95"
              >
                <Save size={13} />
                <span>Save Receipt Customizations</span>
              </button>
            </div>
          </form>
        </section>

        {/* WhatsApp Cloud API Integration */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-[#f8f9ff] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare size={18} className="text-[#006f66]" />
              <div>
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">WhatsApp Cloud API</h3>
                <p className="font-sans text-[10px] text-[#7c839b] font-medium uppercase mt-0.5">Send invoices & notifications directly via your WhatsApp Business account.</p>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${waStatus?.status === 'Connected' ? 'bg-[#e2f3eb] text-[#1e8e3e]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
              {waStatus?.status === 'Connected' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              <span>{waStatus?.status === 'Connected' ? 'Connected' : 'Not Connected'}</span>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Connection Status Card */}
            <div className={`rounded-xl p-6 text-center ${waStatus?.status === 'Connected' ? 'bg-[#f0fdf4] border border-[#bbf7d0]' : 'bg-[#f9fafb] border border-[#e5e7eb]'}`}>
              <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 ${waStatus?.status === 'Connected' ? 'bg-[#25d366]/15' : 'bg-[#6b7280]/10'}`}>
                {waStatus?.status === 'Connected'
                  ? <CheckCircle2 size={28} className="text-[#25d366]" />
                  : <Unlink size={28} className="text-[#6b7280]" />
                }
              </div>
              <h4 className={`font-display font-bold text-lg ${waStatus?.status === 'Connected' ? 'text-[#16a34a]' : 'text-[#6b7280]'}`}>
                {waStatus?.status === 'Connected' ? 'Connected' : 'Not Connected'}
              </h4>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">
                {waStatus?.status === 'Connected'
                  ? 'WhatsApp Business API is active. You can send invoices directly to customers.'
                  : 'Connect your WhatsApp Business account via Meta Embedded Signup to start sending invoices.'
                }
              </p>

              {waStatus?.status === 'Connected' && waStatus?.displayPhoneNumber && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-[#e5e7eb]">
                  <Phone size={14} className="text-[#25d366]" />
                  <span className="text-sm font-semibold text-[#111827]">{waStatus.displayPhoneNumber}</span>
                </div>
              )}

              {waStatus?.status === 'Connected' && waStatus?.wabaId && (
                <p className="text-[10px] text-[#9ca3af] mt-2">WABA: {waStatus.wabaId}</p>
              )}
            </div>

            {/* Managed WhatsApp Template Card */}
            {waStatus?.status === 'Connected' && (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-[#006f66]" />
                    <h4 className="font-display font-bold text-xs text-[#0b1c30]">Auto-Managed Invoice Template</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncTemplate}
                    className="px-3 py-1 bg-white border border-[#cbd5e1] rounded-lg text-[11px] font-bold text-[#0f172a] hover:bg-[#f1f5f9] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={12} className="text-[#006f66]" />
                    Sync / Provision Template
                  </button>
                </div>

                <div className="bg-white rounded-lg p-3 border border-[#e2e8f0] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-[#006f66]">{waTemplate?.templateName || 'billcom_invoice_v1'}</span>
                    <span className="ml-2 text-[10px] text-[#64748b] uppercase font-semibold">({waTemplate?.category || 'UTILITY'})</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#dcfce7] text-[#166534]">
                    {waTemplate?.status || 'APPROVED'}
                  </span>
                </div>

                <p className="text-[11px] text-[#475569] leading-relaxed">
                  {waTemplate?.bodyText || 'Hello {{1}}, your invoice {{2}} for {{3}} has been generated by {{4}}.\n\nView and download your digital receipt:\n{{5}}\n\nThank you for your business!'}
                </p>
              </div>
            )}

            {/* Connect / Disconnect Button */}
            <div className="flex justify-center">
              {waStatus?.status === 'Connected' ? (
                <button
                  type="button"
                  onClick={handleDisconnectWhatsApp}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold border border-[#fca5a5] text-[#dc2626] hover:bg-[#fef2f2] transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Unlink size={14} />
                  Disconnect WhatsApp
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectWhatsApp}
                  disabled={isWaConnecting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#25d366] text-white hover:bg-[#22c55e] transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isWaConnecting ? <Loader2 size={14} className="animate-spin" /> : <Link size={14} />}
                  {isWaConnecting ? 'Connecting...' : 'Connect WhatsApp'}
                </button>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-[#0284c7]" />
                <span className="text-xs font-bold text-[#0284c7]">How it works</span>
              </div>
              <ul className="text-[11px] text-[#374151] space-y-1.5 leading-relaxed ml-5">
                <li>• Messages are sent securely through your own WhatsApp Business account</li>
                <li>• Send invoice PDFs directly to your customers' WhatsApp</li>
                <li>• Get real-time delivery and read receipts for every message</li>
                <li>• Access tokens are AES-256 encrypted and never exposed to the browser</li>
              </ul>
            </div>
          </div>
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
        <div className="bg-white rounded-xl border p-5 shadow-sm space-y-3">
          <h4 className="font-display font-bold text-xs text-[#0b1c30] uppercase tracking-wider mb-2">Platform Meta Details</h4>
          
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

      {/* WhatsApp Connection Modal Overlay */}
      {showWaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#25d366]/15 rounded-xl text-[#25d366]">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#0b1c30]">Connect WhatsApp Business</h3>
                  <p className="text-xs text-slate-500">BillCom Meta Embedded Signup & Onboarding</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWaModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Live Meta Embedded Signup */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#25d366]" /> Option A: Meta Embedded Signup (Live)
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-200 text-emerald-800 rounded">Official</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Opens Facebook Login dialog to connect your WABA and authorize BillCom automatically.
                </p>
                <button
                  type="button"
                  onClick={handleLaunchMetaSDK}
                  disabled={isWaConnecting}
                  className="w-full py-2.5 bg-[#25d366] hover:bg-[#22c55e] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isWaConnecting ? <Loader2 size={14} className="animate-spin" /> : <Link size={14} />}
                  <span>Launch Meta Embedded Signup</span>
                </button>
              </div>

              {/* Option 2: 1-Click Demo Sandbox WABA */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag size={14} className="text-[#006f66]" /> Option B: Instant Demo WABA (Development)
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-blue-100 text-blue-800 rounded">1-Click Test</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Connects a pre-configured sandbox WABA with auto-provisioned invoice templates for instant testing.
                </p>
                <button
                  type="button"
                  onClick={handleConnectDemoWaba}
                  disabled={isWaConnecting}
                  className="w-full py-2.5 bg-[#006f66] hover:bg-[#005a53] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isWaConnecting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Connect Demo WABA Sandbox</span>
                </button>
              </div>

              {/* Option 3: Manual Authorization Code */}
              <form onSubmit={handleConnectManualCode} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800">Option C: Manual Meta Code</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="Paste Meta OAuth Code"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isWaConnecting || !manualCodeInput.trim()}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
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
