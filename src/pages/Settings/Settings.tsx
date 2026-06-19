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
  Loader2
} from 'lucide-react';
import { businessService } from '../../services/business.service';
import { settingsService } from '../../services/settings.service';
import { apiClient } from '../../services/api.client';

export default function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [whatsApp, setWhatsApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  // Local WhatsApp states
  const [waApiKey, setWaApiKey] = useState<string>('');
  const [waConnected, setWaConnected] = useState<boolean>(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [newTemplateName, setNewTemplateName] = useState<string>('');

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const [profileData, waData] = await Promise.all([
        businessService.getProfile(),
        settingsService.getWhatsAppSettings()
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

      setWhatsApp(waData);
      setWaApiKey(waData.apiKey || '');
      setWaConnected(waData.isConnected || false);
      setTemplates(waData.templates || []);
    } catch (e) {
      console.error('Error fetching settings', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
        pricesIncludeTax
      });
      setProfile(updated);
      alert("Business profile settings saved securely!");
    } catch (err: any) {
      alert("Error saving business profile: " + (err.response?.data || err.message));
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
      alert("WhatsApp billing gateway webhook parameters updated!");
    } catch (err: any) {
      alert("Error saving WhatsApp settings: " + (err.response?.data || err.message));
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
      alert("New message template registered!");
    } catch (err: any) {
      alert("Error adding template: " + (err.response?.data || err.message));
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    try {
      await settingsService.deleteWhatsAppTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      alert("Template deleted successfully.");
    } catch (err: any) {
      alert("Error deleting template: " + (err.response?.data || err.message));
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
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none h-9"
                >
                  <option value="18.0">18% Standard GST Rule</option>
                  <option value="5.0">5% Food &amp; Beauty Services</option>
                  <option value="0.0">0% Tax Exempt AMC Rule</option>
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
                <span>Save Corporate Entity Parameters</span>
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
