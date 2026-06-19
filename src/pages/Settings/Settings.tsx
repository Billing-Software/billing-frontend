import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building, 
  MessageSquare, 
  Lock, 
  Save, 
  CheckCircle2, 
  XCircle,
  Activity
} from 'lucide-react';
import { BusinessProfile, WhatsAppSettings } from '../../types';

interface SettingsProps {
  profile: BusinessProfile;
  onUpdateProfile: (p: BusinessProfile) => void;
  whatsApp: WhatsAppSettings;
  onUpdateWhatsApp: (w: WhatsAppSettings) => void;
}

export default function Settings({
  profile,
  onUpdateProfile,
  whatsApp,
  onUpdateWhatsApp
}: SettingsProps) {
  // Local profile states
  const [legalName, setLegalName] = useState<string>(profile.legalName);
  const [tradingName, setTradingName] = useState<string>(profile.tradingName);
  const [address, setAddress] = useState<string>(profile.address);
  const [city, setCity] = useState<string>(profile.city);
  const [postalCode, setPostalCode] = useState<string>(profile.postalCode);
  const [gstIn, setGstIn] = useState<string>(profile.gstIn);
  const [defaultTaxRate, setDefaultTaxRate] = useState<string>(profile.defaultTaxRate);
  const [pricesIncludeTax, setPricesIncludeTax] = useState<boolean>(profile.pricesIncludeTax);

  // Local WhatsApp states
  const [waApiKey, setWaApiKey] = useState<string>(whatsApp.apiKey);
  const [waConnected, setWaConnected] = useState<boolean>(whatsApp.isConnected);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      legalName,
      tradingName,
      address,
      city,
      postalCode,
      gstIn,
      defaultTaxRate,
      pricesIncludeTax
    });
    alert("Business profile settings saved securely!");
  };

  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWhatsApp({
      apiKey: waApiKey,
      isConnected: waConnected,
      templates: whatsApp.templates
    });
    alert("WhatsApp billing gateway webhook parameters updated!");
  };

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
                  onChange={(e) => setDefaultTaxRate(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded focus:border-[#006a61] outline-none h-9"
                >
                  <option value="18% Standard">18% Standard GST Rule</option>
                  <option value="5% Reduced">5% Food &amp; Beauty Services</option>
                  <option value="0% Exempt">0% Tax Exempt AMC Rule</option>
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
