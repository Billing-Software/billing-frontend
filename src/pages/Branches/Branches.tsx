import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Plus, Phone, MapPin, Trash2, Edit2, ShieldAlert, Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Branch } from '../../types';
import { branchService } from '../../services/branch.service';
import { businessService } from '../../services/business.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getPlanName } from '../../constants/subscription.constants';

export default function Branches() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { refreshBranches } = useAuth();
  
  // Scoped States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Form Fields State
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [postalCode, setPostalCode] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const branchesList = await branchService.getAll();
      setBranches(branchesList);
      
      const profile = await businessService.getProfile();
      setBusinessProfile(profile);
    } catch (e: any) {
      console.error('Failed to load branches and profile', e);
      showToast('Error loading branch directory details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    // Check client-side branch limit before opening form (to save UI loops)
    if (businessProfile) {
      const limit = businessProfile.allowedBranches;
      if (limit !== -1 && branches.length >= limit) {
        showToast(`Subscription Limit Reached: Your current plan allows a maximum of ${limit} branch(es). Please upgrade your subscription plan.`, 'warning');
        return;
      }
    }
    setEditingBranch(null);
    setName('');
    setAddress('');
    setCity('');
    setPostalCode('');
    setPhone('');
    setIsActive(true);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (b: Branch) => {
    setEditingBranch(b);
    setName(b.name);
    setAddress(b.address || '');
    setCity(b.city || '');
    setPostalCode(b.postalCode || '');
    setPhone(b.phone || '');
    setIsActive(b.isActive);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      if (editingBranch) {
        // Edit Branch
        await branchService.update(editingBranch.id, {
          name: name.trim(),
          address: address.trim() || null,
          city: city.trim() || null,
          postalCode: postalCode.trim() || null,
          phone: phone.trim() || null,
          isActive
        });
        showToast('Branch profile updated successfully!', 'success');
      } else {
        // Add Branch
        await branchService.create({
          name: name.trim(),
          address: address.trim() || null,
          city: city.trim() || null,
          postalCode: postalCode.trim() || null,
          phone: phone.trim() || null,
          isActive
        });
        showToast('New branch created successfully!', 'success');
      }
      setIsFormOpen(false);
      setEditingBranch(null);
      await loadData();
      await refreshBranches(); // Sync header switcher dropdown
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save branch.';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (branches.length <= 1) {
      showToast('Cannot delete the last remaining branch of the business.', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this branch? Staff and bills mapped to this branch will lose association.')) {
      return;
    }

    try {
      await branchService.delete(id);
      showToast('Branch deleted successfully.', 'success');
      await loadData();
      await refreshBranches();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting branch.', 'error');
    }
  };

  const filteredBranches = branches.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.phone && b.phone.includes(searchQuery))
  );

  const allowedLimit = businessProfile?.allowedBranches ?? 1;
  const isLimitReached = allowedLimit !== -1 && branches.length >= allowedLimit;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="animate-spin text-[#006a61]" size={36} />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Branch Directory...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 text-left"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Branch Directory</h2>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">
            Manage multi-outlet locations, contact phone numbers, and operational status.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={isLimitReached}
          className="bg-[#006a61] hover:bg-[#004d47] disabled:bg-slate-300 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Register Branch Outlet</span>
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
              Allowed Outlets: {allowedLimit === -1 ? 'Unlimited' : `${branches.length} of ${allowedLimit} outlets created`}
            </p>
            {allowedLimit !== -1 && (
              <div className="w-64 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 rounded ${isLimitReached ? 'bg-amber-500' : 'bg-[#006a61]'}`} 
                  style={{ width: `${Math.min(100, (branches.length / allowedLimit) * 100)}%` }}
                ></div>
              </div>
            )}
          </div>

          {isLimitReached && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 max-w-md">
              <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="text-left space-y-2">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Outlet Quota Reached</h4>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Your store is currently using all outlets allowed under <strong className="font-bold">{getPlanName(businessProfile.activePlanId)}</strong> ({allowedLimit} {allowedLimit === 1 ? 'outlet' : 'outlets'}). Upgrade to Growth Business (3 outlets) or Enterprise Chain (unlimited) to expand.
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

      {/* List Search & Directory Grid */}
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search branches by outlet names, cities, or contact details..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#c6c6cd] rounded-lg font-sans text-xs font-semibold outline-none focus:border-[#006a61]"
          />
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          {filteredBranches.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No branch outlets found matching current filter query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">
                    <th className="py-4 px-6">Outlet Name</th>
                    <th className="py-4 px-6">Contact Number</th>
                    <th className="py-4 px-6">Location Address</th>
                    <th className="py-4 px-6">Operational Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-600">
                  {filteredBranches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#006a61] flex items-center justify-center shadow-xs">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 uppercase tracking-wide">{b.name}</p>
                          <p className="text-[9px] text-slate-400 font-medium">ID: {b.id}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {b.phone ? (
                          <span className="flex items-center gap-1"><Phone size={12} className="text-[#006a61]" /> {b.phone}</span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {b.address ? (
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-[#7c839b]" /> {b.address}, {b.city || ''}</span>
                        ) : (
                          <span className="text-slate-400">No address specified</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {b.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-full">
                            <CheckCircle size={10} /> Active Duty
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase rounded-full">
                            <XCircle size={10} /> Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 border border-[#c6c6cd] text-[#45464d] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 border border-[#c6c6cd] text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FORM MODAL PANEL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-left"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
                  <Building2 size={18} className="text-[#006a61]" /> 
                  {editingBranch ? 'Edit Outlet Details' : 'Register New Outlet'}
                </h3>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-800"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Branch Outlet Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Downtown Outlet"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-white border border-[#c6c6cd] rounded-xl outline-none focus:border-[#006a61]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Business Square Road"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-white border border-[#c6c6cd] rounded-xl outline-none focus:border-[#006a61]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">City / Town</label>
                    <input
                      type="text"
                      placeholder="e.g. Hyderabad"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-white border border-[#c6c6cd] rounded-xl outline-none focus:border-[#006a61]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Postal PIN Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 500001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full text-xs font-semibold p-2.5 bg-white border border-[#c6c6cd] rounded-xl outline-none focus:border-[#006a61]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outlet Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 99000 88000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-white border border-[#c6c6cd] rounded-xl outline-none focus:border-[#006a61]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveBranch"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-[#006a61] border-slate-300 rounded cursor-pointer focus:ring-0"
                  />
                  <label htmlFor="isActiveBranch" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                    Outlet is active and open for transactions
                  </label>
                </div>

                <div className="flex gap-2 justify-end border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-[#c6c6cd] text-[#45464d] text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    Close Form
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#006a61] text-white text-xs font-bold rounded-xl hover:bg-opacity-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 className="animate-spin" size={13} />}
                    <span>{editingBranch ? 'Save Details' : 'Register Outlet'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
