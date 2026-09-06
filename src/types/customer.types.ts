export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  isWalkIn?: boolean;
  gstin?: string;
  stateCode?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  openingBalance?: number;       // Positive = Receivable ("You'll Get"), Negative = Advance
  currentBalance?: number;       // Running balance from transactions
  creditLimit?: number;          // Max allowed credit (e.g. ₹50,000)
}

