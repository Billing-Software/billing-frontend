export interface User {
  username: string;
  email: string;
  role: string;
  businessId: number;
  businessName: string;
  name?: string;
  avatarUrl?: string;
  token?: string;
  staffId?: number;
  onboardingPending?: boolean;
}
