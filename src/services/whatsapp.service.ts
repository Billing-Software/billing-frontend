import { apiClient } from './api.client';

export interface WhatsAppAccountStatus {
  id: number;
  displayPhoneNumber?: string;
  wabaId?: string;
  status: string;
  connectedAt?: string;
  disconnectedAt?: string;
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

export const whatsAppService = {
  /** Get the current WhatsApp connection status for the business. */
  getStatus: async (): Promise<WhatsAppAccountStatus> => {
    const response = await apiClient.get('/whatsapp/status');
    return response.data;
  },

  /** Exchange the OAuth authorization code from Meta Embedded Signup. */
  connect: async (code: string): Promise<WhatsAppAccountStatus> => {
    const response = await apiClient.post('/whatsapp/connect', { code });
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

  /** Get message logs, optionally filtered by bill ID. */
  getMessages: async (billId?: number): Promise<MessageLog[]> => {
    const path = billId ? `/whatsapp/messages?billId=${billId}` : '/whatsapp/messages';
    const response = await apiClient.get(path);
    return response.data;
  },
};
