export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  subtitle: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxBranches: number;
  maxStaff: number;
  isPopular: boolean;
  displayOrder?: number;
  features: PlanFeature[];
}

export interface BillingTransaction {
  id: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface SubscriptionOverview {
  businessId?: number;
  legalName: string;
  tradingName?: string;
  gstIn?: string;
  activePlanId: number;
  planName: string;
  planSubtitle: string;
  monthlyPrice: number;
  yearlyPrice: number;
  subscriptionStatus: string;
  isTrial: boolean;
  trialStartsAt?: string;
  trialEndsAt?: string;
  trialDaysRemaining: number;
  trialHoursRemaining?: number;
  isTrialExpired: boolean;
  subscriptionExpiresAt?: string;
  daysRemaining: number;
  isExpired: boolean;
  allowedBranches: number;
  usedBranches: number;
  allowedStaff: number;
  usedStaff: number;
  totalBills: number;
  plans: SubscriptionPlan[];
  billingHistory: BillingTransaction[];
}

export interface UpgradeSubscriptionRequest {
  planId: number;
  billingCycle: 'monthly' | 'yearly';
  paymentMethod?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}
