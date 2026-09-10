import { apiClient } from './api.client';

/**
 * Official Razorpay Standard Web Checkout Interfaces
 * Reference: https://razorpay.com/docs/api and https://razorpay.com/docs/payments/payment-gateway/web-integration/standard
 */

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
  method?: 'card' | 'netbanking' | 'wallet' | 'emi' | 'upi';
}

export interface RazorpayTheme {
  color?: string;
  backdrop_color?: string;
  hide_topbar?: boolean;
}

export interface RazorpayModalOptions {
  /**
   * Prompts user for confirmation before closing checkout.
   * Recommended by Razorpay to avoid accidental transaction cancellations during OTP/UPI checks.
   */
  confirm_close?: boolean;
  /**
   * Whether clicking on the backdrop overlay dismisses the checkout modal.
   * Recommended false for payment flows.
   */
  backdropclose?: boolean;
  /**
   * Whether pressing Escape dismisses the modal.
   */
  escape?: boolean;
  /**
   * Enables back button handling on Android browsers.
   */
  handleback?: boolean;
  /**
   * Controls modal opening/closing animations.
   */
  animation?: boolean;
  /**
   * Callback invoked whenever the user dismisses the checkout modal without paying.
   */
  ondismiss?: () => void;
}

export interface RazorpayRetryOptions {
  enabled?: boolean;
  max_count?: number;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount?: number; // In currency sub-units (e.g. 50000 paise for ₹500)
  currency?: string;
  name: string; // Merchant / Store Name
  description?: string;
  image?: string;
  order_id: string; // Authoritative Razorpay Order ID created on backend
  subscription_id?: string; // Optional recurring subscription ID
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  theme?: RazorpayTheme;
  modal?: RazorpayModalOptions;
  retry?: RazorpayRetryOptions;
  send_sms_hash?: boolean;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorDetails {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

export interface RazorpayFailedResponse {
  error: RazorpayErrorDetails;
}

export interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (event: 'payment.failed' | string, handler: (response: RazorpayFailedResponse | any) => void) => void;
}

export interface CreateOrderRequest {
  planId: number;
  billingCycle: 'monthly' | 'yearly';
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  keyId?: string;
  planId?: number;
  planName?: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  token?: string;
  paymentMethod?: string;
  planId?: number;
  billingCycle?: 'monthly' | 'yearly';
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  order_id?: string;
  payment_id?: string;
  pending_capture?: boolean;
  status?: string;
  planName?: string;
}

// Singleton script loading promise to avoid duplicate DOM tags
let razorpayScriptLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official Razorpay checkout.js script if not already loaded.
 * Returns true if loaded and ready, false on failure.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  if (typeof window !== 'undefined' && (window as any).Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayScriptLoadingPromise) {
    return razorpayScriptLoadingPromise;
  }

  razorpayScriptLoadingPromise = new Promise((resolve) => {
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
    script.onerror = () => {
      razorpayScriptLoadingPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptLoadingPromise;
};

/**
 * Helper to open the Razorpay Standard Checkout modal with industrial best practice defaults
 * (confirm_close, mobile back button handling, payment.failed listener, and retry settings).
 */
export const openRazorpayStandardCheckout = async (
  options: RazorpayCheckoutOptions,
  onFailed?: (error: RazorpayFailedResponse) => void
): Promise<RazorpayInstance> => {
  const ready = await loadRazorpayScript();
  if (!ready || typeof (window as any).Razorpay === 'undefined') {
    throw new Error('Failed to load Razorpay payment client. Please check your network connection.');
  }

  const standardOptions: RazorpayCheckoutOptions = {
    ...options,
    modal: {
      confirm_close: true, // Prompts confirmation before closing modal
      backdropclose: false, // Prevent accidental closing when clicking outside
      escape: true,
      handleback: true, // Native Android back button compatibility
      animation: true,
      ...options.modal
    },
    retry: {
      enabled: true,
      max_count: 3,
      ...options.retry
    }
  };

  const rzp = new (window as any).Razorpay(standardOptions) as RazorpayInstance;

  if (onFailed) {
    rzp.on('payment.failed', (failResponse: RazorpayFailedResponse) => {
      onFailed(failResponse);
    });
  }

  rzp.open();
  return rzp;
};

export const razorpayService = {
  /**
   * Retrieves Razorpay public config (keyId) from backend
   */
  getConfig: async (): Promise<{ keyId: string; currency: string; merchantName?: string }> => {
    try {
      const response = await apiClient.get('/razorpay/config');
      return response.data;
    } catch {
      throw new Error('Secure payment gateway configuration is unavailable. Please try again later.');
    }
  },

  /**
   * STEP 1: Backend endpoint to create Razorpay order
   * The server resolves the plan price. The browser never supplies an amount.
   */
  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await apiClient.post<CreateOrderResponse>('/razorpay/orders', data);
    return response.data;
  },

  /**
   * STEP 3: Backend endpoint to cryptographically verify payment signature
   * Endpoint: POST /api/razorpay/payments/verify
   */
  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post<VerifyPaymentResponse>('/razorpay/payments/verify', data);
    return response.data;
  }
};
