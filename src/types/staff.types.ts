export interface StaffMember {
  id: string;
  name: string;
  empCode: string;
  contact: string;
  role: 'Manager' | 'Staff' | 'Cashier';
  totalBills: number;
  revenueGen: number;
  status: 'Active' | 'Inactive';
}
