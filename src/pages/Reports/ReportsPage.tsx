import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Calendar, 
  DollarSign, 
  FileText, 
  Percent, 
  Building2, 
  TrendingUp, 
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Loader2,
  PieChart,
  Tag
} from 'lucide-react';
import { reportService, GstReportSummary } from '../../services/report.service';
import { useToast } from '../../hooks/useToast';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

export default function ReportsPage() {
  const { showToast } = useToast();
  const { config, t } = useBusinessConfig();

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [activeTab, setActiveTab] = useState<'slabs' | 'hsn' | 'daily' | 'payment'>('slabs');

  const [report, setReport] = useState<GstReportSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await reportService.getGstReport({
        month: selectedMonth,
        year: selectedYear,
      });
      setReport(data);
    } catch (err: any) {
      console.error("Failed to load GST report:", err);
      showToast("Error loading GST report: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await reportService.downloadGstCsv({
        month: selectedMonth,
        year: selectedYear,
      });
      showToast("GST Report CSV exported successfully!", "success");
    } catch (err: any) {
      showToast("Export failed: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (!report) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Please allow popups to print report document.', 'warning');
      return;
    }

    const monthName = months.find(m => m.value === selectedMonth)?.label || 'August';
    const periodStr = `${monthName} ${selectedYear}`;
    const businessName = config?.businessName || 'SmartBill Pro Merchant';
    const gstIn = report.gstIn || config?.gstIn || 'Unregistered / Non-GST';
    const gstScheme = config?.gstScheme || 'Regular';

    const slabsHtml = (report.taxSlabs && report.taxSlabs.length > 0)
      ? report.taxSlabs.map(s => `
        <tr>
          <td><strong>${s.taxRate}% GST</strong></td>
          <td>${s.lineItemsCount ?? 0} items</td>
          <td style="text-align: right;">₹${(s.taxableValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;">₹${(s.cgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;">₹${(s.sgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;">₹${(s.igstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: bold; color: #006a61;">₹${(s.totalTaxAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')
      : `<tr><td colSpan="7" style="text-align: center; color: #94a3b8; padding: 12px;">No GST slab transactions recorded for this period.</td></tr>`;

    const hsnHtml = (report.hsnSacBreakdown && report.hsnSacBreakdown.length > 0)
      ? report.hsnSacBreakdown.map(h => `
        <tr>
          <td style="font-family: monospace; font-weight: bold; color: #006a61;">${h.hsnSacCode}</td>
          <td>${h.description}</td>
          <td><span style="font-size: 9px; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: bold;">${h.type}</span></td>
          <td style="text-align: right;">${h.totalQuantity ?? 0}</td>
          <td style="text-align: right;">₹${(h.taxableValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;">₹${(h.cgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;">₹${(h.sgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: bold; color: #006a61;">₹${(h.totalTaxAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')
      : `<tr><td colSpan="8" style="text-align: center; color: #94a3b8; padding: 12px;">No HSN/SAC code breakdown recorded for this period.</td></tr>`;

    const dailyHtml = (report.dailyTrends && report.dailyTrends.length > 0)
      ? report.dailyTrends.map(d => `
        <tr>
          <td style="font-family: monospace; font-weight: bold;">${d.date}</td>
          <td>${d.billsCount ?? 0} bills</td>
          <td style="text-align: right;">₹${(d.taxableValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; color: #16a34a; font-weight: bold;">₹${(d.gstCollected ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: bold;">₹${(d.totalSales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')
      : `<tr><td colSpan="5" style="text-align: center; color: #94a3b8; padding: 12px;">No daily sales records found for this period.</td></tr>`;

    const paymentHtml = Object.entries(report.paymentMethodDistribution || {}).map(([mode, amount]) => `
      <div style="border: 1px solid #e2e8f0; background: #f8fafc; padding: 8px 12px; border-radius: 6px;">
        <div style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">${mode}</div>
        <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">₹${(Number(amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>GST Report - ${businessName} - ${periodStr}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #006a61;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .business-title {
            font-size: 20px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .report-subtitle {
            font-size: 12px;
            font-weight: 700;
            color: #006a61;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 2px;
          }
          .meta-info {
            text-align: right;
            font-size: 10px;
            color: #475569;
            line-height: 1.4;
          }
          .badge {
            display: inline-block;
            background: #ccfbf1;
            color: #0f766e;
            font-size: 9px;
            font-weight: 800;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-card {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            padding: 10px;
            border-radius: 6px;
          }
          .kpi-card.highlight {
            background: #f0fdf4;
            border-color: #86efac;
          }
          .kpi-label {
            font-size: 9px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
          }
          .kpi-value {
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 4px;
          }
          .kpi-sub {
            font-size: 9px;
            color: #16a34a;
            font-weight: 600;
            margin-top: 2px;
          }
          .b2b-box {
            border: 1px solid #cbd5e1;
            background: #1e293b;
            color: #ffffff;
            padding: 12px 16px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .b2b-col { font-size: 11px; }
          .b2b-col strong { font-size: 14px; color: #38bdf8; }
          .section-heading {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin-top: 16px;
            margin-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
            font-size: 10px;
            text-align: left;
          }
          th {
            background-color: #f1f5f9;
            font-weight: 800;
            color: #334155;
            text-transform: uppercase;
          }
          tr:nth-child(even) { background-color: #f8fafc; }
          .payment-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .signature-area {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 35px;
            padding-top: 16px;
            border-top: 1px solid #cbd5e1;
          }
          .sig-box {
            text-align: center;
            width: 180px;
          }
          .sig-line {
            border-top: 1px solid #0f172a;
            margin-top: 35px;
            padding-top: 4px;
            font-size: 10px;
            font-weight: 700;
            color: #334155;
          }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <div class="header">
          <div>
            <span class="badge">${gstScheme} Scheme</span>
            <div class="business-title">${businessName}</div>
            <div class="report-subtitle">MONTHLY GST TAX & FINANCIAL REPORT</div>
          </div>
          <div class="meta-info">
            <div><strong>Tax Period:</strong> ${periodStr}</div>
            <div><strong>GSTIN:</strong> ${gstIn}</div>
            <div><strong>Report Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>

        <!-- KPI Metrics Summary Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Total Taxable Value</div>
            <div class="kpi-value">₹${(report.totalTaxableValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-sub" style="color: #64748b;">${report.totalBillsCount ?? 0} Invoices</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">CGST + SGST (Intra-State)</div>
            <div class="kpi-value">₹${((report.totalCGST ?? 0) + (report.totalSGST ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-sub">CGST: ₹${(report.totalCGST ?? 0).toLocaleString()} • SGST: ₹${(report.totalSGST ?? 0).toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">IGST (Inter-State)</div>
            <div class="kpi-value">₹${(report.totalIGST ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-sub" style="color: #64748b;">Inter-state tax</div>
          </div>
          <div class="kpi-card highlight">
            <div class="kpi-label" style="color: #15803d;">Total GST Collected</div>
            <div class="kpi-value" style="color: #15803d;">₹${(report.totalGSTCollected ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="kpi-sub" style="color: #166534;">Grand Revenue: ₹${(report.totalGrandSales ?? 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <!-- B2B vs B2C Liability Classification Box -->
        <div class="b2b-box">
          <div class="b2b-col">
            <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">B2B Registered Sales</div>
            <strong>₹${(report.b2bTaxableValue ?? 0).toLocaleString()}</strong>
            <div style="font-size: 9px; color: #cbd5e1;">${report.b2bBillsCount ?? 0} Invoices | Tax: ₹${(report.b2bGstCollected ?? 0).toLocaleString()}</div>
          </div>
          <div class="b2b-col" style="text-align: right;">
            <div style="font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">B2C Retail Sales</div>
            <strong style="color: #f1f5f9;">₹${(report.b2cTaxableValue ?? 0).toLocaleString()}</strong>
            <div style="font-size: 9px; color: #cbd5e1;">${report.b2cBillsCount ?? 0} Bills | Tax: ₹${(report.b2cGstCollected ?? 0).toLocaleString()}</div>
          </div>
        </div>

        <!-- Section 1: GST Slab Rate Breakdown -->
        <div class="section-heading">1. GST Tax Rate Slab Distribution</div>
        <table>
          <thead>
            <tr>
              <th>GST Rate</th>
              <th>Items Count</th>
              <th style="text-align: right;">Taxable Value (₹)</th>
              <th style="text-align: right;">CGST (₹)</th>
              <th style="text-align: right;">SGST (₹)</th>
              <th style="text-align: right;">IGST (₹)</th>
              <th style="text-align: right;">Total Tax (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${slabsHtml}
          </tbody>
        </table>

        <!-- Section 2: HSN / SAC Code Summary -->
        <div class="section-heading">2. HSN & SAC Code Summary Report</div>
        <table>
          <thead>
            <tr>
              <th>HSN / SAC Code</th>
              <th>Description</th>
              <th>Type</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Taxable Value (₹)</th>
              <th style="text-align: right;">CGST (₹)</th>
              <th style="text-align: right;">SGST (₹)</th>
              <th style="text-align: right;">Total Tax (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${hsnHtml}
          </tbody>
        </table>

        <!-- Section 3: Daily Sales & Tax Collection Trend -->
        <div class="section-heading">3. Daily Sales & Tax Collection Trend</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Bills Count</th>
              <th style="text-align: right;">Taxable Value (₹)</th>
              <th style="text-align: right;">GST Collected (₹)</th>
              <th style="text-align: right;">Grand Revenue (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${dailyHtml}
          </tbody>
        </table>

        <!-- Section 4: Payment Settlements -->
        <div class="section-heading">4. Payment Settlements & Channel Distribution</div>
        <div class="payment-grid">
          ${paymentHtml}
        </div>

        <!-- Authorized Signature & Declaration -->
        <div class="signature-area">
          <div style="font-size: 9px; color: #64748b; max-width: 320px;">
            <strong>Declaration:</strong> Certified that the sales transactions and GST tax collections detailed above represent authentic tax records for the selected accounting period.
          </div>
          <div class="sig-box">
            <div class="sig-line">Authorized Signatory / Stamp</div>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-extrabold text-2xl text-slate-900">GST Financial & Tax Reports</h1>
            <span className="bg-[#006a61]/10 text-[#006a61] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              {config?.gstScheme || 'Regular'} Scheme
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Detailed monthly GST tax collection, slab breakdown, HSN/SAC summary, and B2B vs B2C reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
            <Calendar size={14} className="text-[#006a61]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent outline-none font-bold cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent outline-none font-bold cursor-pointer border-l border-slate-300 pl-1"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          <button
            onClick={fetchReport}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition-all"
            title="Refresh Report Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#006a61]' : ''} />
          </button>

          {/* Download CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={exporting || loading}
            className="px-4 py-2 bg-[#006a61] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Export CSV</span>
          </button>

          {/* Print / Download PDF */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <Loader2 className="animate-spin text-[#006a61]" size={36} />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Compiling GST Tax Records...</p>
        </div>
      ) : report ? (
        <>
          {/* Key GST KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Taxable Value</span>
                <DollarSign size={16} className="text-[#006a61]" />
              </div>
              <div className="text-2xl font-black text-slate-900">₹{(report.totalTaxableValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-[11px] text-slate-500 font-medium">From {report.totalBillsCount ?? 0} total {t('invoice', true).toLowerCase()}</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">CGST + SGST (Intra-State)</span>
                <Percent size={16} className="text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">₹{((report.totalCGST ?? 0) + (report.totalSGST ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-2">
                <span>CGST: ₹{(report.totalCGST ?? 0).toLocaleString()}</span>
                <span>•</span>
                <span>SGST: ₹{(report.totalSGST ?? 0).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1">
              <div className="flex justify-between items-center text-slate-400">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">IGST (Inter-State)</span>
                <TrendingUp size={16} className="text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">₹{(report.totalIGST ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-[11px] text-slate-500 font-medium">Inter-state GST tax collection</div>
            </div>

            <div className="bg-emerald-900 text-white p-5 rounded-2xl border border-emerald-800 shadow-md space-y-1">
              <div className="flex justify-between items-center text-emerald-300">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Total GST Tax Collected</span>
                <CheckCircle2 size={16} className="text-emerald-300" />
              </div>
              <div className="text-2xl font-black text-white">₹{(report.totalGSTCollected ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-[11px] text-emerald-200 font-medium">Grand Sales: ₹{(report.totalGrandSales ?? 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* B2B vs B2C Tax Split Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                Tax Liability Classification
              </span>
              <h3 className="font-display font-extrabold text-lg">B2B Registered vs B2C Retail Sales</h3>
              <p className="text-xs text-slate-300 font-medium">
                GSTIN: <span className="font-mono font-bold text-white">{report.gstIn || 'N/A'}</span> | Period: <span className="font-bold text-white">{report.periodLabel || 'Current'}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-6">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">B2B Registered Sales</div>
                <div className="text-lg font-black text-white">₹{(report.b2bTaxableValue ?? 0).toLocaleString()}</div>
                <div className="text-[11px] text-emerald-400 font-semibold">{report.b2bBillsCount ?? 0} Invoices | GST: ₹{(report.b2bGstCollected ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">B2C Retail Sales</div>
                <div className="text-lg font-black text-white">₹{(report.b2cTaxableValue ?? 0).toLocaleString()}</div>
                <div className="text-[11px] text-slate-300 font-semibold">{report.b2cBillsCount ?? 0} Bills | GST: ₹{(report.b2cGstCollected ?? 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Interactive Report View Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/70 p-2 flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('slabs')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'slabs' ? 'bg-white text-[#006a61] shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent size={14} />
                <span>GST Slab-Wise Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('hsn')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'hsn' ? 'bg-white text-[#006a61] shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag size={14} />
                <span>HSN / SAC Summary</span>
              </button>

              <button
                onClick={() => setActiveTab('daily')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'daily' ? 'bg-white text-[#006a61] shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp size={14} />
                <span>Daily Sales & GST Trend</span>
              </button>

              <button
                onClick={() => setActiveTab('payment')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'payment' ? 'bg-white text-[#006a61] shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard size={14} />
                <span>Payment Mode Split</span>
              </button>
            </div>

            <div className="p-6">
              {/* Tab 1: Slab-Wise Breakdown */}
              {activeTab === 'slabs' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-extrabold text-base text-slate-900">GST Slab Rate Distribution</h3>
                    <span className="text-xs text-slate-500 font-medium">Summarized across 5%, 12%, 18%, 28%, and Exempt 0% tax slabs</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                          <th className="py-3 px-4">GST Rate</th>
                          <th className="py-3 px-4">Items Count</th>
                          <th className="py-3 px-4 text-right">Taxable Value (₹)</th>
                          <th className="py-3 px-4 text-right">CGST (₹)</th>
                          <th className="py-3 px-4 text-right">SGST (₹)</th>
                          <th className="py-3 px-4 text-right">IGST (₹)</th>
                          <th className="py-3 px-4 text-right font-black text-slate-800">Total Tax (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {(!report?.taxSlabs || report.taxSlabs.length === 0) ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-slate-400">No GST transactions found for this period.</td>
                          </tr>
                        ) : (
                          report.taxSlabs.map((s) => (
                            <tr key={s.taxRate} className="hover:bg-slate-50/80 transition-all">
                              <td className="py-3.5 px-4 font-extrabold text-slate-900 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#006a61]"></span>
                                {s.taxRate}% GST
                              </td>
                              <td className="py-3.5 px-4 text-slate-500 font-mono">{s.lineItemsCount ?? 0} items</td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold">₹{(s.taxableValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono text-slate-600">₹{(s.cgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono text-slate-600">₹{(s.sgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono text-indigo-600">₹{(s.igstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono font-extrabold text-[#006a61]">₹{(s.totalTaxAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: HSN / SAC Summary */}
              {activeTab === 'hsn' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-extrabold text-base text-slate-900">HSN & SAC Code Summary Report</h3>
                    <span className="text-xs text-slate-500 font-medium">Official GST return format for HSN summary reporting</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                          <th className="py-3 px-4">HSN / SAC</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4 text-right">Total Qty</th>
                          <th className="py-3 px-4 text-right">Taxable Value (₹)</th>
                          <th className="py-3 px-4 text-right">CGST (₹)</th>
                          <th className="py-3 px-4 text-right">SGST (₹)</th>
                          <th className="py-3 px-4 text-right font-black text-slate-800">Total Tax (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {(!report?.hsnSacBreakdown || report.hsnSacBreakdown.length === 0) ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">No HSN / SAC codes recorded for this period.</td>
                          </tr>
                        ) : (
                          report.hsnSacBreakdown.map((h) => (
                            <tr key={h.hsnSacCode} className="hover:bg-slate-50/80 transition-all">
                              <td className="py-3.5 px-4 font-mono font-black text-[#006a61]">{h.hsnSacCode}</td>
                              <td className="py-3.5 px-4 max-w-xs truncate text-slate-800 font-bold">{h.description}</td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  h.type === 'Services' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {h.type}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-mono">{h.totalQuantity ?? 0}</td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold">₹{(h.taxableValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono text-slate-600">₹{(h.cgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono text-slate-600">₹{(h.sgstAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono font-extrabold text-[#006a61]">₹{(h.totalTaxAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Daily Trends */}
              {activeTab === 'daily' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-extrabold text-base text-slate-900">Daily Sales & GST Trend</h3>
                    <span className="text-xs text-slate-500 font-medium">Chronological breakdown of sales and tax collected per day</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Bills Issued</th>
                          <th className="py-3 px-4 text-right">Taxable Value (₹)</th>
                          <th className="py-3 px-4 text-right">GST Collected (₹)</th>
                          <th className="py-3 px-4 text-right font-black text-slate-800">Total Sales (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                        {(!report?.dailyTrends || report.dailyTrends.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400">No daily transactions found for this period.</td>
                          </tr>
                        ) : (
                          report.dailyTrends.map((d) => (
                            <tr key={d.date} className="hover:bg-slate-50/80 transition-all">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{d.date}</td>
                              <td className="py-3.5 px-4 font-mono">{d.billsCount ?? 0} bills</td>
                              <td className="py-3.5 px-4 text-right font-mono font-bold">₹{(d.taxableValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">₹{(d.gstCollected ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">₹{(d.totalSales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 4: Payment Distribution */}
              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-extrabold text-base text-slate-900">Payment Gateway & Channel Distribution</h3>
                    <span className="text-xs text-slate-500 font-medium">Breakdown of gross revenue by settlement mode</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {Object.entries(report?.paymentMethodDistribution || {}).map(([mode, amount]) => {
                      const numAmount = Number(amount) || 0;
                      return (
                        <div key={mode} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{mode} Payment</div>
                          <div className="text-xl font-black text-slate-900">₹{numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {((numAmount / (report?.totalGrandSales || 1)) * 100).toFixed(1)}% of total revenue
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
