import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowUpDown, 
  Loader2, 
  Package, 
  FolderPlus, 
  Tag, 
  X, 
  Layers, 
  FolderTree,
  CheckCircle2
} from 'lucide-react';
import { Service } from '../../types';
import { serviceCatalogService } from '../../services/service.service';
import { categoryService, Category } from '../../services/category.service';
import { apiClient } from '../../services/api.client';
import { useToast } from '../../hooks/useToast';

interface CategoryNode {
  category: Category;
  children: CategoryNode[];
}

function buildCategoryTree(flatCats: Category[]): CategoryNode[] {
  const map: { [id: number]: CategoryNode } = {};
  flatCats.forEach(c => { map[c.id] = { category: c, children: [] }; });
  const roots: CategoryNode[] = [];
  flatCats.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

function flattenCategoryTree(nodes: CategoryNode[], depth = 0, result: { category: Category; depth: number }[] = []): { category: Category; depth: number }[] {
  nodes.forEach(node => {
    result.push({ category: node.category, depth });
    if (node.children.length > 0) {
      flattenCategoryTree(node.children, depth + 1, result);
    }
  });
  return result;
}

export default function Services() {
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Category Manager Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatType, setNewCatType] = useState<string>('Service');
  const [newCatParentId, setNewCatParentId] = useState<number | null>(null);
  const [isSubmittingCat, setIsSubmittingCat] = useState<boolean>(false);
  
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
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

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

  const fetchCategories = async () => {
    try {
      const list = await categoryService.getAll();
      setAllCategories(list);
      const serviceCats = list.filter(c => c.type === 'Service');
      setDbCategories(serviceCats);
      if (serviceCats.length > 0 && !editingService) {
        setFormCategory(serviceCats[0].name);
      }
    } catch (e) {
      console.error('Error loading categories', e);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setIsSubmittingCat(true);
      await categoryService.create({
        name: newCatName.trim(),
        type: newCatType,
        parentId: newCatParentId || undefined
      });
      showToast(`Category "${newCatName}" created successfully!`, "success");
      setNewCatName('');
      setNewCatParentId(null);
      await fetchCategories();
    } catch (err: any) {
      showToast("Error creating category: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    try {
      await categoryService.delete(catId);
      showToast(`Category "${catName}" removed successfully.`, "success");
      await fetchCategories();
    } catch (err: any) {
      showToast("Error deleting category: " + (err.response?.data?.message || err.message), "error");
    }
  };

  // Categories list derived dynamically from DB + current services
  const categories = Array.from(new Set([
    ...dbCategories.map(c => c.name),
    ...services.map(s => s.category)
  ]));

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
          imageUrl: formImageUrl || null
        });
        showToast("Service catalog updated successfully!", "success");
      } else {
        // Add mode
        await serviceCatalogService.create({
          name: formName,
          sku: formSku.toUpperCase(),
          category: formCategory,
          basePrice: Number(formPrice),
          taxRate: Number(formTax),
          status: formStatus,
          imageUrl: formImageUrl || null
        });
        showToast("New service added successfully!", "success");
      }

      // Reset Form & Reload
      setIsFormOpen(false);
      setEditingService(null);
      setFormName('');
      setFormSku('');
      setFormCategory(dbCategories[0]?.name || 'Hair Care');
      setFormPrice(35.00);
      setFormTax(5.0);
      setFormStatus('Active');
      setFormImageUrl('');
      fetchServices();
    } catch (err: any) {
      showToast("Error saving service: " + (err.response?.data || err.message), "error");
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
    setFormImageUrl(service.imageUrl || '');
    setIsFormOpen(true);
  };

  const handleDeleteService = async (id: number) => {
    try {
      await serviceCatalogService.delete(id);
      showToast("Service removed successfully.", "success");
      fetchServices();
    } catch (err: any) {
      showToast("Error deleting service: " + (err.response?.data || err.message), "error");
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

      {/* Mobile-Style Category Navigation Tabs & Manager Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              !selectedCategory 
                ? 'bg-[#006a61] text-white shadow-sm' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>All Services</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {services.length}
            </span>
          </button>

          {categories.map((catName) => {
            const count = services.filter(s => s.category === catName).length;
            const isSelected = selectedCategory === catName;
            return (
              <button
                key={catName}
                onClick={() => setSelectedCategory(isSelected ? '' : catName)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected 
                    ? 'bg-[#006a61] text-white shadow-sm' 
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Tag size={12} className={isSelected ? 'text-white' : 'text-[#006a61]'} />
                <span>{catName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Manage Categories Action Button */}
        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#006a61] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <FolderPlus size={14} />
          <span>Category Manager</span>
        </button>
      </div>

      {/* Category Manager Pop-up Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden space-y-4 p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FolderTree className="text-[#006a61]" size={20} />
                  <h3 className="font-display font-extrabold text-base text-slate-900">Manage Service Categories</h3>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Category Add Form */}
              <form onSubmit={handleAddCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Add New Category</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Category Name</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Facial, Diagnostics, Spa"
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#006a61]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Type</label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg h-9 outline-none focus:border-[#006a61]"
                    >
                      <option value="Service">Service</option>
                      <option value="Inventory">Inventory</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Parent Category (Optional)</label>
                    <select
                      value={newCatParentId || ''}
                      onChange={(e) => setNewCatParentId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-300 rounded-lg h-9 outline-none focus:border-[#006a61]"
                    >
                      <option value="">No Parent (Top Level)</option>
                      {(() => {
                        const filteredCats = allCategories.filter(c => c.type === newCatType);
                        const tree = buildCategoryTree(filteredCats);
                        const flat = flattenCategoryTree(tree);
                        return flat.map(({ category: c, depth }) => (
                          <option key={c.id} value={c.id}>
                            {'\u00A0'.repeat(depth * 3) + (depth > 0 ? '↳ ' : '') + c.name}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmittingCat || !newCatName.trim()}
                    className="px-4 py-2 bg-[#006a61] hover:bg-[#004d47] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmittingCat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>Add Category</span>
                  </button>
                </div>
              </form>

              {/* Current Categories List */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Active Service Categories</h4>
                <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {(() => {
                    const serviceCats = allCategories.filter(c => c.type === 'Service');
                    const tree = buildCategoryTree(serviceCats);
                    const flat = flattenCategoryTree(tree);
                    return flat.length > 0 ? (
                      flat.map(({ category: c, depth }) => (
                        <div key={c.id} style={{ marginLeft: `${depth * 16}px` }} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-[#006a61]/40">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            {depth > 0 && <span className="text-slate-400">↳</span>}
                            {c.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c.id, c.name)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No service categories defined yet.</p>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  {dbCategories.length > 0 ? (
                    dbCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                  ) : (
                    <>
                      <option value="Hair Care">Hair Care</option>
                      <option value="Beard & Shave">Beard & Shave</option>
                      <option value="Massage">Massage</option>
                      <option value="Products">Products</option>
                      <option value="Repair">Repair</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Consulting">Consulting</option>
                    </>
                  )}
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

              <div className="col-span-full bg-[#f8f9ff] p-4 rounded-xl border border-[#eff4ff] space-y-3">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5">
                  {formImageUrl && (formImageUrl.startsWith('http') || formImageUrl.includes('/uploads/')) ? (
                    <img 
                      src={formImageUrl} 
                      alt="Service Icon Preview" 
                      className="w-12 h-12 rounded-lg border border-[#c6c6cd] object-cover bg-white shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg border border-dashed border-[#c6c6cd] bg-white text-[#7c839b] flex items-center justify-center shadow-sm shrink-0">
                      <Package className="opacity-40" size={20} />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-[#0b1c30] uppercase leading-none">Service Catalog Image / Icon</h4>
                    <p className="text-[10px] text-[#7c839b] font-medium leading-snug mt-1.5">
                      Upload a professional service thumbnail image to show on billing screens, or paste a custom image URL path below.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <label className="bg-[#006a61] hover:bg-opacity-90 text-white text-xs font-bold px-3 py-1.5 rounded cursor-pointer transition-all flex items-center gap-1.5">
                        <span>Upload File</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const response = await apiClient.post('/upload', formData, {
                                  headers: {
                                    'Content-Type': 'multipart/form-data',
                                  },
                                });
                                setFormImageUrl(response.data.url);
                                showToast("Service image uploaded successfully!", "success");
                              } catch (err: any) {
                                showToast("Failed to upload service image: " + (err.response?.data || err.message), "error");
                              }
                            }
                          }}
                        />
                      </label>
                      {formImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="border border-[#c6c6cd] bg-white hover:bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold text-[#7c839b] uppercase block mb-1">Or Paste Image URL / Local Path</label>
                  <input 
                    type="text" 
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://example.com/assets/haircut.webp or /uploads/custom-path.webp" 
                    className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#c6c6cd] rounded-lg focus:border-[#006a61] outline-none"
                  />
                </div>
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
                        <div className="w-8 h-8 rounded-full bg-[#eff4ff] overflow-hidden flex items-center justify-center text-[#45464d] shrink-0 border border-[#e2e8f0]">
                          {service.imageUrl && (service.imageUrl.startsWith('http') || service.imageUrl.includes('/uploads/')) ? (
                            <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                          ) : service.imageUrl === 'spa' ? (
                            '🌸'
                          ) : service.imageUrl === 'content_cut' ? (
                            '✂️'
                          ) : service.imageUrl === 'build' ? (
                            '🛠️'
                          ) : (
                            <Package size={14} className="text-[#006a61]" />
                          )}
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
