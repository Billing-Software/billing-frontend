import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, Edit2, Mail, Phone, Loader2 } from 'lucide-react';
import { Customer } from '../../types';
import { customerService } from '../../services/customer.service';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (e) {
      console.error('Error fetching customers', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      if (editingCustomer) {
        await customerService.update(editingCustomer.id, {
          name,
          phone: phone || 'N/A',
          email: email || undefined,
          isWalkIn: false
        });
        alert("Customer profile securely updated!");
      } else {
        await customerService.create({
          name,
          phone: phone || 'N/A',
          email: email || undefined,
          isWalkIn: false
        });
        alert("New customer registration generated successfully.");
      }
      
      // Reset & Reload
      setIsFormOpen(false);
      setEditingCustomer(null);
      setName('');
      setPhone('');
      setEmail('');
      fetchCustomers();
    } catch (err: any) {
      alert("Error saving customer: " + (err.response?.data || err.message));
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setPhone(customer.phone === 'N/A' ? '' : customer.phone);
    setEmail(customer.email || '');
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      await customerService.delete(id);
      alert("Customer deleted successfully.");
      fetchCustomers();
    } catch (err: any) {
      alert("Error deleting customer: " + (err.response?.data || err.message));
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
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
          <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Customer Accounts</h2>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">Register CRM profiles, loyal accounts, and contact nodes.</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setName('');
            setPhone('');
            setEmail('');
            setIsFormOpen(true);
          }}
          className="bg-[#006a61] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-opacity-95 cursor-pointer"
        >
          <Plus size={15} />
          <span>Register Customer</span>
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
              {editingCustomer ? `Modify Profile: ${editingCustomer.name}` : 'Register Client Account'}
            </h3>
            
            <form onSubmit={handleSaveCustomer} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Customer Name *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Legal Name" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Contact Number (WhatsApp)</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Email Address (Optional)</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@server.com" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                />
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
                  Confirm Registration
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <section className="bg-white p-4 rounded-xl border border-[#e2e8f0]/80 shadow-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
          <input
            id="customer-accounts-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search through customer profiles by legal names, WhatsApp phone digits, or mails..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#c6c6cd] rounded-lg font-sans text-xs font-semibold outline-none focus:border-[#006a61]"
          />
        </div>
      </section>

      {/* Main Customers Profiles Cards / Tables */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-[#006a61]" size={28} />
            <p className="text-xs text-[#7c839b] font-bold uppercase tracking-wider">Synchronizing CRM Nodes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-[#eff4ff]/60">
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">User Identifiers</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Contact Digits</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Email Address</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Account Node</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Settings</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust, index) => (
                <tr 
                  key={cust.id}
                  className={`border-b hover:bg-[#eff4ff]/40 group ${index % 2 === 1 ? 'bg-[#f8f9ff]/60' : ''}`}
                >
                  <td className="py-3.5 px-4 font-sans text-xs font-bold text-[#0b1c30]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#e5eeff] text-[#006a61] flex items-center justify-center font-bold font-display text-xs">
                        {cust.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{cust.name}</span>
                    </div>
                  </td>
                  
                  <td className="py-3.5 px-4 font-sans text-xs text-[#0b1c30] font-semibold">
                    {cust.phone === 'N/A' || !cust.phone ? (
                      <span className="text-[#7c839b] italic">N/A</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-[#006f66]" />
                        <span>{cust.phone}</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 font-sans text-xs text-[#45464d] font-semibold">
                    {cust.email ? (
                      <span className="flex items-center gap-1">
                        <Mail size={12} className="text-[#7c839b]" />
                        <span>{cust.email}</span>
                      </span>
                    ) : (
                      <span className="text-[#c6c6cd]">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-xs">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cust.isWalkIn 
                        ? 'bg-[#eff4ff] text-[#7c839b]' 
                        : 'bg-[#86f2e4]/20 text-[#006f66]'
                    }`}>
                      {cust.isWalkIn ? 'Standard Walk-in' : 'Registered CRM'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {!cust.isWalkIn && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="p-1 text-[#7c839b] hover:text-[#006a61] hover:bg-[#eff4ff] rounded transition-colors cursor-pointer"
                            title="Modify Account info"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Do you really wish to delete customer "${cust.name}"?`)) {
                                handleDeleteCustomer(cust.id);
                              }
                            }}
                            className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transition-colors cursor-pointer"
                            title="Delete Profile"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[#7c839b] font-semibold">
                    No accounts found matching search filters.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
