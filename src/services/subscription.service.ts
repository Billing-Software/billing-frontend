import { apiClient } from './api.client';
import { businessService } from './business.service';
import { branchService } from './branch.service';
import { staffService } from './staff.service';
import { SubscriptionOverview, SubscriptionPlan, UpgradeSubscriptionRequest } from '../types/subscription.types';

import { DEFAULT_PLANS, getPlanDetails } from '../constants/subscription.constants';
export { DEFAULT_PLANS, getPlanDetails };

export const subscriptionService = {
  getOverview: async (): Promise<SubscriptionOverview> => {
    try {
      const response = await apiClient.get('/subscription');
      if (response.data) {
        const data = response.data;
        const plans: SubscriptionPlan[] = (data.plans && data.plans.length > 0)
          ? data.plans.map((p: any) => ({
              id: p.id ?? p.Id,
              name: p.name ?? p.Name,
              subtitle: p.subtitle ?? p.Subtitle,
              monthlyPrice: p.monthlyPrice ?? p.MonthlyPrice,
              yearlyPrice: p.yearlyPrice ?? p.YearlyPrice,
              maxBranches: p.maxBranches ?? p.MaxBranches,
              maxStaff: p.maxStaff ?? p.MaxStaff,
              isPopular: p.isPopular ?? p.IsPopular ?? false,
              displayOrder: p.displayOrder ?? p.DisplayOrder ?? 1,
              features: p.features || DEFAULT_PLANS.find(dp => dp.id === p.id)?.features || []
            }))
          : DEFAULT_PLANS;

        return {
          businessId: data.businessId,
          legalName: data.legalName || 'Store Business',
          tradingName: data.tradingName,
          gstIn: data.gstIn,
          activePlanId: data.activePlanId ?? 1,
          planName: data.planName || 'Starter Shop',
          planSubtitle: data.planSubtitle || 'Core Store POS & Khata',
          monthlyPrice: data.monthlyPrice ?? 499,
          yearlyPrice: data.yearlyPrice ?? 4999,
          subscriptionStatus: data.subscriptionStatus || (data.isTrial ? 'Trial' : 'Active'),
          isTrial: data.isTrial ?? false,
          trialStartsAt: data.trialStartsAt,
          trialEndsAt: data.trialEndsAt,
          trialDaysRemaining: data.trialDaysRemaining ?? 0,
          trialHoursRemaining: data.trialHoursRemaining,
          isTrialExpired: data.isTrialExpired ?? false,
          subscriptionExpiresAt: data.subscriptionExpiresAt,
          daysRemaining: data.daysRemaining ?? (data.isTrial ? data.trialDaysRemaining : 30),
          isExpired: data.isExpired ?? (data.isTrial ? data.isTrialExpired : false),
          allowedBranches: data.allowedBranches ?? 1,
          usedBranches: data.usedBranches ?? 1,
          allowedStaff: data.allowedStaff ?? 2,
          usedStaff: data.usedStaff ?? 1,
          totalBills: data.totalBills ?? 0,
          plans,
          billingHistory: data.billingHistory || []
        };
      }
    } catch (err) {
      console.warn('[subscriptionService] Falling back to profile-based overview', err);
    }

    // Fallback: derive from business profile & individual services
    const profile = await businessService.getProfile().catch(() => null);
    const branches = await branchService.getAll().catch(() => []);
    const staff = await staffService.getAll().catch(() => []);

    const activePlanId = profile?.activePlanId ?? 1;
    const activePlan = DEFAULT_PLANS.find(p => p.id === activePlanId) || DEFAULT_PLANS[0];

    const now = new Date();
    const expiresAt = profile?.subscriptionExpiresAt ? new Date(profile.subscriptionExpiresAt) : new Date(now.getTime() + 30 * 86400000);
    const diffDays = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24)));

    return {
      businessId: profile?.id,
      legalName: profile?.legalName || 'Store Business',
      tradingName: profile?.tradingName,
      gstIn: profile?.gstIn,
      activePlanId,
      planName: activePlan.name,
      planSubtitle: activePlan.subtitle,
      monthlyPrice: activePlan.monthlyPrice,
      yearlyPrice: activePlan.yearlyPrice,
      subscriptionStatus: profile?.subscriptionStatus || (profile?.isTrial ? 'Trial' : 'Active'),
      isTrial: profile?.isTrial ?? false,
      trialStartsAt: profile?.trialStartsAt,
      trialEndsAt: profile?.trialEndsAt,
      trialDaysRemaining: diffDays,
      isTrialExpired: diffDays <= 0 && (profile?.isTrial ?? false),
      subscriptionExpiresAt: profile?.subscriptionExpiresAt,
      daysRemaining: diffDays,
      isExpired: diffDays <= 0,
      allowedBranches: profile?.allowedBranches || activePlan.maxBranches,
      usedBranches: branches.length > 0 ? branches.length : 1,
      allowedStaff: profile?.allowedStaff || activePlan.maxStaff,
      usedStaff: staff.length > 0 ? staff.length : 1,
      totalBills: 0,
      plans: DEFAULT_PLANS,
      billingHistory: []
    };
  },

  upgradeSubscription: async (data: UpgradeSubscriptionRequest): Promise<any> => {
    const response = await apiClient.post('/subscription/upgrade', data);
    return response.data;
  }
};
