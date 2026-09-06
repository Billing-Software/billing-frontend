import { BankAccount, CashAccount, ChequeRecord, ContraTransaction } from '../types/cashbank.types';

const BANK_ACCOUNTS_KEY = 'billcom_bank_accounts';
const CASH_ACCOUNTS_KEY = 'billcom_cash_accounts';
const CHEQUES_KEY = 'billcom_cheques';
const CONTRA_KEY = 'billcom_contra_txns';

const DEFAULT_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 1,
    accountName: 'HDFC Business Current Account',
    accountNumber: '50200084920192',
    bankName: 'HDFC Bank',
    ifscCode: 'HDFC0001234',
    branchName: 'Main Road Branch',
    openingBalance: 150000,
    currentBalance: 184500,
    isDefault: true,
    upiId: 'billcomstore@hdfcbank',
    status: 'Active'
  },
  {
    id: 2,
    accountName: 'SBI Current Account',
    accountNumber: '30491827461',
    bankName: 'State Bank of India',
    ifscCode: 'SBIN0004567',
    branchName: 'Commercial Hub Branch',
    openingBalance: 50000,
    currentBalance: 65200,
    isDefault: false,
    upiId: 'billcomsbi@sbi',
    status: 'Active'
  }
];

const DEFAULT_CASH_ACCOUNTS: CashAccount[] = [
  {
    id: 1,
    accountName: 'Main Cash Register (Counter 1)',
    openingBalance: 15000,
    currentBalance: 24800,
    isDefault: true
  },
  {
    id: 2,
    accountName: 'Petty Cash Drawer',
    openingBalance: 5000,
    currentBalance: 3650,
    isDefault: false
  }
];

const DEFAULT_CHEQUES: ChequeRecord[] = [
  {
    id: 1,
    type: 'Received',
    chequeNumber: '482019',
    bankName: 'State Bank of India',
    partyName: 'Nagarjuna Rao (Wholesale Customer)',
    partyType: 'Customer',
    amount: 18500,
    issueDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    status: 'Deposited',
    notes: 'Advance cheque for rice and groceries bulk dispatch',
    referenceBillNumber: 'INV-2026-089',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 2,
    type: 'Issued',
    chequeNumber: '001245',
    bankName: 'HDFC Bank',
    partyName: 'Balaji Agro & Rice Mills Pvt Ltd',
    partyType: 'Supplier',
    amount: 20000,
    issueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'Open',
    notes: 'Payment towards purchase bill PUR-2026-001',
    referenceBillNumber: 'PUR-2026-001',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  }
];

export const cashBankService = {
  // ── Bank Accounts ──
  getBankAccounts: async (): Promise<BankAccount[]> => {
    try {
      const stored = localStorage.getItem(BANK_ACCOUNTS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(DEFAULT_BANK_ACCOUNTS));
      return DEFAULT_BANK_ACCOUNTS;
    } catch {
      return DEFAULT_BANK_ACCOUNTS;
    }
  },

  addBankAccount: async (data: Omit<BankAccount, 'id'>): Promise<BankAccount> => {
    const list = await cashBankService.getBankAccounts();
    const newId = list.length > 0 ? Math.max(...list.map(b => b.id)) + 1 : 1;
    const newBank: BankAccount = { ...data, id: newId };
    const updated = [...list, newBank];
    localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(updated));
    return newBank;
  },

  // ── Cash Accounts ──
  getCashAccounts: async (): Promise<CashAccount[]> => {
    try {
      const stored = localStorage.getItem(CASH_ACCOUNTS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(CASH_ACCOUNTS_KEY, JSON.stringify(DEFAULT_CASH_ACCOUNTS));
      return DEFAULT_CASH_ACCOUNTS;
    } catch {
      return DEFAULT_CASH_ACCOUNTS;
    }
  },

  // ── Cheques ──
  getCheques: async (): Promise<ChequeRecord[]> => {
    try {
      const stored = localStorage.getItem(CHEQUES_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(CHEQUES_KEY, JSON.stringify(DEFAULT_CHEQUES));
      return DEFAULT_CHEQUES;
    } catch {
      return DEFAULT_CHEQUES;
    }
  },

  createCheque: async (data: Omit<ChequeRecord, 'id' | 'createdAt'>): Promise<ChequeRecord> => {
    const list = await cashBankService.getCheques();
    const newId = list.length > 0 ? Math.max(...list.map(c => c.id)) + 1 : 1;
    const newCheque: ChequeRecord = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString()
    };
    const updated = [newCheque, ...list];
    localStorage.setItem(CHEQUES_KEY, JSON.stringify(updated));
    return newCheque;
  },

  updateChequeStatus: async (id: number, status: ChequeRecord['status']): Promise<ChequeRecord | null> => {
    const list = await cashBankService.getCheques();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) return null;
    list[index].status = status;
    if (status === 'Cleared') {
      list[index].clearingDate = new Date().toISOString().split('T')[0];
    }
    localStorage.setItem(CHEQUES_KEY, JSON.stringify(list));
    return list[index];
  },

  // ── Contra Transfers ──
  getContraTransactions: async (): Promise<ContraTransaction[]> => {
    try {
      const stored = localStorage.getItem(CONTRA_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  recordContraTransfer: async (transfer: Omit<ContraTransaction, 'id' | 'createdAt'>): Promise<ContraTransaction> => {
    const list = await cashBankService.getContraTransactions();
    const newId = list.length > 0 ? Math.max(...list.map(t => t.id)) + 1 : 1;
    const newTxn: ContraTransaction = {
      ...transfer,
      id: newId,
      createdAt: new Date().toISOString()
    };

    // Update balances
    const bankList = await cashBankService.getBankAccounts();
    const cashList = await cashBankService.getCashAccounts();

    if (transfer.fromAccountType === 'Cash') {
      const cashAcc = cashList.find(c => c.id === transfer.fromAccountId);
      if (cashAcc) cashAcc.currentBalance -= transfer.amount;
    } else {
      const bankAcc = bankList.find(b => b.id === transfer.fromAccountId);
      if (bankAcc) bankAcc.currentBalance -= transfer.amount;
    }

    if (transfer.toAccountType === 'Cash') {
      const cashAcc = cashList.find(c => c.id === transfer.toAccountId);
      if (cashAcc) cashAcc.currentBalance += transfer.amount;
    } else {
      const bankAcc = bankList.find(b => b.id === transfer.toAccountId);
      if (bankAcc) bankAcc.currentBalance += transfer.amount;
    }

    localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(bankList));
    localStorage.setItem(CASH_ACCOUNTS_KEY, JSON.stringify(cashList));

    const updatedTxns = [newTxn, ...list];
    localStorage.setItem(CONTRA_KEY, JSON.stringify(updatedTxns));
    return newTxn;
  }
};
