import { useEffect } from 'react';
import { MARKETING_URL } from '../../config/env';

/**
 * BillCom Pricing Redirector
 * In accordance with single-source-of-truth architecture,
 * all pricing evaluations are hosted on the marketing website:
 * Destination: ${MARKETING_URL}/pricing
 */
export default function PricingPage() {
  useEffect(() => {
    window.location.replace(`${MARKETING_URL}/pricing`);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#006a61] border-t-transparent mb-3"></div>
      <p className="text-xs font-semibold text-slate-600">Redirecting to BillCom Pricing Plans...</p>
    </div>
  );
}
