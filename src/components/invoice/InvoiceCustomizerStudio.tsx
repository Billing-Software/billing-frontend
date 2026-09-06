/**
 * Invoice Customizer Studio
 * A split-screen visual editor for customizing invoice themes, branding, and print settings.
 * Left pane: Controls (theme selector, color picker, toggles)
 * Right pane: Live real-time invoice preview
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Palette,
  Image,
  QrCode,
  Type,
  Columns3,
  FileText,
  Save,
  Eye,
  Printer,
  Upload,
  Check,
  Landmark,
  PenTool,
  Loader2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  InvoiceThemeSettings,
  DEFAULT_THEME_SETTINGS,
  BRAND_COLOR_PRESETS,
  generateInvoiceHtml,
  printInvoice,
  InvoiceBillData
} from '../../utils/invoicePrintEngine';
import { businessService } from '../../services/business.service';
import { useToast } from '../../hooks/useToast';

interface InvoiceCustomizerStudioProps {
  onSave?: (settings: InvoiceThemeSettings) => void;
  initialSettings?: Partial<InvoiceThemeSettings>;
  businessProfile?: any;
}

// Sample bill data for live preview
function getSampleBillData(profile: any): InvoiceBillData {
  return {
    billNumber: 'INV-2026-001',
    billDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    dueDate: new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    transactionType: 'Tax Invoice',
    businessName: profile?.tradingName || profile?.legalName || 'Your Business Name',
    businessAddress: profile?.address || '123 MG Road',
    businessCity: profile?.city || 'Hyderabad',
    businessState: profile?.state || 'Telangana',
    businessPostalCode: profile?.postalCode || '500001',
    businessPhone: profile?.phone || '9876543210',
    businessEmail: profile?.email || 'store@example.com',
    businessGstin: profile?.gstIn || '36AABCU9603R1ZM',
    businessStateCode: '36',
    customerName: 'Suresh Kumar',
    customerPhone: '9988776655',
    customerAddress: '45 Tank Bund Rd, Secunderabad',
    customerGstin: '36ABCDE1234F1Z5',
    customerStateCode: '36',
    items: [
      { name: 'Tata Tea Gold 500g', hsnSac: '0902', mrp: 320, qty: 5, unit: 'Pcs', rate: 295, taxPercent: 5, discountPercent: 2, amount: 1443.50, discountAmount: 29.50 },
      { name: 'Parle-G Gold 100g (Pack of 12)', hsnSac: '1905', mrp: 120, qty: 3, unit: 'Box', rate: 108, taxPercent: 18, amount: 324, batchNumber: 'BT2026A', expiryDate: '2027-03' },
      { name: 'Samsung Galaxy M15 Cover', hsnSac: '3926', qty: 1, unit: 'Pcs', rate: 499, taxPercent: 18, amount: 499 },
    ],
    subtotal: 2266.50,
    discountAmount: 29.50,
    discountLabel: '2%',
    shippingCharges: 50,
    cgstAmount: 45.25,
    sgstAmount: 45.25,
    taxAmount: 90.50,
    roundOff: -0.50,
    totalAmount: 2377,
    previousBalance: 1500,
    netDue: 3877,
    paymentMethod: 'UPI',
    status: 'Paid',
    billedBy: 'Staff - Raju',
    branchName: 'Main Branch',
    notes: 'Thank you for your purchase! Exchange within 7 days with bill.',
  };
}

const THEME_OPTIONS = [
  { id: 'modern', label: 'Modern Blue', desc: 'Clean gradient header, brand colors, tech-forward', icon: '🎨' },
  { id: 'classic', label: 'Classic GST', desc: 'Traditional double-border, formal & audit-ready', icon: '📋' },
  { id: 'minimalist', label: 'Minimalist', desc: 'Borderless, spacious, elegant typography', icon: '✨' },
  { id: 'thermal80', label: 'Thermal 80mm', desc: '3-inch POS receipt roll', icon: '🧾' },
  { id: 'thermal58', label: 'Thermal 58mm', desc: '2-inch compact receipt', icon: '📄' },
] as const;

export default function InvoiceCustomizerStudio({
  onSave,
  initialSettings,
  businessProfile
}: InvoiceCustomizerStudioProps) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<InvoiceThemeSettings>({
    ...DEFAULT_THEME_SETTINGS,
    ...initialSettings,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    theme: true,
    branding: true,
    columns: false,
    upi: false,
    bank: false,
    signature: false,
    terms: false,
  });

  const sampleBill = getSampleBillData(businessProfile);

  // Update preview whenever settings change
  useEffect(() => {
    const html = generateInvoiceHtml(sampleBill, settings, true);
    setPreviewHtml(html);
  }, [settings, businessProfile]);

  const updateSetting = <K extends keyof InvoiceThemeSettings>(key: K, value: InvoiceThemeSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateColumn = (key: keyof InvoiceThemeSettings['columns'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      columns: { ...prev.columns, [key]: value },
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to backend via business profile update
      if (onSave) {
        onSave(settings);
      }
      // Persist to localStorage as fallback
      localStorage.setItem('billcom_invoice_settings', JSON.stringify(settings));
      showToast('Invoice settings saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPrint = () => {
    printInvoice(sampleBill, settings);
  };

  // ─── Section Header Component ───────────────────────

  const SectionHeader = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-[#006a61]" />
        <span className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">{label}</span>
      </div>
      {expandedSections[id] ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
    </button>
  );

  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* ─── Left Pane: Controls ─────────────────────────── */}
      <div className="w-[340px] shrink-0 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#0b1c30]">Invoice Customizer</h3>
            <p className="text-[10px] text-gray-400 font-semibold">Design your perfect invoice</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTestPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              <Printer size={13} /> Test Print
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006a61] text-white rounded-lg text-xs font-semibold hover:bg-[#005a52] transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save
            </button>
          </div>
        </div>

        <div className="p-3 space-y-1">
          {/* ── Theme Selection ───────────────────────── */}
          <SectionHeader id="theme" label="Select Theme" icon={Palette} />
          {expandedSections.theme && (
            <div className="px-3 pb-3 space-y-2">
              {THEME_OPTIONS.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updateSetting('themeId', theme.id as any)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                    settings.themeId === theme.id
                      ? 'border-[#006a61] bg-[#006a61]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{theme.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#0b1c30]">{theme.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{theme.desc}</p>
                  </div>
                  {settings.themeId === theme.id && <Check size={16} className="text-[#006a61]" />}
                </button>
              ))}
            </div>
          )}

          {/* ── Branding & Colors ─────────────────────── */}
          <SectionHeader id="branding" label="Branding & Colors" icon={Image} />
          {expandedSections.branding && (
            <div className="px-3 pb-3 space-y-3">
              {/* Brand Color */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Brand Color</label>
                <div className="flex flex-wrap gap-2">
                  {BRAND_COLOR_PRESETS.map(color => (
                    <button
                      key={color.hex}
                      onClick={() => updateSetting('brandColor', color.hex)}
                      title={color.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        settings.brandColor === color.hex ? 'border-[#0b1c30] scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={settings.brandColor}
                    onChange={(e) => updateSetting('brandColor', e.target.value)}
                    className="w-7 h-7 rounded-full border-2 border-slate-300 cursor-pointer"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Logo URL</label>
                <input
                  type="text"
                  value={settings.logoUrl || ''}
                  onChange={(e) => updateSetting('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61] focus:ring-1 focus:ring-[#006a61]/20"
                />
              </div>

              {/* Logo Position */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Logo Position</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => updateSetting('logoPosition', pos)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize ${
                        settings.logoPosition === pos
                          ? 'border-[#006a61] bg-[#006a61]/10 text-[#006a61]'
                          : 'border-slate-200 text-gray-500 hover:border-slate-300'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoice Prefix */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={settings.invoicePrefix || ''}
                  onChange={(e) => updateSetting('invoicePrefix', e.target.value)}
                  placeholder="INV-, SI-, EST-"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61] focus:ring-1 focus:ring-[#006a61]/20"
                />
              </div>
            </div>
          )}

          {/* ── Column Toggles ────────────────────────── */}
          <SectionHeader id="columns" label="Table Columns" icon={Columns3} />
          {expandedSections.columns && (
            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
              {(Object.keys(settings.columns) as (keyof InvoiceThemeSettings['columns'])[]).map(col => (
                <label key={col} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.columns[col]}
                    onChange={(e) => updateColumn(col, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#006a61] focus:ring-[#006a61]"
                  />
                  <span className="text-[11px] font-medium text-gray-600 capitalize">
                    {col.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* ── UPI QR Code ───────────────────────────── */}
          <SectionHeader id="upi" label="UPI Payment QR Code" icon={QrCode} />
          {expandedSections.upi && (
            <div className="px-3 pb-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showUpiQr}
                  onChange={(e) => updateSetting('showUpiQr', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#006a61] focus:ring-[#006a61]"
                />
                <span className="text-xs font-semibold text-gray-600">Show UPI QR on Invoice</span>
              </label>
              {settings.showUpiQr && (
                <input
                  type="text"
                  value={settings.upiVpa || ''}
                  onChange={(e) => updateSetting('upiVpa', e.target.value)}
                  placeholder="merchant@upi or phonenumber@ybl"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61] focus:ring-1 focus:ring-[#006a61]/20"
                />
              )}
            </div>
          )}

          {/* ── Bank Details ──────────────────────────── */}
          <SectionHeader id="bank" label="Bank Account Details" icon={Landmark} />
          {expandedSections.bank && (
            <div className="px-3 pb-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showBankDetails}
                  onChange={(e) => updateSetting('showBankDetails', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#006a61] focus:ring-[#006a61]"
                />
                <span className="text-xs font-semibold text-gray-600">Show Bank Details on Invoice</span>
              </label>
              {settings.showBankDetails && (
                <>
                  <input type="text" value={settings.bankName || ''} onChange={(e) => updateSetting('bankName', e.target.value)} placeholder="Bank Name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61]" />
                  <input type="text" value={settings.bankAccountNo || ''} onChange={(e) => updateSetting('bankAccountNo', e.target.value)} placeholder="Account Number" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61]" />
                  <input type="text" value={settings.bankIfsc || ''} onChange={(e) => updateSetting('bankIfsc', e.target.value)} placeholder="IFSC Code" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61]" />
                  <input type="text" value={settings.bankBranch || ''} onChange={(e) => updateSetting('bankBranch', e.target.value)} placeholder="Branch" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61]" />
                </>
              )}
            </div>
          )}

          {/* ── Digital Signature ─────────────────────── */}
          <SectionHeader id="signature" label="Digital Signature" icon={PenTool} />
          {expandedSections.signature && (
            <div className="px-3 pb-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showDigitalSignature}
                  onChange={(e) => updateSetting('showDigitalSignature', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#006a61] focus:ring-[#006a61]"
                />
                <span className="text-xs font-semibold text-gray-600">Show Authorized Signatory</span>
              </label>
              {settings.showDigitalSignature && (
                <input
                  type="text"
                  value={settings.signatureUrl || ''}
                  onChange={(e) => updateSetting('signatureUrl', e.target.value)}
                  placeholder="URL to signature/stamp image"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61]"
                />
              )}
            </div>
          )}

          {/* ── Terms & Conditions ────────────────────── */}
          <SectionHeader id="terms" label="Terms & Conditions" icon={FileText} />
          {expandedSections.terms && (
            <div className="px-3 pb-3 space-y-2">
              <textarea
                value={settings.termsAndConditions || ''}
                onChange={(e) => updateSetting('termsAndConditions', e.target.value)}
                placeholder="E.g., Goods once sold will not be taken back. All disputes subject to Hyderabad jurisdiction."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#006a61] resize-none"
              />

              {/* Additional toggles */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showAmountInWords}
                  onChange={(e) => updateSetting('showAmountInWords', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#006a61] focus:ring-[#006a61]"
                />
                <span className="text-xs font-semibold text-gray-600">Amount in Words (Indian format)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPreviousBalance}
                  onChange={(e) => updateSetting('showPreviousBalance', e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#006a61] focus:ring-[#006a61]"
                />
                <span className="text-xs font-semibold text-gray-600">Show Previous Balance + Net Due</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right Pane: Live Preview ────────────────────── */}
      <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-[#006a61]" />
            <span className="text-xs font-bold text-[#0b1c30]">Live Preview</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
              {THEME_OPTIONS.find(t => t.id === settings.themeId)?.label}
            </span>
          </div>
          <button
            onClick={handleTestPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006a61] text-white rounded-lg text-xs font-semibold hover:bg-[#005a52] transition-colors"
          >
            <Printer size={12} />
            Print Preview
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex justify-center">
          <div
            className={`bg-white shadow-lg ${
              settings.themeId === 'thermal80'
                ? 'w-[320px]'
                : settings.themeId === 'thermal58'
                ? 'w-[240px]'
                : 'w-full max-w-[800px]'
            }`}
            style={{ minHeight: settings.themeId.startsWith('thermal') ? 'auto' : '700px' }}
          >
            <iframe
              srcDoc={previewHtml}
              title="Invoice Preview"
              className="w-full h-full border-0"
              style={{
                minHeight: settings.themeId.startsWith('thermal') ? '600px' : '900px',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
