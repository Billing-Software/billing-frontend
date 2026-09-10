import { apiClient } from './api.client';
import { RAZORPAY_KEY_ID } from '../config/env';

export interface CreateOrderRequest {
  amount: number; // in paise (e.g. 50000 for ₹500)
  currency?: string;
  receipt?: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  order_id?: string;
  payment_id?: string;
}

/**
 * Dynamically loads the Razorpay checkout.js script if not already present on the page.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const razorpayService = {
  /**
   * Retrieves Razorpay public config (keyId) from backend
   */
  getConfig: async (): Promise<{ keyId: string; currency: string }> => {
    try {
      const response = await apiClient.get('/razorpay/config');
      return response.data;
    } catch {
      // Fallback to client environment variable from config
      return { keyId: RAZORPAY_KEY_ID, currency: 'INR' };
    }
  },

  /**
   * STEP 1: Backend endpoint to create Razorpay order
   * Endpoint: POST /api/create-order
   */
  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await apiClient.post<CreateOrderResponse>('/create-order', data);
    return response.data;
  },

  /**
   * STEP 3: Backend endpoint to cryptographically verify payment signature
   * Endpoint: POST /api/verify-payment
   */
  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post<VerifyPaymentResponse>('/verify-payment', data);
    return response.data;
  }
};
