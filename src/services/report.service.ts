import { apiClient } from './api.client';

export interface TaxSlabSummary {
  taxRate: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  lineItemsCount: number;
}

export interface HsnSacReportSummary {
  hsnSacCode: string;
  description: string;
  type: string;
  totalQuantity: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
}

export interface DailyGstSalesTrend {
  date: string;
  billsCount: number;
  taxableValue: number;
  gstCollected: number;
  totalSales: number;
}

export interface GstReportSummary {
  businessId: number;
  businessName: string;
  gstIn: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalBillsCount: number;
  totalGrossSales: number;
  totalDiscountAmount: number;
  totalTaxableValue: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  totalCess: number;
  totalGSTCollected: number;
  totalGrandSales: number;
  b2bBillsCount: number;
  b2bTaxableValue: number;
  b2bGstCollected: number;
  b2cBillsCount: number;
  b2cTaxableValue: number;
  b2cGstCollected: number;
  taxSlabs: TaxSlabSummary[];
  hsnSacBreakdown: HsnSacReportSummary[];
  dailyTrends: DailyGstSalesTrend[];
  paymentMethodDistribution: Record<string, number>;
}

export const reportService = {
  getGstReport: async (params?: { month?: number; year?: number; startDate?: string; endDate?: string; branchId?: number }): Promise<GstReportSummary> => {
    const response = await apiClient.get<any>('/reports/gst-summary', { params });
    const raw = response.data || {};

    return {
      businessId: raw.businessId ?? 0,
      businessName: raw.businessName ?? '',
      gstIn: raw.gstIn ?? '',
      periodLabel: raw.periodLabel ?? '',
      startDate: raw.startDate ?? '',
      endDate: raw.endDate ?? '',
      totalBillsCount: raw.totalBillsCount ?? 0,
      totalGrossSales: raw.totalGrossSales ?? 0,
      totalDiscountAmount: raw.totalDiscountAmount ?? 0,
      totalTaxableValue: raw.totalTaxableValue ?? 0,
      totalCGST: raw.totalCGST ?? raw.totalCgst ?? 0,
      totalSGST: raw.totalSGST ?? raw.totalSgst ?? 0,
      totalIGST: raw.totalIGST ?? raw.totalIgst ?? 0,
      totalCess: raw.totalCess ?? 0,
      totalGSTCollected: raw.totalGSTCollected ?? raw.totalGstCollected ?? 0,
      totalGrandSales: raw.totalGrandSales ?? 0,
      b2bBillsCount: raw.b2bBillsCount ?? raw.b2BBillsCount ?? 0,
      b2bTaxableValue: raw.b2bTaxableValue ?? raw.b2BTaxableValue ?? 0,
      b2bGstCollected: raw.b2bGstCollected ?? raw.b2BGSTCollected ?? raw.b2BGstCollected ?? 0,
      b2cBillsCount: raw.b2cBillsCount ?? raw.b2CBillsCount ?? 0,
      b2cTaxableValue: raw.b2cTaxableValue ?? raw.b2CTaxableValue ?? 0,
      b2cGstCollected: raw.b2cGstCollected ?? raw.b2CGSTCollected ?? raw.b2CGstCollected ?? 0,
      taxSlabs: Array.isArray(raw.taxSlabs) ? raw.taxSlabs.map((s: any) => ({
        taxRate: s.taxRate ?? 0,
        taxableValue: s.taxableValue ?? 0,
        cgstAmount: s.cgstAmount ?? 0,
        sgstAmount: s.sgstAmount ?? 0,
        igstAmount: s.igstAmount ?? 0,
        totalTaxAmount: s.totalTaxAmount ?? 0,
        lineItemsCount: s.lineItemsCount ?? 0
      })) : [],
      hsnSacBreakdown: Array.isArray(raw.hsnSacBreakdown) ? raw.hsnSacBreakdown.map((h: any) => ({
        hsnSacCode: h.hsnSacCode ?? '',
        description: h.description ?? '',
        type: h.type ?? 'Goods',
        totalQuantity: h.totalQuantity ?? 0,
        taxableValue: h.taxableValue ?? 0,
        cgstAmount: h.cgstAmount ?? 0,
        sgstAmount: h.sgstAmount ?? 0,
        igstAmount: h.igstAmount ?? 0,
        totalTaxAmount: h.totalTaxAmount ?? 0
      })) : [],
      dailyTrends: Array.isArray(raw.dailyTrends) ? raw.dailyTrends.map((d: any) => ({
        date: d.date ?? '',
        billsCount: d.billsCount ?? 0,
        taxableValue: d.taxableValue ?? 0,
        gstCollected: d.gstCollected ?? 0,
        totalSales: d.totalSales ?? 0
      })) : [],
      paymentMethodDistribution: raw.paymentMethodDistribution || {}
    };
  },

  downloadGstCsv: async (params?: { month?: number; year?: number; startDate?: string; endDate?: string; branchId?: number }): Promise<void> => {
    const response = await apiClient.get('/reports/gst-summary/export-csv', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `GST_Tax_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
