export interface StaffMember {
  id: number;
  name: string;
  empCode: string;
  contact: string;
  role: 'Manager' | 'Staff' | 'Cashier';
  totalBills: number;
  revenueGen: number;
  status: 'Active' | 'Inactive';
  branchId?: number;
  branchName?: string;
}
