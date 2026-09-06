export interface BankAccount {
  id: number;
  accountName: string; // e.g. "HDFC Current Account"
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName?: string;
  openingBalance: number;
  currentBalance: number;
  isDefault: boolean;
  upiId?: string;
  status: 'Active' | 'Inactive';
}

export interface CashAccount {
  id: number;
  accountName: string; // e.g. "Main Cash Drawer", "Petty Cash"
  openingBalance: number;
  currentBalance: number;
  isDefault: boolean;
}

export interface ChequeRecord {
  id: number;
  type: 'Received' | 'Issued'; // Received from Customer vs Issued to Supplier
  chequeNumber: string;
  bankName: string;
  partyName: string;
  partyType: 'Customer' | 'Supplier';
  partyId?: number;
  amount: number;
  issueDate: string;
  dueDate: string;
  clearingDate?: string;
  status: 'Open' | 'Deposited' | 'Cleared' | 'Bounced' | 'Cancelled';
  notes?: string;
  referenceBillNumber?: string;
  createdAt?: string;
}

export interface ContraTransaction {
  id: number;
  date: string;
  fromAccountType: 'Cash' | 'Bank';
  fromAccountId: number;
  fromAccountName: string;
  toAccountType: 'Cash' | 'Bank';
  toAccountId: number;
  toAccountName: string;
  amount: number;
  narration?: string; // e.g. "Cash deposited to HDFC Bank"
  createdAt?: string;
}
