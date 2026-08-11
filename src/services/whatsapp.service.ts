import { apiClient } from './api.client';

export interface WhatsAppAccountStatus {
  id: number;
  displayPhoneNumber?: string;
  wabaId?: string;
  phoneNumberId?: string;
  status: string;
  connectedAt?: string;
  disconnectedAt?: string;
}

export interface WhatsAppConnectPayload {
  code: string;
  wabaId?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
}

export interface MessageLog {
  id: number;
  billId?: number;
  recipientPhone: string;
  messageType: string;
  metaMessageId?: string;
  status: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  failedReason?: string;
}

export interface WhatsAppTemplate {
  id: number;
  templateName: string;
  language: string;
  category: string;
  bodyText?: string;
  status: string;
  createdAt: string;
}

export const whatsAppService = {
  /** Get the current WhatsApp connection status for the business. */
  getStatus: async (): Promise<WhatsAppAccountStatus> => {
    const response = await apiClient.get('/whatsapp/status');
    return response.data;
  },

  /** Connect WhatsApp Business via Embedded Signup payload (code + sessionInfo). */
  connect: async (payload: WhatsAppConnectPayload | string): Promise<WhatsAppAccountStatus> => {
    const body = typeof payload === 'string' ? { code: payload } : payload;
    const response = await apiClient.post('/whatsapp/connect', body);
    return response.data;
  },

  /** Disconnect the WhatsApp account. */
  disconnect: async (): Promise<void> => {
    await apiClient.delete('/whatsapp/disconnect');
  },

  /** Send a text message via WhatsApp. */
  sendText: async (phone: string, message: string): Promise<MessageLog> => {
    const response = await apiClient.post('/whatsapp/send-text', { phone, message });
    return response.data;
  },

  /** Send an invoice PDF document via WhatsApp. */
  sendDocument: async (billId: number, phone: string, caption?: string): Promise<MessageLog> => {
    const response = await apiClient.post('/whatsapp/send-document', { billId, phone, caption });
    return response.data;
  },

  /** Send a template message via WhatsApp. */
  sendTemplate: async (phone: string, templateName: string, parameters?: Record<string, string>): Promise<MessageLog> => {
    const response = await apiClient.post('/whatsapp/send-template', { phone, templateName, parameters });
    return response.data;
  },

  /** Send invoice using approved default BillCom template. */
  sendInvoiceTemplate: async (billId: number, phone: string): Promise<MessageLog> => {
    const response = await apiClient.post('/whatsapp/send-invoice-template', { billId, phone });
    return response.data;
  },

  /** Get all message templates for the business WABA. */
  getTemplates: async (): Promise<WhatsAppTemplate[]> => {
    const response = await apiClient.get('/whatsapp/templates');
    return response.data;
  },

  /** Provision/sync default BillCom invoice template on WABA. */
  syncTemplates: async (): Promise<WhatsAppTemplate> => {
    const response = await apiClient.post('/whatsapp/templates/sync');
    return response.data;
  },

  /** Get message logs, optionally filtered by bill ID. */
  getMessages: async (billId?: number): Promise<MessageLog[]> => {
    const path = billId ? `/whatsapp/messages?billId=${billId}` : '/whatsapp/messages';
    const response = await apiClient.get(path);
    return response.data;
  },
};
