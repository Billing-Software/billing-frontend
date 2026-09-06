import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, Edit2, Award, Loader2, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StaffMember, Branch } from '../../types';
import { staffService } from '../../services/staff.service';
import { branchService } from '../../services/branch.service';
import { billService } from '../../services/bill.service';
import { businessService } from '../../services/business.service';
import { useToast } from '../../hooks/useToast';
import { getPlanName } from '../../constants/subscription.constants';

export default function Staff() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // Scoped States
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [empCode, setEmpCode] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [role, setRole] = useState<'Manager' | 'Staff' | 'Cashier'>('Staff');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [password, setPassword] = useState<string>('');
  const [branchId, setBranchId] = useState<number | ''>('');

  const [expandedStaffId, setExpandedStaffId] = useState<number | null>(null);
  const [allBills, setAllBills] = useState<any[]>([]);
  const [isFetchingBills, setIsFetchingBills] = useState<boolean>(false);

  const handleToggleExpand = async (staffId: number) => {
    if (expandedStaffId === staffId) {
      setExpandedStaffId(null);
    } else {
      setExpandedStaffId(staffId);
      try {
        setIsFetchingBills(true);
        const data = await billService.getAll();
        setAllBills(data);
      } catch (e) {
        console.error('Error fetching bills for audit', e);
      } finally {
        setIsFetchingBills(false);
      }
    }
  };

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Load business details for limits tracker
      const profile = await businessService.getProfile();
      setBusinessProfile(profile);

      // Load active staff members
      const data = await staffService.getAll();
      const mapped = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        empCode: item.empCode,
        contact: item.contact,
        role: item.role,
        totalBills: item.totalBills,
        revenueGen: item.revenueGenerated ?? 0,
        status: item.status,
        branchId: item.branchId,
        branchName: item.branchName
      }));
      setStaff(mapped);

      // Load active branches list
      const branchesList = await branchService.getAll();
      setBranches(branchesList);
    } catch (e) {
      console.error('Error fetching initial data', e);
      showToast('Error syncing payroll and branch data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleOpenCreate = () => {
    if (businessProfile) {
      const limit = businessProfile.allowedStaff;
      if (limit !== -1 && staff.length >= limit) {
        showToast(`Subscription Limit Reached: Your current plan allows a maximum of ${limit} staff profiles. Please upgrade your subscription plan.`, 'warning');
        return;
      }
    }
    setEditingStaff(null);
    setName('');
    setEmpCode('');
    setContact('');
    setRole('Staff');
    setStatus('Active');
    setPassword('');
    setBranchId('');
    setIsFormOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !empCode) return;

    try {
      if (editingStaff) {
        await staffService.update(editingStaff.id, {
          name,
          empCode: empCode.toUpperCase(),
          contact,
          role,
          status,
          password: password.trim() !== '' ? password : null,
          branchId: branchId || null
        });
        showToast("Staff access credentials updated!", "success");
      } else {
        if (!password) {
          showToast("Password is required for new registrations.", "error");
          return;
        }
        await staffService.create({
          name,
          empCode: empCode.toUpperCase(),
          contact,
          role,
          status,
          password,
          branchId: branchId || null
        });
        showToast("Staff profile registered successfully!", "success");
      }

      setIsFormOpen(false);
      setEditingStaff(null);
      setName('');
      setEmpCode('');
      setContact('');
      setRole('Staff');
      setStatus('Active');
      setPassword('');
      setBranchId('');
      await fetchInitialData();
    } catch (err: any) {
      showToast("Error saving staff member: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setEmpCode(member.empCode);
    setContact(member.contact);
    setRole(member.role);
    setStatus(member.status);
    setBranchId(member.branchId || '');
    setPassword('');
    setIsFormOpen(true);
  };

  const handleDeleteStaff = async (id: number) => {
    try {
      await staffService.delete(id);
      showToast("Staff access revoked successfully.", "success");
      await fetchInitialData();
    } catch (err: any) {
      showToast("Error deleting staff member: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.branchName && member.branchName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const allowedStaffLimit = businessProfile?.allowedStaff ?? 2;
  const isStaffLimitReached = allowedStaffLimit !== -1 && staff.length >= allowedStaffLimit;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 text-left"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Staff Directory</h2>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">
            Configure staff authorization codes, branch assignments, and system access.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={isStaffLimitReached}
          className="bg-[#006a61] hover:bg-[#004d47] disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Register Staff Member</span>
        </button>
      </div>

      {/* Subscription Limit Overview Card */}
      {businessProfile && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="font-display text-base font-bold text-slate-800">
              Subscription Context: <span className="text-[#006a61]">{getPlanName(businessProfile.activePlanId)}</span>
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Allowed Staff Profiles: {allowedStaffLimit === -1 ? 'Unlimited' : `${staff.length} of ${allowedStaffLimit} users registered`}
            </p>
            {allowedStaffLimit !== -1 && (
              <div className="w-64 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded ${isStaffLimitReached ? 'bg-amber-500' : 'bg-[#006a61]'}`} 
                  style={{ width: `${Math.min(100, (staff.length / allowedStaffLimit) * 100)}%` }}
                ></div>
              </div>
            )}
          </div>

          {isStaffLimitReached && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 max-w-md">
              <Building2 className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="text-left space-y-2">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Staff Quota Reached</h4>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Your store is currently using all staff slots allowed under <strong className="font-bold">{getPlanName(businessProfile.activePlanId)}</strong> ({allowedStaffLimit} staff). Upgrade to Growth Business (10 staff) or Enterprise Chain (50 staff) to add more team members.
                </p>
                <button
                  onClick={() => navigate('/settings?tab=subscription')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>Upgrade Subscription Plan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Form Panel */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border rounded-xl p-5 shadow-sm space-y-4"
          >
            <h3 className="font-display text-[#0b1c30] text-sm font-bold">
              {editingStaff ? `Update Personnel Status: ${editingStaff.empCode}` : 'Register New Team Member'}
            </h3>
            
            <form onSubmit={handleSaveStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Staff Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amanda Lee" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Employee Code</label>
                <input 
                  type="text" 
                  value={empCode} 
                  onChange={(e) => setEmpCode(e.target.value)}
                  placeholder="e.g. EMP-022" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Login Email / Contact</label>
                <input 
                  type="email" 
                  value={contact} 
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. staff@billcom.com" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">
                  {editingStaff ? 'Login Password (optional)' : 'Login Password'}
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingStaff ? '•••••••• (unchanged)' : 'Minimum 6 characters'} 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required={!editingStaff}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Assigned System Role</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as 'Manager' | 'Staff' | 'Cashier')}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 outline-none focus:border-[#006a61]"
                >
                  <option value="Manager">Manager</option>
                  <option value="Staff">Regular Staff</option>
                  <option value="Cashier">Cashier</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Account Activity</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 outline-none focus:border-[#006a61]"
                >
                  <option value="Active">Active Duty</option>
                  <option value="Inactive">Suspended / Inactive</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Assigned Branch Outlet</label>
                <select 
                  value={branchId} 
                  onChange={(e) => setBranchId(e.target.value ? parseInt(e.target.value, 10) : '')}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 outline-none focus:border-[#006a61]"
                >
                  <option value="">Main Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-full flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-1.5 border border-[#c6c6cd] text-[#45464d] font-sans text-xs font-semibold rounded hover:bg-[#eff4ff] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#006a61] text-white font-sans text-xs font-semibold rounded hover:bg-opacity-95 cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search directory */}
      <section className="bg-white p-4 rounded-xl border border-[#e2e8f0]/80 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
          <input
            id="staff-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team directory by name, code, role, or branch outlet..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#c6c6cd] rounded-lg font-sans text-xs font-semibold outline-none focus:border-[#006a61]"
          />
        </div>
      </section>

      {/* Main Staff Directory grid list layout */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border rounded-xl shadow-sm gap-3">
          <Loader2 className="animate-spin text-[#006a61]" size={28} />
          <p className="text-xs text-[#7c839b] font-bold uppercase tracking-wider">Synchronizing Payroll Directories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredStaff.map(member => (
            <div 
              key={member.id}
              id={`staff-card-${member.id}`}
              className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-ambient-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Card top banner style */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    member.role === 'Manager' 
                      ? 'bg-[#131b2e] text-white' 
                      : member.role === 'Cashier' 
                      ? 'bg-[#86f2e4]/30 text-[#006f66]' 
                      : 'bg-[#eff4ff] text-[#45464d]'
                  }`}>
                    {member.role}
                  </span>

                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${member.status === 'Active' ? 'text-[#1e8e3e]' : 'text-[#ba1a1a]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-[#1e8e3e]' : 'bg-[#ba1a1a]'}`}></span>
                    <span>{member.status}</span>
                  </span>
                </div>

                {/* Central Bio info */}
                <h3 className="font-display font-bold text-sm text-[#0b1c30] leading-snug">{member.name}</h3>
                
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <p className="font-mono text-[9px] text-[#7c839b] font-semibold uppercase">{member.empCode}</p>
                  <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200/50 text-slate-500 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                    📍 {member.branchName || 'Main Branch'}
                  </span>
                </div>
                
                <p className="font-sans text-xs text-[#45464d] truncate mt-2">{member.contact}</p>

                {/* Mini analytics dividers */}
                <div className="grid grid-cols-2 gap-2 border-t border-[#e2e8f0]/65 mt-4 pt-4 text-left">
                  <div>
                    <p className="text-[9px] font-bold text-[#7c839b] uppercase">Bills Generated</p>
                    <p className="text-xs font-bold font-display text-[#0b1c30] flex items-center gap-1 mt-0.5">
                      <Award size={12} className="text-[#006f66]" />
                      <span>{member.totalBills.toLocaleString()}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-[#7c839b] uppercase">Revenue Contrib.</p>
                    <p className="text-xs font-bold font-display text-[#1e8e3e] flex items-center gap-0.5 mt-0.5">
                      <span>₹</span>
                      <span>{member.revenueGen.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleExpand(member.id)}
                  className="mt-3 w-full text-center text-[10px] font-bold uppercase tracking-wider text-[#006f66] hover:text-[#0b1c30] transition-colors py-1 bg-[#eff4ff]/30 hover:bg-[#eff4ff]/60 border rounded border-[#e2e8f0]/40 cursor-pointer"
                >
                  {expandedStaffId === member.id ? 'Hide Audit Log' : 'View Audit Log'}
                </button>

                <AnimatePresence>
                  {expandedStaffId === member.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 border-t border-[#e2e8f0]/40 pt-3 space-y-2"
                    >
                      <h4 className="text-[9px] font-bold text-[#7c839b] uppercase tracking-wider">Processed Invoices</h4>
                      {isFetchingBills ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="animate-spin text-[#006f66]" size={14} />
                        </div>
                      ) : (
                        <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                          {allBills.filter(b => b.createdByStaffId === member.id).length > 0 ? (
                            allBills.filter(b => b.createdByStaffId === member.id).map(bill => (
                              <div key={bill.id} className="flex justify-between items-center text-[10px] p-1.5 bg-[#f8f9ff] border border-[#e2e8f0]/40 rounded hover:border-[#006f66]/30">
                                <div>
                                  <p className="font-bold text-[#006f66]">{bill.billNumber}</p>
                                  <p className="text-[#7c839b] font-medium">{bill.customerName || 'Walk-In Customer'}</p>
                                </div>
                                <p className="font-bold text-[#0b1c30]">₹{bill.totalAmount.toLocaleString()}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[10px] text-[#7c839b] font-semibold text-center py-2">No invoices created yet.</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Row */}
              <div className="border-t border-[#e2e8f0]/40 mt-4 pt-3 flex justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEdit(member)}
                  className="p-1 px-2.5 text-xs font-semibold border rounded hover:bg-[#eff4ff] text-[#45464d] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Edit Role Assignment"
                >
                  <Edit2 size={12} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Do you wish to delete staff member "${member.name}"?`)) {
                      handleDeleteStaff(member.id);
                    }
                  }}
                  className="p-1 px-2 text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded transition-colors cursor-pointer"
                  title="Revoke Assignment"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {filteredStaff.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs text-[#7c839b] font-semibold">
              No authorized staff accounts configured matching current search indices.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
