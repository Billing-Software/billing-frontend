import React, { useState } from 'react';
import { CreditCard, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { razorpayService, loadRazorpayScript } from '../services/razorpay.service';
import { useToast } from '../hooks/useToast';

export interface RazorpayCheckoutButtonProps {
  /** Server-authorized subscription plan. Arbitrary client-side amounts are not accepted. */
  planId: number;
  billingCycle: 'monthly' | 'yearly';
  amount: number; // In rupees or paise (see amountInPaise prop)
  amountInPaise?: boolean; // Set true if amount is already in paise, false if in Rupees (default false)
  currency?: string; // Default 'INR'
  receipt?: string;
  name?: string; // Business/Store name displayed on checkout modal
  description?: string; // Product/Order description
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  buttonText?: string;
  themeColor?: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (result: {
    order_id: string;
    payment_id: string;
    signature: string;
    response: any;
  }) => void;
  onFailure?: (error: any) => void;
  onDismiss?: () => void;
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  amount,
  planId,
  billingCycle,
  amountInPaise = false,
  currency = 'INR',
  receipt,
  name = 'BillCom POS',
  description = 'Online Secure Payment',
  prefill,
  buttonText,
  themeColor = '#006a61',
  className = '',
  disabled = false,
  onSuccess,
  onFailure,
  onDismiss
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { showToast } = useToast();

  const handleCheckout = async () => {
    if (loading || disabled) return;

    // Calculate amount in paise
    const calculatedPaise = amountInPaise ? Math.round(amount) : Math.round(amount * 100);

    // Minimum amount validation: 100 paise (₹1.00)
    if (calculatedPaise < 100) {
      showToast('Amount must be at least ₹1.00 (100 paise).', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1. Ensure Razorpay checkout.js script is loaded
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Failed to load Razorpay payment client. Please check your internet connection.');
      }

      // 2. Fetch Razorpay public key ID
      const config = await razorpayService.getConfig();
      const keyId = config.keyId;
      if (!keyId) throw new Error('Secure payment gateway configuration is unavailable.');

      // 3. STEP 1: Call Backend to Create Order (POST /api/create-order)
      const order = await razorpayService.createOrder({
        planId,
        billingCycle
      });

      if (!order || !order.order_id) {
        throw new Error('Invalid order response received from backend.');
      }

      // 4. STEP 2: Configure Razorpay Checkout Modal with generated order_id
      const options = {
        key: keyId.trim(),
        amount: order.amount,
        currency: order.currency || currency,
        name,
        description,
        image: 'https://billcom.app/assets/BillCom-B.png',
        order_id: order.order_id,
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || ''
        },
        theme: {
          color: themeColor,
          backdrop_color: 'rgba(15, 23, 42, 0.65)'
        },
        modal: {
          confirm_close: true,
          backdropclose: false,
          escape: true,
          handleback: true,
          animation: true,
          ondismiss: () => {
            setLoading(false);
            showToast('Payment window was closed. Transaction cancelled.', 'info');
            if (onDismiss) onDismiss();
          }
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 5. STEP 3: Call Backend to Verify Payment Signature (POST /api/verify-payment)
            const verification = await razorpayService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verification && verification.success) {
              showToast(`Payment of ₹${(order.amount / 100).toFixed(2)} verified successfully!`, 'success');
              if (onSuccess) {
                onSuccess({
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  response: verification
                });
              }
            } else {
              throw new Error(verification?.message || 'Payment signature verification failed.');
            }
          } catch (verifyErr: any) {
            const errorMsg = verifyErr?.response?.data?.message || verifyErr.message || 'Signature verification failed.';
            showToast(`Verification error: ${errorMsg}`, 'error');
            if (onFailure) onFailure(verifyErr);
          } finally {
            setLoading(false);
          }
        }
      };

      // 6. Initialize and open Razorpay Checkout modal
      const rzp = new (window as any).Razorpay(options);

      // Handle payment.failed event
      rzp.on('payment.failed', (failResponse: any) => {
        setLoading(false);
        const error = failResponse?.error || {};
        const desc = error.description || error.reason || 'Payment could not be completed.';
        const code = error.code ? `[${error.code}] ` : '';
        showToast(`Payment Failed: ${code}${desc}`, 'error');
        if (onFailure) onFailure(failResponse);
      });

      rzp.open();
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.message || err.message || 'Error initializing Razorpay checkout.';
      showToast(msg, 'error');
      if (onFailure) onFailure(err);
    }
  };

  const formattedDisplay = amountInPaise 
    ? `₹${(amount / 100).toLocaleString('en-IN')}` 
    : `₹${amount.toLocaleString('en-IN')}`;

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={disabled || loading}
      className={className || `flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{ backgroundColor: themeColor }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Opening Gateway...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" />
          <span>{buttonText || `Pay ${formattedDisplay} with Razorpay`}</span>
        </>
      )}
    </button>
  );
};

export default RazorpayCheckoutButton;
