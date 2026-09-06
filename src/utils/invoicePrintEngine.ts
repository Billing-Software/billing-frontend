/**
 * Invoice Print Engine
 * Generates pixel-perfect, print-ready HTML for BillCom invoices across 5 themes.
 * Supports: Modern Blue, Classic GST, Minimalist, Thermal 80mm, Thermal 58mm
 */

import { numberToIndianWords, formatIndianNumber } from './numberToWords';
import { generateUpiUrl } from './upiQrGenerator';

// ─── Types ──────────────────────────────────────────────

export interface InvoiceThemeSettings {
  themeId: 'modern' | 'classic' | 'minimalist' | 'thermal80' | 'thermal58';
  brandColor: string;           // Hex color e.g. "#1E40AF"
  logoUrl?: string;             // Business logo URL
  logoPosition: 'left' | 'center' | 'right';
  showUpiQr: boolean;
  upiVpa?: string;              // Merchant UPI VPA
  showAmountInWords: boolean;
  showPreviousBalance: boolean;
  showBankDetails: boolean;
  bankName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
  showDigitalSignature: boolean;
  signatureUrl?: string;
  termsAndConditions?: string;
  invoicePrefix?: string;       // e.g. "INV-", "SI-"
  
  // Column toggles
  columns: {
    serialNo: boolean;
    itemName: boolean;
    hsnSac: boolean;
    mrp: boolean;
    batchExpiry: boolean;
    qty: boolean;
    unit: boolean;
    rate: boolean;
    discount: boolean;
    taxPercent: boolean;
    amount: boolean;
  };
}

export interface InvoiceBillData {
  billNumber: string;
  billDate: string;
  dueDate?: string;
  transactionType?: string;     // 'Sale Invoice' | 'Estimate' | 'Pro Forma' | etc.
  
  // Business info
  businessName: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessPostalCode?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessGstin?: string;
  businessStateCode?: string;
  
  // Customer info
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerStateCode?: string;
  
  // Transport details
  transportName?: string;
  vehicleNumber?: string;
  
  // Line items
  items: InvoiceLineItem[];
  
  // Totals
  subtotal: number;
  discountAmount: number;
  discountLabel?: string;
  additionalCharges?: number;
  additionalChargesLabel?: string;
  shippingCharges?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  cessAmount?: number;
  taxAmount: number;
  roundOff?: number;
  totalAmount: number;
  
  // Previous balance
  previousBalance?: number;
  netDue?: number;
  
  // Payment info
  paymentMethod: string;
  paidAmount?: number;
  balanceDue?: number;
  status: string;
  
  // Notes
  notes?: string;
  
  // Staff
  billedBy?: string;
  branchName?: string;
}

export interface InvoiceLineItem {
  serialNo?: number;
  name: string;
  hsnSac?: string;
  mrp?: number;
  batchNumber?: string;
  expiryDate?: string;
  qty: number;
  unit?: string;
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  amount: number;
}

// ─── Default Theme Settings ──────────────────────────────

export const DEFAULT_THEME_SETTINGS: InvoiceThemeSettings = {
  themeId: 'modern',
  brandColor: '#1E40AF',
  logoPosition: 'left',
  showUpiQr: false,
  showAmountInWords: true,
  showPreviousBalance: true,
  showBankDetails: false,
  showDigitalSignature: false,
  invoicePrefix: 'INV-',
  columns: {
    serialNo: true,
    itemName: true,
    hsnSac: true,
    mrp: false,
    batchExpiry: false,
    qty: true,
    unit: true,
    rate: true,
    discount: true,
    taxPercent: true,
    amount: true,
  },
};

// ─── Theme Color Presets ─────────────────────────────────

export const BRAND_COLOR_PRESETS = [
  { name: 'Navy Blue', hex: '#1E40AF' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Crimson Red', hex: '#DC2626' },
  { name: 'Royal Purple', hex: '#7C3AED' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Charcoal', hex: '#374151' },
  { name: 'Ocean Blue', hex: '#2563EB' },
  { name: 'Amber', hex: '#D97706' },
];

// ─── Main Print Function ─────────────────────────────────

export function getSavedInvoiceSettings(): InvoiceThemeSettings {
  try {
    const saved = localStorage.getItem('billcom_invoice_settings');
    if (saved) {
      return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to parse saved invoice settings', e);
  }
  return DEFAULT_THEME_SETTINGS;
}

export function printInvoice(
  bill: InvoiceBillData,
  settings: InvoiceThemeSettings
): void {
  const html = generateInvoiceHtml(bill, settings);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocked! Please allow popups for BillCom to print invoices.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Universal print bill helper: converts any raw bill entity and business profile
 * into InvoiceBillData and triggers the print spooler with active user theme settings.
 */
export function printBill(
  bill: any,
  businessProfile?: any,
  overrideSettings?: Partial<InvoiceThemeSettings>
): void {
  const settings: InvoiceThemeSettings = {
    ...getSavedInvoiceSettings(),
    ...(overrideSettings || {}),
  };

  const billData: InvoiceBillData = {
    billNumber: bill.billNumber || `INV-${Date.now().toString().slice(-6)}`,
    billDate: bill.createdAt 
      ? new Date(bill.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    dueDate: bill.dueDate 
      ? new Date(bill.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : undefined,
    transactionType: bill.transactionType || 'Tax Invoice',
    businessName: businessProfile?.tradingName || businessProfile?.legalName || bill.branchName || 'BillCom POS',
    businessAddress: businessProfile?.address,
    businessCity: businessProfile?.city,
    businessState: businessProfile?.state,
    businessPostalCode: businessProfile?.postalCode,
    businessPhone: businessProfile?.phone,
    businessEmail: businessProfile?.email,
    businessGstin: businessProfile?.gstIn,
    businessStateCode: businessProfile?.stateCode || (businessProfile?.gstIn ? businessProfile.gstIn.substring(0, 2) : undefined),
    customerName: bill.customerName || 'Walk-In Customer',
    customerPhone: bill.customerPhone !== 'N/A' ? bill.customerPhone : undefined,
    customerEmail: bill.customerEmail,
    customerAddress: bill.customerAddress,
    customerGstin: bill.customerGstin,
    customerStateCode: bill.customerStateCode,
    transportName: bill.transportName,
    vehicleNumber: bill.vehicleNumber,
    items: (bill.items || []).map((it: any, idx: number) => ({
      serialNo: idx + 1,
      name: it.serviceName || it.name || it.itemName || 'Item',
      hsnSac: it.hsnSac || it.hsnCode || '',
      mrp: it.mrp || undefined,
      batchNumber: it.batchNumber || undefined,
      expiryDate: it.expiryDate || undefined,
      qty: it.quantity || it.qty || 1,
      unit: it.unit || 'Pcs',
      rate: it.unitPrice || it.rate || 0,
      discountPercent: it.discountPercent || undefined,
      discountAmount: it.discountAmount || undefined,
      taxPercent: it.taxPercent || it.taxRate || undefined,
      amount: it.lineTotal !== undefined ? it.lineTotal : (it.amount || 0),
    })),
    subtotal: Number(bill.subtotal || 0),
    discountAmount: Number(bill.discountAmount || 0),
    discountLabel: bill.discountCode || undefined,
    additionalCharges: bill.additionalCharges ? Number(bill.additionalCharges) : undefined,
    additionalChargesLabel: bill.additionalChargesLabel,
    shippingCharges: bill.shippingCharges ? Number(bill.shippingCharges) : undefined,
    cgstAmount: bill.cgstAmount ? Number(bill.cgstAmount) : undefined,
    sgstAmount: bill.sgstAmount ? Number(bill.sgstAmount) : undefined,
    igstAmount: bill.igstAmount ? Number(bill.igstAmount) : undefined,
    cessAmount: bill.cessAmount ? Number(bill.cessAmount) : undefined,
    taxAmount: Number(bill.taxAmount || 0),
    roundOff: bill.roundOff ? Number(bill.roundOff) : undefined,
    totalAmount: Number(bill.totalAmount || 0),
    previousBalance: bill.previousBalance ? Number(bill.previousBalance) : undefined,
    netDue: bill.netDue ? Number(bill.netDue) : undefined,
    paymentMethod: bill.paymentMethod || 'Cash',
    paidAmount: bill.paidAmount !== undefined ? Number(bill.paidAmount) : undefined,
    balanceDue: bill.balanceDue !== undefined ? Number(bill.balanceDue) : undefined,
    status: bill.status || 'Paid',
    notes: bill.notes || undefined,
    billedBy: bill.staffName || bill.billedBy || 'Staff',
    branchName: bill.branchName || 'Main Branch',
  };

  printInvoice(billData, settings);
}

/**
 * Generate complete HTML document for an invoice based on theme
 */
export function generateInvoiceHtml(
  bill: InvoiceBillData,
  settings: InvoiceThemeSettings,
  isPreview: boolean = false
): string {
  switch (settings.themeId) {
    case 'thermal80':
      return generateThermal80Html(bill, settings, isPreview);
    case 'thermal58':
      return generateThermal58Html(bill, settings, isPreview);
    case 'classic':
      return generateClassicGstHtml(bill, settings, isPreview);
    case 'minimalist':
      return generateMinimalistHtml(bill, settings, isPreview);
    case 'modern':
    default:
      return generateModernHtml(bill, settings, isPreview);
  }
}

// ─── Helper: Column headers ──────────────────────────────

function getVisibleColumns(settings: InvoiceThemeSettings): { key: string; label: string; align: string }[] {
  const cols: { key: string; label: string; align: string }[] = [];
  if (settings.columns.serialNo) cols.push({ key: 'serialNo', label: '#', align: 'center' });
  if (settings.columns.itemName) cols.push({ key: 'itemName', label: 'Item / Description', align: 'left' });
  if (settings.columns.hsnSac) cols.push({ key: 'hsnSac', label: 'HSN/SAC', align: 'center' });
  if (settings.columns.mrp) cols.push({ key: 'mrp', label: 'MRP', align: 'right' });
  if (settings.columns.batchExpiry) cols.push({ key: 'batchExpiry', label: 'Batch / Expiry', align: 'center' });
  if (settings.columns.qty) cols.push({ key: 'qty', label: 'Qty', align: 'center' });
  if (settings.columns.unit) cols.push({ key: 'unit', label: 'Unit', align: 'center' });
  if (settings.columns.rate) cols.push({ key: 'rate', label: 'Rate (₹)', align: 'right' });
  if (settings.columns.discount) cols.push({ key: 'discount', label: 'Disc%', align: 'center' });
  if (settings.columns.taxPercent) cols.push({ key: 'taxPercent', label: 'GST%', align: 'center' });
  if (settings.columns.amount) cols.push({ key: 'amount', label: 'Amount (₹)', align: 'right' });
  return cols;
}

function getItemCellValue(item: InvoiceLineItem, key: string, index: number): string {
  switch (key) {
    case 'serialNo': return String(index + 1);
    case 'itemName': return item.name;
    case 'hsnSac': return item.hsnSac || '-';
    case 'mrp': return item.mrp ? `₹${item.mrp.toFixed(2)}` : '-';
    case 'batchExpiry': return [item.batchNumber, item.expiryDate].filter(Boolean).join(' / ') || '-';
    case 'qty': return String(item.qty);
    case 'unit': return item.unit || 'Pcs';
    case 'rate': return `₹${item.rate.toFixed(2)}`;
    case 'discount': return item.discountPercent ? `${item.discountPercent}%` : '-';
    case 'taxPercent': return item.taxPercent !== undefined ? `${item.taxPercent}%` : '-';
    case 'amount': return `₹${item.amount.toFixed(2)}`;
    default: return '';
  }
}

// ─── Helper: UPI QR HTML ─────────────────────────────────

function getUpiQrHtml(settings: InvoiceThemeSettings, bill: InvoiceBillData): string {
  if (!settings.showUpiQr || !settings.upiVpa) return '';
  
  const upiUrl = generateUpiUrl({
    vpa: settings.upiVpa,
    name: bill.businessName,
    amount: bill.totalAmount,
    note: `Payment for ${bill.billNumber}`,
  });

  // Use a simple API to generate QR on-the-fly for print (works offline with JS QR library, or uses API)
  return `
    <div style="text-align: center; margin-top: 12px; padding: 10px; border: 1px dashed #ccc; border-radius: 8px;">
      <p style="font-size: 10px; margin: 0 0 6px; font-weight: 600; color: #374151;">Scan to Pay via UPI</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}" 
           alt="UPI QR Code" width="120" height="120" style="display: block; margin: 0 auto;" />
      <p style="font-size: 9px; margin: 4px 0 0; color: #6B7280;">${settings.upiVpa}</p>
    </div>
  `;
}

// ─── Helper: Bank Details HTML ───────────────────────────

function getBankDetailsHtml(settings: InvoiceThemeSettings): string {
  if (!settings.showBankDetails || !settings.bankAccountNo) return '';
  return `
    <div style="margin-top: 12px; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 10px;">
      <p style="margin: 0; font-weight: 700; font-size: 11px; color: #374151; margin-bottom: 4px;">Bank Details</p>
      <p style="margin: 2px 0;">Bank: ${settings.bankName || '-'}</p>
      <p style="margin: 2px 0;">A/C No: ${settings.bankAccountNo}</p>
      <p style="margin: 2px 0;">IFSC: ${settings.bankIfsc || '-'}</p>
      ${settings.bankBranch ? `<p style="margin: 2px 0;">Branch: ${settings.bankBranch}</p>` : ''}
    </div>
  `;
}

// ─── Helper: Signature HTML ──────────────────────────────

function getSignatureHtml(settings: InvoiceThemeSettings, businessName: string): string {
  return `
    <div style="text-align: right; margin-top: 24px;">
      ${settings.showDigitalSignature && settings.signatureUrl 
        ? `<img src="${settings.signatureUrl}" alt="Signature" style="height: 48px; margin-bottom: 4px;" />`
        : '<div style="height: 40px; border-bottom: 1px solid #d1d5db; width: 160px; display: inline-block; margin-bottom: 4px;"></div>'
      }
      <p style="font-size: 10px; margin: 0; color: #374151; font-weight: 600;">Authorized Signatory</p>
      <p style="font-size: 9px; margin: 2px 0 0; color: #6B7280;">${businessName}</p>
    </div>
  `;
}

// ─── Helper: Previous Balance HTML ───────────────────────

function getPreviousBalanceHtml(settings: InvoiceThemeSettings, bill: InvoiceBillData): string {
  if (!settings.showPreviousBalance || bill.previousBalance === undefined || bill.previousBalance === 0) return '';
  const netDue = bill.totalAmount + (bill.previousBalance || 0);
  return `
    <tr>
      <td style="padding: 4px 0; border-top: 1px dashed #d1d5db; font-size: 11px;">Previous Balance</td>
      <td style="padding: 4px 0; border-top: 1px dashed #d1d5db; text-align: right; font-size: 11px;">₹${formatIndianNumber(bill.previousBalance)}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; font-weight: 800; font-size: 13px; color: #DC2626;">Net Amount Due</td>
      <td style="padding: 6px 0; text-align: right; font-weight: 800; font-size: 13px; color: #DC2626;">₹${formatIndianNumber(netDue)}</td>
    </tr>
  `;
}

// ─── Helper: Items table rows ────────────────────────────

function getItemRowsHtml(items: InvoiceLineItem[], settings: InvoiceThemeSettings, borderColor: string = '#e5e7eb'): string {
  const cols = getVisibleColumns(settings);
  return items.map((item, i) => `
    <tr style="border-bottom: 1px solid ${borderColor};">
      ${cols.map(col => `
        <td style="padding: 8px 6px; text-align: ${col.align}; font-size: 11px; color: #374151;">
          ${getItemCellValue(item, col.key, i)}
        </td>
      `).join('')}
    </tr>
  `).join('');
}

// ─── Helper: Totals section ──────────────────────────────

function getTotalsHtml(bill: InvoiceBillData, settings: InvoiceThemeSettings, color: string): string {
  let rows = '';
  
  rows += `<tr><td style="padding: 4px 0; font-size: 11px;">Subtotal</td><td style="padding: 4px 0; text-align: right; font-size: 11px;">₹${formatIndianNumber(bill.subtotal)}</td></tr>`;
  
  if (bill.discountAmount > 0) {
    rows += `<tr><td style="padding: 4px 0; font-size: 11px; color: #059669;">Discount${bill.discountLabel ? ` (${bill.discountLabel})` : ''}</td><td style="padding: 4px 0; text-align: right; font-size: 11px; color: #059669;">-₹${formatIndianNumber(bill.discountAmount)}</td></tr>`;
  }
  
  if (bill.additionalCharges && bill.additionalCharges > 0) {
    rows += `<tr><td style="padding: 4px 0; font-size: 11px;">${bill.additionalChargesLabel || 'Additional Charges'}</td><td style="padding: 4px 0; text-align: right; font-size: 11px;">₹${formatIndianNumber(bill.additionalCharges)}</td></tr>`;
  }
  
  if (bill.shippingCharges && bill.shippingCharges > 0) {
    rows += `<tr><td style="padding: 4px 0; font-size: 11px;">Shipping / Freight</td><td style="padding: 4px 0; text-align: right; font-size: 11px;">₹${formatIndianNumber(bill.shippingCharges)}</td></tr>`;
  }
  
  // Tax breakdown
  if (bill.cgstAmount && bill.cgstAmount > 0) {
    rows += `<tr><td style="padding: 3px 0; font-size: 10px; color: #6B7280;">CGST</td><td style="padding: 3px 0; text-align: right; font-size: 10px; color: #6B7280;">₹${formatIndianNumber(bill.cgstAmount)}</td></tr>`;
  }
  if (bill.sgstAmount && bill.sgstAmount > 0) {
    rows += `<tr><td style="padding: 3px 0; font-size: 10px; color: #6B7280;">SGST</td><td style="padding: 3px 0; text-align: right; font-size: 10px; color: #6B7280;">₹${formatIndianNumber(bill.sgstAmount)}</td></tr>`;
  }
  if (bill.igstAmount && bill.igstAmount > 0) {
    rows += `<tr><td style="padding: 3px 0; font-size: 10px; color: #6B7280;">IGST</td><td style="padding: 3px 0; text-align: right; font-size: 10px; color: #6B7280;">₹${formatIndianNumber(bill.igstAmount)}</td></tr>`;
  }
  if (bill.cessAmount && bill.cessAmount > 0) {
    rows += `<tr><td style="padding: 3px 0; font-size: 10px; color: #6B7280;">CESS</td><td style="padding: 3px 0; text-align: right; font-size: 10px; color: #6B7280;">₹${formatIndianNumber(bill.cessAmount)}</td></tr>`;
  }
  if (bill.taxAmount > 0 && !bill.cgstAmount && !bill.igstAmount) {
    rows += `<tr><td style="padding: 4px 0; font-size: 11px;">Tax</td><td style="padding: 4px 0; text-align: right; font-size: 11px;">₹${formatIndianNumber(bill.taxAmount)}</td></tr>`;
  }
  
  if (bill.roundOff !== undefined && bill.roundOff !== 0) {
    rows += `<tr><td style="padding: 3px 0; font-size: 10px; color: #9CA3AF;">Round Off</td><td style="padding: 3px 0; text-align: right; font-size: 10px; color: #9CA3AF;">${bill.roundOff > 0 ? '+' : ''}₹${bill.roundOff.toFixed(2)}</td></tr>`;
  }
  
  rows += `<tr style="border-top: 2px solid ${color};"><td style="padding: 8px 0; font-weight: 800; font-size: 14px; color: ${color};">Grand Total</td><td style="padding: 8px 0; text-align: right; font-weight: 800; font-size: 14px; color: ${color};">₹${formatIndianNumber(bill.totalAmount)}</td></tr>`;
  
  rows += getPreviousBalanceHtml(settings, bill);
  
  if (settings.showAmountInWords) {
    rows += `<tr><td colspan="2" style="padding: 6px 0; font-size: 10px; color: #6B7280; font-style: italic;">Amount in words: ${numberToIndianWords(bill.totalAmount)}</td></tr>`;
  }
  
  return rows;
}

// ─── Theme 1: Modern Blue ────────────────────────────────

function generateModernHtml(bill: InvoiceBillData, settings: InvoiceThemeSettings, isPreview: boolean = false): string {
  const c = settings.brandColor;
  const cols = getVisibleColumns(settings);
  const transactionLabel = bill.transactionType || 'Tax Invoice';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${bill.billNumber} - ${bill.businessName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; color: #1F2937; }
    @media print {
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      @page { margin: 12mm; size: A4; }
    }
  </style>
</head>
<body${isPreview ? '' : ' onload="window.print();"'}>
  <div style="max-width: 780px; margin: 0 auto; padding: 24px;">
    <!-- Header with brand gradient -->
    <div style="background: linear-gradient(135deg, ${c}, ${c}dd); border-radius: 12px; padding: 20px 24px; color: #fff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div>
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 48px; margin-bottom: 8px; border-radius: 6px;" />` : ''}
        <h1 style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${bill.businessName}</h1>
        ${bill.businessAddress ? `<p style="font-size: 10px; opacity: 0.9; margin-top: 2px;">${bill.businessAddress}${bill.businessCity ? `, ${bill.businessCity}` : ''}${bill.businessState ? `, ${bill.businessState}` : ''} ${bill.businessPostalCode || ''}</p>` : ''}
        ${bill.businessPhone ? `<p style="font-size: 10px; opacity: 0.85; margin-top: 2px;">Ph: ${bill.businessPhone}${bill.businessEmail ? ` | ${bill.businessEmail}` : ''}</p>` : ''}
        ${bill.businessGstin ? `<p style="font-size: 10px; opacity: 0.9; margin-top: 2px; font-weight: 600;">GSTIN: ${bill.businessGstin}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <p style="font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${transactionLabel}</p>
        <p style="font-size: 11px; opacity: 0.9; margin-top: 4px;">No: ${bill.billNumber}</p>
        <p style="font-size: 11px; opacity: 0.9;">Date: ${bill.billDate}</p>
        ${bill.dueDate ? `<p style="font-size: 11px; opacity: 0.9;">Due: ${bill.dueDate}</p>` : ''}
      </div>
    </div>

    <!-- Bill To / Ship To -->
    <div style="display: flex; gap: 24px; margin-bottom: 16px;">
      <div style="flex: 1; padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #F9FAFB;">
        <p style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: ${c}; letter-spacing: 1px; margin-bottom: 6px;">Bill To</p>
        <p style="font-size: 13px; font-weight: 700;">${bill.customerName}</p>
        ${bill.customerPhone ? `<p style="font-size: 11px; color: #6B7280; margin-top: 2px;">Ph: ${bill.customerPhone}</p>` : ''}
        ${bill.customerAddress ? `<p style="font-size: 10px; color: #6B7280; margin-top: 2px;">${bill.customerAddress}</p>` : ''}
        ${bill.customerGstin ? `<p style="font-size: 10px; color: #374151; margin-top: 2px; font-weight: 600;">GSTIN: ${bill.customerGstin}</p>` : ''}
      </div>
      ${bill.transportName || bill.vehicleNumber ? `
      <div style="flex: 1; padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: #F9FAFB;">
        <p style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: ${c}; letter-spacing: 1px; margin-bottom: 6px;">Transport Details</p>
        ${bill.transportName ? `<p style="font-size: 11px;">Transporter: ${bill.transportName}</p>` : ''}
        ${bill.vehicleNumber ? `<p style="font-size: 11px;">Vehicle No: ${bill.vehicleNumber}</p>` : ''}
      </div>` : ''}
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: ${c}15;">
          ${cols.map(col => `<th style="padding: 10px 6px; text-align: ${col.align}; font-size: 10px; text-transform: uppercase; font-weight: 700; color: ${c}; letter-spacing: 0.5px; border-bottom: 2px solid ${c}40;">${col.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${getItemRowsHtml(bill.items, settings)}
      </tbody>
    </table>

    <!-- Totals + QR + Bank + Signature -->
    <div style="display: flex; gap: 24px;">
      <div style="flex: 1;">
        ${getUpiQrHtml(settings, bill)}
        ${getBankDetailsHtml(settings)}
        ${bill.notes ? `<div style="margin-top: 12px; padding: 10px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 6px; font-size: 10px; color: #92400E;"><strong>Note:</strong> ${bill.notes}</div>` : ''}
      </div>
      <div style="width: 280px;">
        <table style="width: 100%;">
          ${getTotalsHtml(bill, settings, c)}
        </table>
        <div style="margin-top: 8px; padding: 6px 10px; background: #F3F4F6; border-radius: 6px; text-align: center;">
          <span style="font-size: 10px; font-weight: 600; color: #374151;">Payment: ${bill.paymentMethod}</span>
          <span style="font-size: 10px; margin-left: 8px; padding: 2px 8px; border-radius: 10px; background: ${bill.status === 'Paid' ? '#D1FAE5' : '#FEE2E2'}; color: ${bill.status === 'Paid' ? '#065F46' : '#991B1B'}; font-weight: 700;">${bill.status}</span>
        </div>
      </div>
    </div>

    <!-- Terms & Signature -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <div style="max-width: 55%; font-size: 9px; color: #9CA3AF; line-height: 1.5;">
        ${settings.termsAndConditions ? `<p style="font-weight: 600; color: #6B7280; margin-bottom: 4px;">Terms & Conditions:</p><p>${settings.termsAndConditions}</p>` : ''}
      </div>
      ${getSignatureHtml(settings, bill.businessName)}
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px dashed #e5e7eb;">
      <p style="font-size: 9px; color: #9CA3AF;">This is a computer-generated document. ${bill.billedBy ? `Billed by: ${bill.billedBy}` : ''}</p>
      <p style="font-size: 8px; color: #D1D5DB; margin-top: 2px;">Powered by BillCom — Smart Billing Platform</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Theme 2: Classic GST ────────────────────────────────

function generateClassicGstHtml(bill: InvoiceBillData, settings: InvoiceThemeSettings, isPreview: boolean = false): string {
  const c = settings.brandColor;
  const cols = getVisibleColumns(settings);
  const transactionLabel = bill.transactionType || 'Tax Invoice';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${bill.billNumber} - ${bill.businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; color: #000; }
    @media print { body { margin: 0; } @page { margin: 10mm; size: A4; } }
  </style>
</head>
<body${isPreview ? '' : ' onload="window.print();"'}>
  <div style="max-width: 780px; margin: 0 auto; padding: 16px; border: 2px solid #000;">
    <!-- Double border header -->
    <div style="border: 1px solid #000; padding: 12px; text-align: center; margin-bottom: 12px;">
      ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 40px; margin-bottom: 4px;" />` : ''}
      <h1 style="font-size: 20px; font-weight: bold; text-transform: uppercase;">${bill.businessName}</h1>
      ${bill.businessAddress ? `<p style="font-size: 11px;">${bill.businessAddress}${bill.businessCity ? `, ${bill.businessCity}` : ''}${bill.businessState ? `, ${bill.businessState}` : ''} ${bill.businessPostalCode || ''}</p>` : ''}
      ${bill.businessGstin ? `<p style="font-size: 11px; font-weight: bold; margin-top: 2px;">GSTIN: ${bill.businessGstin} | State Code: ${bill.businessStateCode || ''}</p>` : ''}
      ${bill.businessPhone ? `<p style="font-size: 10px;">Ph: ${bill.businessPhone}${bill.businessEmail ? ` | Email: ${bill.businessEmail}` : ''}</p>` : ''}
    </div>

    <div style="text-align: center; padding: 4px; border: 1px solid #000; font-weight: bold; font-size: 14px; text-transform: uppercase; margin-bottom: 8px;">${transactionLabel}</div>

    <!-- Invoice details + Customer -->
    <div style="display: flex; border: 1px solid #000; margin-bottom: 8px; font-size: 11px;">
      <div style="flex: 1; padding: 8px; border-right: 1px solid #000;">
        <p><strong>Invoice No:</strong> ${bill.billNumber}</p>
        <p><strong>Date:</strong> ${bill.billDate}</p>
        ${bill.dueDate ? `<p><strong>Due Date:</strong> ${bill.dueDate}</p>` : ''}
        ${bill.transportName ? `<p><strong>Transport:</strong> ${bill.transportName}</p>` : ''}
        ${bill.vehicleNumber ? `<p><strong>Vehicle No:</strong> ${bill.vehicleNumber}</p>` : ''}
      </div>
      <div style="flex: 1; padding: 8px;">
        <p><strong>Bill To:</strong></p>
        <p style="font-weight: bold;">${bill.customerName}</p>
        ${bill.customerAddress ? `<p>${bill.customerAddress}</p>` : ''}
        ${bill.customerPhone ? `<p>Ph: ${bill.customerPhone}</p>` : ''}
        ${bill.customerGstin ? `<p><strong>GSTIN:</strong> ${bill.customerGstin}</p>` : ''}
      </div>
    </div>

    <!-- Items Table with solid borders -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
      <thead>
        <tr>
          ${cols.map(col => `<th style="padding: 6px 4px; text-align: ${col.align}; font-size: 10px; border: 1px solid #000; background: #f0f0f0; font-weight: bold;">${col.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${bill.items.map((item, i) => `
          <tr>
            ${cols.map(col => `<td style="padding: 5px 4px; text-align: ${col.align}; font-size: 11px; border: 1px solid #000;">${getItemCellValue(item, col.key, i)}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals in classic box -->
    <div style="display: flex; gap: 0;">
      <div style="flex: 1; padding: 8px;">
        ${getUpiQrHtml(settings, bill)}
        ${getBankDetailsHtml(settings)}
      </div>
      <div style="width: 260px; border: 1px solid #000;">
        <table style="width: 100%; font-size: 11px;">
          ${getTotalsHtml(bill, settings, '#000')}
        </table>
      </div>
    </div>

    <!-- Terms + Signature -->
    <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 1px solid #000;">
      <div style="max-width: 55%; font-size: 9px; line-height: 1.4;">
        ${settings.termsAndConditions ? `<p style="font-weight: bold; margin-bottom: 3px;">Terms & Conditions:</p><p>${settings.termsAndConditions}</p>` : ''}
        ${bill.notes ? `<p style="margin-top: 6px;"><strong>Note:</strong> ${bill.notes}</p>` : ''}
      </div>
      ${getSignatureHtml(settings, bill.businessName)}
    </div>

    <div style="text-align: center; margin-top: 12px; font-size: 9px; color: #666;">
      <p>This is a computer-generated invoice. ${bill.billedBy ? `Billed by: ${bill.billedBy}` : ''}</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Theme 3: Minimalist Clean ───────────────────────────

function generateMinimalistHtml(bill: InvoiceBillData, settings: InvoiceThemeSettings, isPreview: boolean = false): string {
  const c = settings.brandColor;
  const cols = getVisibleColumns(settings);
  const transactionLabel = bill.transactionType || 'Invoice';
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${bill.billNumber} - ${bill.businessName}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; color: #111827; }
    @media print { body { margin: 0; } @page { margin: 16mm; size: A4; } }
  </style>
</head>
<body${isPreview ? '' : ' onload="window.print();"'}>
  <div style="max-width: 720px; margin: 0 auto; padding: 32px;">
    <!-- Clean header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
      <div>
        ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 44px; margin-bottom: 10px;" />` : ''}
        <h1 style="font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">${bill.businessName}</h1>
        ${bill.businessAddress ? `<p style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">${bill.businessAddress}${bill.businessCity ? `, ${bill.businessCity}` : ''}</p>` : ''}
        ${bill.businessGstin ? `<p style="font-size: 10px; color: #6B7280; margin-top: 2px;">GSTIN: ${bill.businessGstin}</p>` : ''}
      </div>
      <div style="text-align: right;">
        <p style="font-size: 28px; font-weight: 300; color: #D1D5DB; text-transform: uppercase; letter-spacing: 3px;">${transactionLabel}</p>
        <p style="font-size: 12px; color: #6B7280; margin-top: 8px;">${bill.billNumber}</p>
        <p style="font-size: 12px; color: #9CA3AF;">${bill.billDate}</p>
      </div>
    </div>

    <!-- Customer -->
    <div style="margin-bottom: 28px;">
      <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #D1D5DB; font-weight: 600; margin-bottom: 8px;">Billed To</p>
      <p style="font-size: 15px; font-weight: 600;">${bill.customerName}</p>
      ${bill.customerPhone ? `<p style="font-size: 11px; color: #9CA3AF;">${bill.customerPhone}</p>` : ''}
      ${bill.customerGstin ? `<p style="font-size: 10px; color: #6B7280; margin-top: 2px;">GSTIN: ${bill.customerGstin}</p>` : ''}
    </div>

    <!-- Items Table (borderless, clean) -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="border-bottom: 2px solid #111827;">
          ${cols.map(col => `<th style="padding: 10px 6px; text-align: ${col.align}; font-size: 10px; text-transform: uppercase; font-weight: 600; color: #6B7280; letter-spacing: 0.5px;">${col.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${getItemRowsHtml(bill.items, settings, '#F3F4F6')}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end;">
      <div style="width: 260px;">
        <table style="width: 100%;">
          ${getTotalsHtml(bill, settings, c)}
        </table>
      </div>
    </div>

    <!-- Bottom section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px;">
      <div>
        ${getUpiQrHtml(settings, bill)}
        ${getBankDetailsHtml(settings)}
        ${bill.notes ? `<p style="font-size: 10px; color: #9CA3AF; margin-top: 12px;">${bill.notes}</p>` : ''}
        ${settings.termsAndConditions ? `<p style="font-size: 9px; color: #D1D5DB; margin-top: 8px; max-width: 340px; line-height: 1.4;">${settings.termsAndConditions}</p>` : ''}
      </div>
      ${getSignatureHtml(settings, bill.businessName)}
    </div>

    <div style="text-align: center; margin-top: 32px;">
      <p style="font-size: 8px; color: #E5E7EB; letter-spacing: 1px;">POWERED BY BILLCOM</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Theme 4: Thermal 80mm (3-inch) ─────────────────────

function generateThermal80Html(bill: InvoiceBillData, settings: InvoiceThemeSettings, isPreview: boolean = false): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${bill.billNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; color: #000; font-size: 11px; }
    @media print { body { margin: 0; } @page { margin: 2mm; size: 80mm auto; } }
  </style>
</head>
<body${isPreview ? '' : ' onload="window.print();"'}>
  <div style="max-width: 76mm; margin: 0 auto; padding: 4mm;">
    <!-- Store Header -->
    <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
      ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="Logo" style="height: 36px; margin-bottom: 4px;" />` : ''}
      <p style="font-size: 14px; font-weight: bold;">${bill.businessName}</p>
      ${bill.businessAddress ? `<p style="font-size: 9px;">${bill.businessAddress}${bill.businessCity ? `, ${bill.businessCity}` : ''}</p>` : ''}
      ${bill.businessPhone ? `<p style="font-size: 9px;">Ph: ${bill.businessPhone}</p>` : ''}
      ${bill.businessGstin ? `<p style="font-size: 9px;">GSTIN: ${bill.businessGstin}</p>` : ''}
    </div>

    <!-- Bill Info -->
    <div style="font-size: 10px; margin-bottom: 6px;">
      <div style="display: flex; justify-content: space-between;"><span>Bill: ${bill.billNumber}</span><span>${bill.billDate}</span></div>
      <div>Customer: ${bill.customerName}${bill.customerPhone ? ` (${bill.customerPhone})` : ''}</div>
      ${bill.billedBy ? `<div>Billed by: ${bill.billedBy}</div>` : ''}
    </div>

    <!-- Items -->
    <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-bottom: 4px;">
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; padding-bottom: 3px; border-bottom: 1px dashed #000;">
        <span style="flex: 1;">Item</span>
        <span style="width: 30px; text-align: center;">Qty</span>
        <span style="width: 50px; text-align: right;">Rate</span>
        <span style="width: 55px; text-align: right;">Amt</span>
      </div>
      ${bill.items.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px;">
          <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</span>
          <span style="width: 30px; text-align: center;">${item.qty}</span>
          <span style="width: 50px; text-align: right;">₹${item.rate.toFixed(0)}</span>
          <span style="width: 55px; text-align: right;">₹${item.amount.toFixed(2)}</span>
        </div>
      `).join('')}
    </div>

    <!-- Totals -->
    <div style="font-size: 10px; margin-bottom: 4px;">
      <div style="display: flex; justify-content: space-between;"><span>Subtotal</span><span>₹${bill.subtotal.toFixed(2)}</span></div>
      ${bill.discountAmount > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Discount</span><span>-₹${bill.discountAmount.toFixed(2)}</span></div>` : ''}
      ${bill.taxAmount > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Tax</span><span>₹${bill.taxAmount.toFixed(2)}</span></div>` : ''}
      ${bill.roundOff !== undefined && bill.roundOff !== 0 ? `<div style="display: flex; justify-content: space-between;"><span>Round Off</span><span>${bill.roundOff > 0 ? '+' : ''}₹${bill.roundOff.toFixed(2)}</span></div>` : ''}
    </div>

    <div style="border-top: 1px solid #000; padding-top: 4px; display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 6px;">
      <span>TOTAL</span><span>₹${bill.totalAmount.toFixed(2)}</span>
    </div>

    ${settings.showPreviousBalance && bill.previousBalance ? `
    <div style="font-size: 10px; border-top: 1px dashed #000; padding-top: 4px; margin-bottom: 4px;">
      <div style="display: flex; justify-content: space-between;"><span>Previous Dues</span><span>₹${bill.previousBalance.toFixed(2)}</span></div>
      <div style="display: flex; justify-content: space-between; font-weight: bold;"><span>Net Due</span><span>₹${(bill.totalAmount + bill.previousBalance).toFixed(2)}</span></div>
    </div>
    ` : ''}

    <div style="text-align: center; font-size: 10px; margin-bottom: 6px;">
      <p>Payment: <strong>${bill.paymentMethod}</strong> | Status: <strong>${bill.status}</strong></p>
    </div>

    ${settings.showAmountInWords ? `<p style="font-size: 9px; font-style: italic; margin-bottom: 6px;">${numberToIndianWords(bill.totalAmount)}</p>` : ''}

    <!-- UPI QR for thermal -->
    ${getUpiQrHtml(settings, bill)}

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px;">
      <p style="font-size: 10px; font-weight: bold;">Thank You! Visit Again!</p>
      <p style="font-size: 8px; color: #888; margin-top: 4px;">Powered by BillCom</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Theme 5: Thermal 58mm (2-inch) ─────────────────────

function generateThermal58Html(bill: InvoiceBillData, settings: InvoiceThemeSettings, isPreview: boolean = false): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${bill.billNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; color: #000; font-size: 9px; }
    @media print { body { margin: 0; } @page { margin: 1mm; size: 58mm auto; } }
  </style>
</head>
<body${isPreview ? '' : ' onload="window.print();"'}>
  <div style="max-width: 54mm; margin: 0 auto; padding: 2mm;">
    <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px;">
      <p style="font-size: 12px; font-weight: bold;">${bill.businessName}</p>
      ${bill.businessPhone ? `<p style="font-size: 8px;">Ph: ${bill.businessPhone}</p>` : ''}
    </div>

    <div style="font-size: 8px; margin-bottom: 4px;">
      <div>${bill.billNumber} | ${bill.billDate}</div>
      <div>${bill.customerName}</div>
    </div>

    <div style="border-top: 1px dashed #000; padding-top: 2px; margin-bottom: 2px;">
      ${bill.items.map(item => `
        <div style="padding: 2px 0; font-size: 9px;">
          <div>${item.name}</div>
          <div style="display: flex; justify-content: space-between;">
            <span>${item.qty} x ₹${item.rate.toFixed(0)}</span>
            <span>₹${item.amount.toFixed(2)}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="border-top: 1px solid #000; padding-top: 3px; margin-top: 2px;">
      ${bill.discountAmount > 0 ? `<div style="display: flex; justify-content: space-between; font-size: 8px;"><span>Disc</span><span>-₹${bill.discountAmount.toFixed(2)}</span></div>` : ''}
      ${bill.taxAmount > 0 ? `<div style="display: flex; justify-content: space-between; font-size: 8px;"><span>Tax</span><span>₹${bill.taxAmount.toFixed(2)}</span></div>` : ''}
      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; border-top: 1px solid #000; padding-top: 3px; margin-top: 2px;">
        <span>TOTAL</span><span>₹${bill.totalAmount.toFixed(2)}</span>
      </div>
    </div>

    <div style="text-align: center; font-size: 8px; margin-top: 4px;">
      <p>${bill.paymentMethod} | ${bill.status}</p>
    </div>

    <div style="text-align: center; border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px;">
      <p style="font-size: 9px; font-weight: bold;">Thank You!</p>
      <p style="font-size: 7px; color: #888;">BillCom</p>
    </div>
  </div>
</body>
</html>`;
}
