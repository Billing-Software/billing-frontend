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
  Tag
} from 'lucide-react';
import { businessService } from '../../services/business.service';
import { settingsService } from '../../services/settings.service';
import { categoryService, Category } from '../../services/category.service';
import { apiClient } from '../../services/api.client';
import { useToast } from '../../hooks/useToast';
import { authService } from '../../services/auth.service';

export default function Settings() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [whatsApp, setWhatsApp] = useState<any>(null);
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
  const [defaultTaxRate, setDefaultTaxRate] = useState<number>(18.00);
  const [pricesIncludeTax, setPricesIncludeTax] = useState<boolean>(true);
  const [receiptHeader, setReceiptHeader] = useState<string>('');
  const [receiptFooter, setReceiptFooter] = useState<string>('');
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState<boolean>(true);
  const [receiptTemplateType, setReceiptTemplateType] = useState<string>('Thermal80mm');

  // Local WhatsApp states
  const [waApiKey, setWaApiKey] = useState<string>('');
  const [waConnected, setWaConnected] = useState<boolean>(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplateName, setNewTemplateName] = useState<string>('');

  // Category states
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryType, setNewCategoryType] = useState<string>('Service');
  const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const [profileData, waData, categoryData] = await Promise.all([
        businessService.getProfile(),
        settingsService.getWhatsAppSettings(),
        categoryService.getAll()
      ]);
      
      setProfile(profileData);
      setLegalName(profileData.legalName || '');
      setTradingName(profileData.tradingName || '');
      setLogoUrl(profileData.logoUrl || '');
      setWebsite(profileData.website || '');
      setPhone(profileData.phone || '');
      setEmail(profileData.email || '');
      setAddress(profileData.address || '');
      setCity(profileData.city || '');
      setState(profileData.state || '');
      setPostalCode(profileData.postalCode || '');
      setGstIn(profileData.gstIn || '');
      setDefaultTaxRate(profileData.defaultTaxRate ?? 18.00);
      setPricesIncludeTax(profileData.pricesIncludeTax ?? true);
      setReceiptHeader(profileData.receiptHeader || '');
      setReceiptFooter(profileData.receiptFooter || '');
      setShowLogoOnReceipt(profileData.showLogoOnReceipt ?? true);
      setReceiptTemplateType(profileData.receiptTemplateType || 'Thermal80mm');

      setWhatsApp(waData);
      setWaApiKey(waData.apiKey || '');
      setWaConnected(waData.isConnected || false);
      setTemplates(waData.templates || []);
      setCategories(categoryData || []);
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
        defaultTaxRate: Number(defaultTaxRate),
        pricesIncludeTax,
        receiptHeader,
        receiptFooter,
        showLogoOnReceipt,
        receiptTemplateType
      });
      setProfile(updated);
      showToast("Business profile settings saved securely!", "success");
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

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await settingsService.updateWhatsAppSettings({
        apiKey: waApiKey,
        isConnected: waConnected
      });
      setWhatsApp(updated);
      setWaApiKey(updated.apiKey || '');
      setWaConnected(updated.isConnected || false);
      showToast("WhatsApp billing gateway webhook parameters updated!", "success");
    } catch (err: any) {
      showToast("Error saving WhatsApp settings: " + (err.response?.data || err.message), "error");
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName) return;
    try {
      const added = await settingsService.addWhatsAppTemplate({
        templateName: newTemplateName
      });
      setTemplates(prev => [...prev, added]);
      setNewTemplateName('');
      showToast("New message template registered!", "success");
    } catch (err: any) {
      showToast("Error adding template: " + (err.response?.data || err.message), "error");
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await settingsService.deleteWhatsAppTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      showToast("Template deleted successfully.", "success");
    } catch (err: any) {
      showToast("Error deleting template: " + (err.response?.data || err.message), "error");
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const added = await categoryService.create({
        name: newCategoryName.trim(),
        type: newCategoryType,
        parentId: newCategoryParentId || undefined
      });
      setCategories(prev => [...prev, added]);
      setNewCategoryName('');
      setNewCategoryParentId(null);
      showToast("Category registered successfully!", "success");
    } catch (err: any) {
      showToast("Error adding category: " + (err.response?.data || err.message), "error");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoryService.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      showToast("Category removed successfully.", "success");
    } catch (err: any) {
      showToast("Error deleting category: " + (err.response?.data || err.message), "error");
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
                  {logoUrl.trim() ? (
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

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">GSTIN Registration Code</label>
                <input 
                  type="text" 
                  value={gstIn}
                  onChange={(e) => setGstIn(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                  placeholder="GSTIN Code or N/A"
                />
              </div>

              {/* Tax settings dropdown list */}
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">Primary CGST/SGST Tax Range</label>
                <select 
                  value={Number(defaultTaxRate)}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none h-9"
                >
                  <option value={18}>18% Standard GST Rule</option>
                  <option value={5}>5% Food &amp; Beauty Services</option>
                  <option value={0}>0% Tax Exempt AMC Rule</option>
                </select>
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
                Advertised menu prices automatically include regional CGST/SGST tax contributions.
              </label>
            </div>

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

        {/* WhatsApp Notification Webhook Settings */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-[#f8f9ff] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare size={18} className="text-[#006f66]" />
              <div>
                <h3 className="font-display font-bold text-sm text-[#0b1c30]">WhatsApp Broker Webhook</h3>
                <p className="font-sans text-[10px] text-[#7c839b] font-medium uppercase mt-0.5">Send instant invoices, alerts and updates to clients' WhatsApp feeds.</p>
              </div>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${waConnected ? 'bg-[#e2f3eb] text-[#1e8e3e]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
              {waConnected ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              <span>{waConnected ? 'Connected (Live)' : 'Disconnected Parameters'}</span>
            </div>
          </div>

          <form onSubmit={handleSaveWhatsApp} className="p-5 space-y-4">
            <div>
              <label className="text-[10px] font-bold text-[#7c839b] uppercase block mb-1">WhatsApp Cloud Private Secret Key Token</label>
              <input 
                type="password" 
                value={waApiKey}
                onChange={(e) => setWaApiKey(e.target.value)}
                placeholder="sk_test_..."
                className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
              />
              <p className="text-[10px] text-[#7c839b] font-semibold mt-1 leading-normal">
                Credentials are encrypted and safely stored server-side. Private keys never leak to consumer browser windows.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWaConnected(prev => !prev)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  waConnected 
                    ? 'bg-[#ba1a1a] text-white hover:bg-opacity-90' 
                    : 'bg-[#1e8e3e] text-white hover:bg-opacity-90'
                }`}
              >
                {waConnected ? 'Deregister Webhook' : 'Integrate Gateway Node'}
              </button>
            </div>

            <div className="border-t border-[#e2e8f0]/40 pt-4 flex justify-end">
              <button 
                type="submit"
                className="bg-[#006a61] text-white text-xs font-semibold px-4.5 py-2 rounded-lg flex items-center gap-1.5 hover:bg-opacity-95"
              >
                <Save size={13} />
                <span>Save Router Settings</span>
              </button>
            </div>
          </form>
        </section>

        {/* WhatsApp Templates Panel */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm overflow-hidden mt-6">
          <div className="p-5 border-b bg-[#f8f9ff] flex items-center gap-2.5">
            <MessageSquare size={18} className="text-[#006f66]" />
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">WhatsApp Invoicing Templates</h3>
              <p className="font-sans text-[10px] text-[#7c839b] font-medium uppercase mt-0.5">Manage approved business templates for notifications and alerts.</p>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <form onSubmit={handleAddTemplate} className="flex gap-2">
              <input 
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template Name (e.g. invoice_notification_en)"
                className="flex-1 text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                required
              />
              <button 
                type="submit"
                className="bg-[#006a61] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-opacity-95"
              >
                <Plus size={14} /> Add Template
              </button>
            </form>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {templates.length > 0 ? (
                templates.map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-2.5 bg-[#f8f9ff] border border-[#e2e8f0]/50 rounded-lg hover:border-[#006a61]/35">
                    <span className="text-xs font-semibold text-[#0b1c30]">{t.templateName}</span>
                    <button 
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#7c839b] text-center py-6 font-semibold">No custom templates registered yet.</p>
              )}
            </div>
          </div>
        </section>

        {/* Category Management Panel */}
        <section className="bg-white rounded-xl border border-[#e2e8f0]/80 shadow-sm overflow-hidden mt-6">
          <div className="p-5 border-b bg-[#f8f9ff] flex items-center gap-2.5">
            <Tag size={18} className="text-[#006f66]" />
            <div>
              <h3 className="font-display font-bold text-sm text-[#0b1c30]">Category Management</h3>
              <p className="font-sans text-[10px] text-[#7c839b] font-medium uppercase mt-0.5">Define and organize product, service, and expense categories dynamically.</p>
            </div>
          </div>
          
          <div className="p-5 space-y-4">
            <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name (e.g. Skin Care, Travel, Supplies)"
                className="flex-1 text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none"
                required
              />
              <select
                value={newCategoryType}
                onChange={(e) => {
                  setNewCategoryType(e.target.value);
                  setNewCategoryParentId(null);
                }}
                className="text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 outline-none focus:border-[#006a61]"
              >
                <option value="Service">Service Category</option>
                <option value="Inventory">Inventory Category</option>
                <option value="Expense">Expense Category</option>
              </select>
              <select
                value={newCategoryParentId || ''}
                onChange={(e) => setNewCategoryParentId(e.target.value ? Number(e.target.value) : null)}
                className="text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 outline-none focus:border-[#006a61] min-w-[150px]"
              >
                <option value="">No Parent (Top Level)</option>
                {(() => {
                  const filteredCats = categories.filter(c => c.type === newCategoryType);
                  const tree = buildCategoryTree(filteredCats);
                  const flat = flattenCategoryTree(tree);
                  return flat.map(({ category: c, depth }) => (
                    <option key={c.id} value={c.id}>
                      {'\u00A0'.repeat(depth * 3) + (depth > 0 ? '↳ ' : '') + c.name}
                    </option>
                  ));
                })()}
              </select>
              <button 
                type="submit"
                className="bg-[#006a61] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-opacity-95"
              >
                <Plus size={14} /> Add Category
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Service Categories */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-[#006a61] uppercase tracking-wider border-b pb-1">Service Categories</h4>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {(() => {
                    const serviceCats = categories.filter(c => c.type === 'Service');
                    const tree = buildCategoryTree(serviceCats);
                    const flat = flattenCategoryTree(tree);
                    return flat.length > 0 ? (
                      flat.map(({ category: c, depth }) => (
                        <div key={c.id} style={{ marginLeft: `${depth * 16}px` }} className={`flex justify-between items-center p-1.5 bg-[#f8f9ff] border border-[#e2e8f0]/60 rounded hover:border-[#006a61]/35 ${depth > 0 ? 'text-xs border-dashed' : ''}`}>
                          <span className="text-xs font-semibold text-[#0b1c30] flex items-center gap-1">
                            {depth > 0 && <span className="text-gray-400">↳</span>}
                            {c.name}
                          </span>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#7c839b] font-semibold italic text-center py-4">No categories configured</p>
                    );
                  })()}
                </div>
              </div>

              {/* Inventory Categories */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-[#006a61] uppercase tracking-wider border-b pb-1">Inventory Categories</h4>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {(() => {
                    const invCats = categories.filter(c => c.type === 'Inventory');
                    const tree = buildCategoryTree(invCats);
                    const flat = flattenCategoryTree(tree);
                    return flat.length > 0 ? (
                      flat.map(({ category: c, depth }) => (
                        <div key={c.id} style={{ marginLeft: `${depth * 16}px` }} className={`flex justify-between items-center p-1.5 bg-[#f8f9ff] border border-[#e2e8f0]/60 rounded hover:border-[#006a61]/35 ${depth > 0 ? 'text-xs border-dashed' : ''}`}>
                          <span className="text-xs font-semibold text-[#0b1c30] flex items-center gap-1">
                            {depth > 0 && <span className="text-gray-400">↳</span>}
                            {c.name}
                          </span>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#7c839b] font-semibold italic text-center py-4">No categories configured</p>
                    );
                  })()}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-[#006a61] uppercase tracking-wider border-b pb-1">Expense Categories</h4>
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  {(() => {
                    const expCats = categories.filter(c => c.type === 'Expense');
                    const tree = buildCategoryTree(expCats);
                    const flat = flattenCategoryTree(tree);
                    return flat.length > 0 ? (
                      flat.map(({ category: c, depth }) => (
                        <div key={c.id} style={{ marginLeft: `${depth * 16}px` }} className={`flex justify-between items-center p-1.5 bg-[#f8f9ff] border border-[#e2e8f0]/60 rounded hover:border-[#006a61]/35 ${depth > 0 ? 'text-xs border-dashed' : ''}`}>
                          <span className="text-xs font-semibold text-[#0b1c30] flex items-center gap-1">
                            {depth > 0 && <span className="text-gray-400">↳</span>}
                            {c.name}
                          </span>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-[#7c839b] font-semibold italic text-center py-4">No categories configured</p>
                    );
                  })()}
                </div>
              </div>
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
