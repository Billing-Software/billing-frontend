import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, Edit2, Award, Loader2 } from 'lucide-react';
import { StaffMember } from '../../types';
import { staffService } from '../../services/staff.service';

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
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

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const data = await staffService.getAll();
      
      // Map backend revenueGenerated to UI's revenueGen property
      const mapped = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        empCode: item.empCode,
        contact: item.contact,
        role: item.role,
        totalBills: item.totalBills,
        revenueGen: item.revenueGenerated ?? 0,
        status: item.status
      }));
      setStaff(mapped);
    } catch (e) {
      console.error('Error fetching staff list', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

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
          status
        });
        alert("Staff access credentials updated!");
      } else {
        await staffService.create({
          name,
          empCode: empCode.toUpperCase(),
          contact,
          role,
          status
        });
        alert("Staff profile registered successfully!");
      }

      setIsFormOpen(false);
      setEditingStaff(null);
      setName('');
      setEmpCode('');
      setContact('');
      setRole('Staff');
      setStatus('Active');
      fetchStaff();
    } catch (err: any) {
      alert("Error saving staff member: " + (err.response?.data || err.message));
    }
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setName(member.name);
    setEmpCode(member.empCode);
    setContact(member.contact);
    setRole(member.role);
    setStatus(member.status);
    setIsFormOpen(true);
  };

  const handleDeleteStaff = async (id: number) => {
    try {
      await staffService.delete(id);
      alert("Staff access revoked successfully.");
      fetchStaff();
    } catch (err: any) {
      alert("Error deleting staff member: " + (err.response?.data || err.message));
    }
  };

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    member.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Staff Directory</h2>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">Configure staff authorization codes, security roles, and audits.</p>
        </div>
        <button
          onClick={() => {
            setEditingStaff(null);
            setName('');
            setEmpCode('');
            setContact('');
            setRole('Staff');
            setStatus('Active');
            setIsFormOpen(true);
          }}
          className="bg-[#006a61] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-opacity-95 cursor-pointer"
        >
          <Plus size={15} />
          <span>Register Staff Member</span>
        </button>
      </div>

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
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Work Contact</label>
                <input 
                  type="text" 
                  value={contact} 
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. name@smartbill.com or phone" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
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

              <div className="col-span-full flex gap-2 justify-end">
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
            placeholder="Audit team directory by full legal names, employee code tags, or security role status..."
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
                <p className="font-mono text-[10px] text-[#7c839b] font-semibold uppercase mt-0.5">{member.empCode}</p>
                <p className="font-sans text-xs text-[#45464d] truncate mt-1">{member.contact}</p>

                {/* Mini analytics dividers */}
                <div className="grid grid-cols-2 gap-2 border-t border-[#e2e8f0]/65 mt-4 pt-4">
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
