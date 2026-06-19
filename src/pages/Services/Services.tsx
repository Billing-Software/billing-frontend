import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, Edit2, ArrowUpDown, Loader2 } from 'lucide-react';
import { Service } from '../../types';
import { serviceCatalogService } from '../../services/service.service';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Create / Edit modal/form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formSku, setFormSku] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Hair Care');
  const [formPrice, setFormPrice] = useState<number>(35.00);
  const [formTax, setFormTax] = useState<number>(5.0);
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'basePrice'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const data = await serviceCatalogService.getAll();
      setServices(data);
    } catch (e) {
      console.error('Error loading services', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Categories list derived dynamically
  const categories = Array.from(new Set(services.map(s => s.category)));

  // Handle Create or Update save
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formSku) return;

    try {
      if (editingService) {
        // Edit mode
        await serviceCatalogService.update(editingService.id, {
          name: formName,
          sku: formSku,
          category: formCategory,
          basePrice: Number(formPrice),
          taxRate: Number(formTax),
          status: formStatus,
          iconName: editingService.iconName || 'spa'
        });
        alert("Service catalog updated successfully!");
      } else {
        // Add mode
        await serviceCatalogService.create({
          name: formName,
          sku: formSku.toUpperCase(),
          category: formCategory,
          basePrice: Number(formPrice),
          taxRate: Number(formTax),
          status: formStatus,
          iconName: 'spa' // default icon
        });
        alert("New service added successfully!");
      }

      // Reset Form & Reload
      setIsFormOpen(false);
      setEditingService(null);
      setFormName('');
      setFormSku('');
      setFormCategory('Hair Care');
      setFormPrice(35.00);
      setFormTax(5.0);
      setFormStatus('Active');
      fetchServices();
    } catch (err: any) {
      alert("Error saving service: " + (err.response?.data || err.message));
    }
  };

  // Open Edit Mode preloaded
  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormName(service.name);
    setFormSku(service.sku);
    setFormCategory(service.category);
    setFormPrice(service.basePrice);
    setFormTax(service.taxRate);
    setFormStatus(service.status);
    setIsFormOpen(true);
  };

  const handleDeleteService = async (id: number) => {
    try {
      await serviceCatalogService.delete(id);
      alert("Service removed successfully.");
      fetchServices();
    } catch (err: any) {
      alert("Error deleting service: " + (err.response?.data || err.message));
    }
  };

  // Filter Catalog
  const filteredServices = services
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || s.category === selectedCategory;
      const matchesStatus = !selectedStatus || s.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'name') {
        return a.name.localeCompare(b.name) * multiplier;
      } else {
        return (a.basePrice - b.basePrice) * multiplier;
      }
    });

  // Toggle Sorting helper
  const handleToggleSort = (field: 'name' | 'basePrice') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Services Catalog</h2>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">Manage catalog definitions, tax models, and service codes.</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setFormName('');
            setFormSku('');
            setFormCategory('Hair Care');
            setFormPrice(35.00);
            setFormTax(5.0);
            setFormStatus('Active');
            setIsFormOpen(true);
          }}
          className="bg-[#006a61] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-opacity-95 cursor-pointer"
        >
          <Plus size={15} />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Interactive Form Drawer */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.95, height: 0 }}
            className="bg-white border rounded-lg p-5 shadow-sm relative space-y-4"
          >
            <h3 className="font-display text-[#0b1c30] text-sm font-bold">
              {editingService ? `Edit Service Status: ${editingService.sku}` : 'Add New Billable Service'}
            </h3>
            
            <form onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Service Name</label>
                <input 
                  type="text" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Standard Diagnostics" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">SKU Code</label>
                <input 
                  type="text" 
                  value={formSku} 
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="e.g. SKU-DIA-001" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Category Group</label>
                <select 
                  value={formCategory} 
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 outline-none focus:border-[#006a61]"
                >
                  <option value="Hair Care">Hair Care</option>
                  <option value="Beard & Shave">Beard & Shave</option>
                  <option value="Massage">Massage</option>
                  <option value="Products">Products</option>
                  <option value="Repair">Repair</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Base Price (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formPrice} 
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  placeholder="e.g. 45.00" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Tax Percentage (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={formTax} 
                  onChange={(e) => setFormTax(Number(e.target.value))}
                  placeholder="e.g. 5.0" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Catalog Status</label>
                <select 
                  value={formStatus} 
                  onChange={(e) => setFormStatus(e.target.value as 'Active' | 'Inactive')}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 outline-none focus:border-[#006a61]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="col-span-full flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-1.5 border border-[#c6c6cd] text-[#45464d] font-sans text-xs font-semibold rounded hover:bg-[#eff4ff] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#006a61] text-white font-sans text-xs font-semibold rounded hover:bg-opacity-95 cursor-pointer"
                >
                  Save Service
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters Hub */}
      <section className="bg-white p-4 rounded-lg border border-[#e2e8f0]/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
          <input
            id="service-catalog-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service names, description tags, or SKU codes..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#c6c6cd] rounded-lg font-sans text-xs font-semibold focus:border-[#006a61] outline-none"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-1.5 bg-white border border-[#c6c6cd] rounded text-xs font-semibold text-[#45464d] focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="p-1.5 bg-white border border-[#c6c6cd] rounded text-xs font-semibold text-[#45464d] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </section>

      {/* Main Services Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-[#006a61]" size={28} />
            <p className="text-xs text-[#7c839b] font-bold uppercase tracking-wider">Synchronizing Catalog Records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-[#eff4ff]/60">
                  <th 
                    onClick={() => handleToggleSort('name')}
                    className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase select-none cursor-pointer hover:text-[#0b1c30]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Service Name</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Category</th>
                  <th 
                    onClick={() => handleToggleSort('basePrice')}
                    className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right select-none cursor-pointer hover:text-[#0b1c30]"
                  >
                    <div className="flex items-center gap-1 justify-end">
                      <span>Base Price</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Tax Rates</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service, index) => (
                  <tr 
                    key={service.id}
                    className={`border-b hover:bg-[#eff4ff]/40 group ${index % 2 === 1 ? 'bg-[#f8f9ff]/60' : ''}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#eff4ff] flex items-center justify-center text-[#45464d]">
                          {service.iconName === 'spa' ? '🌸' : service.iconName === 'content_cut' ? '✂️' : service.iconName === 'build' ? '🛠️' : '📦'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0b1c30]">{service.name}</p>
                          <p className="text-[10px] text-[#76777d] font-semibold uppercase mt-0.5">{service.sku}</p>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#45464d]">
                      <span className="bg-[#eff4ff] border px-2 py-0.5 rounded text-[10px]">
                        {service.category}
                      </span>
                    </td>
                    
                    <td className="py-3.5 px-4 text-xs font-bold text-[#006f66] text-right">
                      ₹{service.basePrice.toLocaleString()}
                    </td>
                    
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#7c839b] text-right">
                      {service.taxRate.toFixed(1)}%
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        service.status === 'Active' 
                          ? 'bg-[#e6f4ea] text-[#1e8e3e]' 
                          : 'bg-[#eff4ff] text-[#7c839b]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${service.status === 'Active' ? 'bg-[#1e8e3e]' : 'bg-[#7c839b]'}`}></span>
                        <span>{service.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(service)}
                          className="p-1 text-[#7c839b] hover:text-[#006a61] hover:bg-[#eff4ff] rounded transitions cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Do you really want to delete service "${service.name}"?`)) {
                              handleDeleteService(service.id);
                            }
                          }}
                          className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded transitions cursor-pointer"
                          title="Remove Service"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredServices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <p className="text-secondary text-xs font-semibold">No services configured matching key queries.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Pagination Controls */}
        <div className="p-4 border-t bg-[#eff4ff]/20 flex justify-between items-center shrink-0">
          <p className="text-[10px] text-[#7c839b] font-semibold">Showing {filteredServices.length} entries</p>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 text-[11px] font-semibold bg-white border rounded text-[#45464d]" disabled>Prev</button>
            <button className="w-6 h-6 text-xs font-bold p-1 rounded bg-[#006a61] text-white">1</button>
            <button className="px-2.5 py-1 text-[11px] font-semibold bg-white border rounded text-[#45464d]" disabled>Next</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
