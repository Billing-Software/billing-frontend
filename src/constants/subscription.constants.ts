import { SubscriptionPlan } from '../types/subscription.types';

export interface PlanMeta {
  id: number;
  name: string;
  shortName: string;
  code: 'starter' | 'growth' | 'enterprise';
  subtitle: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxBranches: number;
  maxStaff: number;
  isPopular: boolean;
  displayOrder: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  crownColor: string;
  features: { text: string; included: boolean }[];
}

export const SUBSCRIPTION_PLANS: Record<number, PlanMeta> = {
  1: {
    id: 1,
    name: 'Starter Shop',
    shortName: 'Starter Shop',
    code: 'starter',
    subtitle: 'Ideal for Single Kirana, Small Cafes & Standalone Stores',
    monthlyPrice: 499,
    yearlyPrice: 4999,
    maxBranches: 1,
    maxStaff: 2,
    isPopular: false,
    displayOrder: 1,
    badgeBg: 'bg-teal-50 hover:bg-teal-100',
    badgeText: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    crownColor: 'text-teal-600',
    features: [
      { text: 'Single Store & Counter POS', included: true },
      { text: '2 Cashier Staff Accounts', included: true },
      { text: 'Thermal & A4 Tax Invoice Printing', included: true },
      { text: 'Customer Udhar Khata Ledger', included: true },
      { text: 'Stock Warning Alerts', included: true },
      { text: 'Multi-Branch Franchise Sync', included: false },
      { text: 'Stylist Commission Calculator', included: false },
    ]
  },
  2: {
    id: 2,
    name: 'Growth Business',
    shortName: 'Growth Business',
    code: 'growth',
    subtitle: 'Perfect for High-Volume Retailers, Salons & Restaurants',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    maxBranches: 3,
    maxStaff: 10,
    isPopular: true,
    displayOrder: 2,
    badgeBg: 'bg-amber-50 hover:bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    crownColor: 'text-amber-600',
    features: [
      { text: 'Up to 3 Store Outlets', included: true },
      { text: '10 Staff Accounts & Role Controls', included: true },
      { text: 'Automated DLT SMS Receipts', included: true },
      { text: 'Barcode & Electronic Scale Integration', included: true },
      { text: 'Kitchen KOT & Table Layouts', included: true },
      { text: 'GST E-Invoicing & Tally Prime Sync', included: true },
      { text: 'Operating Expense & Profit Tracker', included: true },
    ]
  },
  3: {
    id: 3,
    name: 'Enterprise Chain',
    shortName: 'Enterprise Chain',
    code: 'enterprise',
    subtitle: 'Custom Architecture for Large Multi-City Franchises',
    monthlyPrice: 2499,
    yearlyPrice: 24999,
    maxBranches: 25,
    maxStaff: 50,
    isPopular: false,
    displayOrder: 3,
    badgeBg: 'bg-purple-50 hover:bg-purple-100',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    crownColor: 'text-purple-600',
    features: [
      { text: 'Unlimited Outlets & Central Warehouse', included: true },
      { text: '50 Staff Accounts with Role Controls', included: true },
      { text: 'Dedicated Account Manager & 24/7 SLA', included: true },
      { text: 'Custom ERP & Tally 2-Way Sync', included: true },
      { text: 'Multi-Branch Royalty & P&L Analytics', included: true },
      { text: 'High-Throughput Exotel DLT SMS', included: true },
    ]
  }
};

export const DEFAULT_PLANS: SubscriptionPlan[] = Object.values(SUBSCRIPTION_PLANS);

/**
 * Normalizes any plan representation (1, "1", "starter", "growth", etc.) to a PlanMeta
 */
export function getPlanDetails(planIdOrCode?: number | string | null): PlanMeta {
  if (planIdOrCode === undefined || planIdOrCode === null) {
    return SUBSCRIPTION_PLANS[1];
  }
  const str = String(planIdOrCode).toLowerCase().trim();
  if (str === '3' || str === 'enterprise' || str.includes('enterprise')) {
    return SUBSCRIPTION_PLANS[3];
  }
  if (str === '2' || str === 'growth' || str.includes('growth') || str.includes('professional')) {
    return SUBSCRIPTION_PLANS[2];
  }
  return SUBSCRIPTION_PLANS[1];
}

/**
 * Gets normalized plan name across the entire application
 */
export function getPlanName(planIdOrCode?: number | string | null, short = false): string {
  const plan = getPlanDetails(planIdOrCode);
  return short ? plan.shortName : plan.name;
}

export interface TrialBadgeInfo {
  isTrial: boolean;
  isExpired: boolean;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  daysRemaining: number;
}

export function getTrialInfo(overview?: { 
  isTrial?: boolean; 
  trialDaysRemaining?: number; 
  isTrialExpired?: boolean; 
  subscriptionStatus?: string; 
  daysRemaining?: number 
} | null): TrialBadgeInfo {
  const isTrial = overview?.isTrial ?? (overview?.subscriptionStatus?.toLowerCase() === 'trial');
  const isExpired = overview?.isTrialExpired ?? (overview?.subscriptionStatus?.toLowerCase() === 'trialexpired') ?? false;
  const days = overview?.trialDaysRemaining ?? overview?.daysRemaining ?? 0;

  if (!isTrial && !isExpired) {
    return {
      isTrial: false,
      isExpired: false,
      label: '',
      badgeBg: '',
      badgeText: '',
      badgeBorder: '',
      daysRemaining: 0,
    };
  }

  if (isExpired || days <= 0) {
    return {
      isTrial: true,
      isExpired: true,
      label: 'Trial Expired',
      badgeBg: 'bg-rose-50 hover:bg-rose-100',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      daysRemaining: 0,
    };
  }

  return {
    isTrial: true,
    isExpired: false,
    label: days === 1 ? 'Trial: 1 day left' : `Trial: ${days} days left`,
    badgeBg: 'bg-amber-50 hover:bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    daysRemaining: days,
  };
}
