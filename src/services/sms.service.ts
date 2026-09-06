import { apiClient } from './api.client';

export interface BusinessSmsSettings {
  id?: number;
  businessId?: number;
  provider: string;
  senderId?: string;
  dltEntityId?: string;
  invoiceTemplateId?: string;
  templateBody?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateSmsSettings {
  senderId?: string;
  dltEntityId?: string;
  invoiceTemplateId?: string;
  templateBody?: string;
  isActive: boolean;
}

export interface SendTestSmsRequest {
  phoneNumber: string;
  message?: string;
}

export interface SendInvoiceSmsRequest {
  billId: number;
  recipientPhone?: string;
}

export interface SmsLog {
  id: number;
  businessId: number;
  billId?: number;
  recipientPhone: string;
  senderId: string;
  messageBody: string;
  dltEntityId?: string;
  dltTemplateId?: string;
  exotelSid?: string;
  status: string;
  errorMessage?: string;
  sentAt: string;
}

export interface SmsResult {
  success: boolean;
  message: string;
  messageSid?: string;
}

export const smsService = {
  getSettings: async (): Promise<BusinessSmsSettings> => {
    const res = await apiClient.get<BusinessSmsSettings>('/sms/settings');
    return res.data;
  },

  saveSettings: async (payload: UpdateSmsSettings): Promise<BusinessSmsSettings> => {
    const res = await apiClient.post<BusinessSmsSettings>('/sms/settings', payload);
    return res.data;
  },

  sendTestSms: async (phoneNumber: string, message?: string): Promise<SmsResult> => {
    const res = await apiClient.post<SmsResult>('/sms/send-test', { phoneNumber, message });
    return res.data;
  },

  sendInvoiceSms: async (billId: number, recipientPhone?: string): Promise<SmsResult> => {
    const res = await apiClient.post<SmsResult>('/sms/send-invoice', { billId, recipientPhone });
    return res.data;
  },

  getLogs: async (billId?: number): Promise<SmsLog[]> => {
    const url = billId ? `/sms/logs?billId=${billId}` : '/sms/logs';
    const res = await apiClient.get<SmsLog[]>(url);
    return res.data;
  },
};
