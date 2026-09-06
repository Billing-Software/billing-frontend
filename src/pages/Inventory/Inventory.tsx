import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  RotateCcw, 
  AlertTriangle, 
  Loader2, 
  Tag, 
  Layers, 
  Calendar, 
  SlidersHorizontal, 
  Package, 
  Boxes, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ArrowDownUp,
  MapPin
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { inventoryService } from '../../services/inventory.service';
import { categoryService, Category } from '../../services/category.service';
import { useToast } from '../../hooks/useToast';
import BarcodePrintStudioModal from '../../components/inventory/BarcodePrintStudioModal';
import GodownTransferModal from '../../components/inventory/GodownTransferModal';

export default function Inventory() {
  const { showToast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'expiring' | 'expired' | 'out'>('all');
  
  // Create / Edit modal/form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [category, setCategory] = useState<string>('Consumables');
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [unit, setUnit] = useState<string>('Units');
  const [secondaryUnit, setSecondaryUnit] = useState<string>('');
  const [conversionRate, setConversionRate] = useState<string>('');
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [mrp, setMrp] = useState<string>('');
  const [wholesalePrice, setWholesalePrice] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [rackLocation, setRackLocation] = useState<string>('');
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  // Quick Stock Adjustment Modal State
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustAction, setAdjustAction] = useState<'add' | 'reduce'>('add');
  const [adjustQty, setAdjustQty] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('Physical Count Audit');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);

  // Barcode Studio & Godowns Modals
  const [isBarcodeStudioOpen, setIsBarcodeStudioOpen] = useState<boolean>(false);
  const [isGodownModalOpen, setIsGodownModalOpen] = useState<boolean>(false);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const data = await inventoryService.getAll();
      setInventory(data);
    } catch (e) {
      console.error('Error fetching inventory', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const list = await categoryService.getAll();
      const invCats = list.filter(c => c.type === 'Inventory');
      setDbCategories(invCats);
      if (invCats.length > 0 && !editingItem) {
        setCategory(invCats[0].name);
      }
    } catch (e) {
      console.error('Error loading inventory categories', e);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchCategories();
  }, []);

  const categories = Array.from(new Set([
    ...dbCategories.map(c => c.name),
    ...inventory.map(i => i.category)
  ]));

  const resetForm = () => {
    setEditingItem(null);
    setName('');
    setSku('');
    setCategory(dbCategories[0]?.name || 'Consumables');
    setCurrentStock(10);
    setUnit('Units');
    setSecondaryUnit('');
    setConversionRate('');
    setReorderLevel(5);
    setMrp('');
    setWholesalePrice('');
    setPurchasePrice('');
    setBatchNumber('');
    setExpiryDate('');
    setRackLocation('');
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    const payload: any = {
      name,
      sku: sku.toUpperCase(),
      category,
      currentStock: Number(currentStock),
      unit,
      reorderLevel: Number(reorderLevel),
      secondaryUnit: secondaryUnit || undefined,
      conversionRate: conversionRate ? Number(conversionRate) : undefined,
      mrp: mrp ? Number(mrp) : undefined,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      batchNumber: batchNumber || undefined,
      expiryDate: expiryDate || undefined,
      rackLocation: rackLocation || undefined,
    };

    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, {
          ...payload,
          imageUrl: editingItem.imageUrl
        });
        showToast("Stock database item updated!", "success");
      } else {
        await inventoryService.create(payload);
        showToast("New inventory SKU added successfully!", "success");
      }

      setIsFormOpen(false);
      resetForm();
      fetchInventory();
    } catch (err: any) {
      showToast("Error saving item: " + (err.response?.data || err.message), "error");
    }
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setSku(item.sku);
    setCategory(item.category);
    setCurrentStock(item.currentStock);
    setUnit(item.unit);
    setSecondaryUnit(item.secondaryUnit || '');
    setConversionRate(item.conversionRate ? String(item.conversionRate) : '');
    setReorderLevel(item.reorderLevel);
    setMrp(item.mrp ? String(item.mrp) : '');
    setWholesalePrice(item.wholesalePrice ? String(item.wholesalePrice) : '');
    setPurchasePrice(item.purchasePrice ? String(item.purchasePrice) : '');
    setBatchNumber(item.batchNumber || '');
    setExpiryDate(item.expiryDate ? item.expiryDate.split('T')[0] : '');
    setRackLocation(item.rackLocation || '');
    setIsFormOpen(true);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await inventoryService.delete(id);
      showToast("Inventory record deleted successfully.", "success");
      fetchInventory();
    } catch (err: any) {
      showToast("Error deleting item: " + (err.response?.data || err.message), "error");
    }
  };

  // Stock status badge calculations
  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { label: 'Out of Stock', css: 'bg-red-50 border-red-200 text-red-700', icon: true };
    if (item.currentStock <= item.reorderLevel) return { label: 'Low Stock', css: 'bg-amber-50 border-amber-200 text-amber-800', icon: true };
    return { label: 'In Stock', css: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: false };
  };

  // Expiry badge calculation
  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    const exp = new Date(dateStr);
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Expired (${Math.abs(diffDays)}d ago)`, css: 'bg-red-100 text-red-800 border-red-300', isExpired: true };
    }
    if (diffDays <= 30) {
      return { label: `Expiring in ${diffDays}d`, css: 'bg-amber-100 text-amber-800 border-amber-300', isExpiring: true };
    }
    return { label: `Exp: ${exp.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`, css: 'bg-slate-100 text-slate-700 border-slate-200', isExpiring: false };
  };

  // Handle Quick Stock Adjustment
  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || !adjustQty || Number(adjustQty) <= 0) return;

    const delta = adjustAction === 'add' ? Number(adjustQty) : -Number(adjustQty);
    const newStock = Math.max(0, adjustingItem.currentStock + delta);

    setIsAdjusting(true);
    try {
      await inventoryService.update(adjustingItem.id, {
        ...adjustingItem,
        currentStock: newStock
      });
      showToast(`Stock updated: ${adjustingItem.name} is now ${newStock} ${adjustingItem.unit}`, 'success');
      setAdjustingItem(null);
      setAdjustQty('');
      fetchInventory();
    } catch (err: any) {
      showToast('Failed to adjust stock: ' + (err.response?.data || err.message), 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.batchNumber && item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    
    // Status Filter
    if (statusFilter === 'out' && item.currentStock > 0) return false;
    if (statusFilter === 'low' && (item.currentStock === 0 || item.currentStock > item.reorderLevel)) return false;
    if (statusFilter === 'expired') {
      const exp = getExpiryStatus(item.expiryDate);
      if (!exp || !exp.isExpired) return false;
    }
    if (statusFilter === 'expiring') {
      const exp = getExpiryStatus(item.expiryDate);
      if (!exp || (!exp.isExpiring && !exp.isExpired)) return false;
    }

    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="text-[#006a61]" size={26} />
            <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Inventory & Stock Management</h2>
          </div>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">
            Track dual units, batches, expiry alerts, MRP, wholesale pricing, and stock levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGodownModalOpen(true)}
            className="bg-white border border-[#c6c6cd] text-[#0b1c30] text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
          >
            <span>🏬 Godowns &amp; Transfers</span>
          </button>
          <button
            onClick={() => setIsBarcodeStudioOpen(true)}
            className="bg-white border border-[#c6c6cd] text-[#006a61] text-xs font-bold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Tag size={15} />
            <span>🖨️ Barcode Studio</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="bg-[#006a61] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#004d47] transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Stock Health Quick Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>Total Items</p>
          <p className="text-xl font-black mt-0.5">{inventory.length}</p>
        </button>
        <button
          onClick={() => setStatusFilter('low')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'low' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'low' ? 'text-amber-100' : 'text-amber-600'}`}>Low Stock Alerts</p>
          <p className={`text-xl font-black mt-0.5 ${statusFilter === 'low' ? 'text-white' : 'text-amber-700'}`}>
            {inventory.filter(i => i.currentStock > 0 && i.currentStock <= i.reorderLevel).length}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('out')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'out' ? 'bg-red-600 text-white border-red-700 shadow-sm' : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'out' ? 'text-red-100' : 'text-red-600'}`}>Out of Stock</p>
          <p className={`text-xl font-black mt-0.5 ${statusFilter === 'out' ? 'text-white' : 'text-red-700'}`}>
            {inventory.filter(i => i.currentStock === 0).length}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter('expiring')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'expiring' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === 'expiring' ? 'text-indigo-100' : 'text-indigo-600'}`}>Expiring Soon / Expired</p>
          <p className={`text-xl font-black mt-0.5 ${statusFilter === 'expiring' ? 'text-white' : 'text-indigo-700'}`}>
            {inventory.filter(i => {
              const exp = getExpiryStatus(i.expiryDate);
              return exp && (exp.isExpiring || exp.isExpired);
            }).length}
          </p>
        </button>
      </div>

      {/* Category Navigation Tabs */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            !selectedCategory 
              ? 'bg-[#006a61] text-white shadow-sm' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers size={13} />
          <span>All Categories</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${!selectedCategory ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {inventory.length}
          </span>
        </button>

        {categories.map((catName) => {
          const count = inventory.filter(item => item.category === catName).length;
          const isSelected = selectedCategory === catName;
          return (
            <button
              key={catName}
              onClick={() => setSelectedCategory(isSelected ? '' : catName)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
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

      {/* Interactive Add / Edit Item Panel */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="text-[#006a61]" size={20} />
                <h3 className="font-display text-[#0b1c30] text-sm font-bold">
                  {editingItem ? `Edit Item: ${editingItem.name} (${editingItem.sku})` : 'Register New Item / Product (Vyapar Grade)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕ Cancel
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Section 1: Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Item / Product Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Basmati Rice 5kg / Dolo 650mg" 
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#006a61] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">SKU / Item Code *</label>
                  <input 
                    type="text" 
                    value={sku} 
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. RICE-005" 
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#006a61] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#006a61] focus:bg-white"
                  >
                    {dbCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {dbCategories.length === 0 && <option value="General">General</option>}
                  </select>
                </div>
              </div>

              {/* Section 2: Pricing & Valuation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💰 Pricing & Valuation</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">MRP (₹)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={mrp} 
                      onChange={(e) => setMrp(e.target.value)}
                      placeholder="e.g. 120.00" 
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#006a61]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Wholesale Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={wholesalePrice} 
                      onChange={(e) => setWholesalePrice(e.target.value)}
                      placeholder="e.g. 95.00" 
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#006a61]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Purchase / Cost Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={purchasePrice} 
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="e.g. 80.00" 
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#006a61]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Dual Units & Stock Thresholds */}
              <div className="p-4 bg-[#eff4ff]/60 rounded-xl border border-slate-200/80 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📦 Units & Stock Quantification (Dual Units)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Primary Unit *</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg outline-none"
                    >
                      <option value="Units">Units</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Box">Box</option>
                      <option value="Pack">Pack</option>
                      <option value="Kg">Kg</option>
                      <option value="Grams">Grams</option>
                      <option value="Litre">Litre</option>
                      <option value="Meter">Meter</option>
                      <option value="Roll">Roll</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Secondary Unit (Optional)</label>
                    <select
                      value={secondaryUnit}
                      onChange={(e) => setSecondaryUnit(e.target.value)}
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg outline-none"
                    >
                      <option value="">None (Single Unit)</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Grams">Grams</option>
                      <option value="Ml">Ml</option>
                      <option value="Strips">Strips</option>
                      <option value="Pack">Pack</option>
                    </select>
                  </div>

                  {secondaryUnit && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Conversion Factor</label>
                      <input 
                        type="number" 
                        value={conversionRate} 
                        onChange={(e) => setConversionRate(e.target.value)}
                        placeholder={`1 ${unit} = ? ${secondaryUnit}`}
                        className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#006a61]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Current Stock ({unit}) *</label>
                    <input 
                      type="number" 
                      value={currentStock} 
                      onChange={(e) => setCurrentStock(Number(e.target.value))}
                      placeholder="e.g. 50" 
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#006a61]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Min Reorder Level</label>
                    <input 
                      type="number" 
                      value={reorderLevel} 
                      onChange={(e) => setReorderLevel(Number(e.target.value))}
                      placeholder="e.g. 10" 
                      className="w-full text-xs font-semibold p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-[#006a61]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Batch, Expiry & Godown / Rack */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Batch / Lot Number</label>
                  <input 
                    type="text" 
                    value={batchNumber} 
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. BATCH-2026-X" 
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#006a61] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#006a61] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Rack / Godown Location</label>
                  <input 
                    type="text" 
                    value={rackLocation} 
                    onChange={(e) => setRackLocation(e.target.value)}
                    placeholder="e.g. Shelf A-2 / Main Godown" 
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#006a61] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-sans text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#006a61] text-white font-sans text-xs font-bold rounded-xl hover:bg-[#004d47] transition-all cursor-pointer shadow-sm"
                >
                  {editingItem ? 'Update Stock Item' : 'Save Item to Inventory'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stock Adjustment Modal */}
      <AnimatePresence>
        {adjustingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl max-w-md w-full space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="text-[#006a61]" size={18} />
                  <h4 className="font-display font-bold text-sm text-[#0b1c30]">Adjust Stock Level</h4>
                </div>
                <button onClick={() => setAdjustingItem(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <p className="text-xs font-bold text-slate-800">{adjustingItem.name}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>SKU: <strong className="text-slate-700">{adjustingItem.sku}</strong></span>
                  <span>•</span>
                  <span>Current: <strong className="text-[#006a61] font-bold">{adjustingItem.currentStock} {adjustingItem.unit}</strong></span>
                </div>
              </div>

              <form onSubmit={handleApplyAdjustment} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustAction('add')}
                    className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      adjustAction === 'add'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>➕ Add Stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustAction('reduce')}
                    className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      adjustAction === 'reduce'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>➖ Reduce Stock</span>
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Quantity to {adjustAction === 'add' ? 'Add' : 'Deduct'} ({adjustingItem.unit}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#006a61] focus:bg-white"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Reason for Adjustment</label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Physical Count Audit">Physical Count Audit</option>
                    <option value="Goods Received / Purchase">Goods Received / Purchase</option>
                    <option value="Damaged / Broken">Damaged / Broken</option>
                    <option value="Expired Stock Removal">Expired Stock Removal</option>
                    <option value="Customer Return">Customer Return</option>
                    <option value="Free Sample / Promotion">Free Sample / Promotion</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingItem(null)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdjusting}
                    className={`px-4 py-1.5 text-white text-xs font-bold rounded-xl transition-all shadow-sm ${
                      adjustAction === 'add' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {isAdjusting ? 'Saving...' : 'Apply Stock Change'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <section className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="inventory-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, SKU, or batch number..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-sans text-xs font-semibold focus:border-[#006a61] focus:bg-white outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      {/* Main Stock Table view */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#006a61]" size={32} />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Synchronizing Inventory Stock...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50/70">
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Item / SKU / Batch</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Category</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase text-right">Available Stock</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase text-right">MRP / Wholesale</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Expiry / Batch</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInventory.map((item, index) => {
                  const status = getStockStatus(item);
                  const expStatus = getExpiryStatus(item.expiryDate);
                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-teal-50/20 transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200">
                            {item.category === 'Pharma' ? '💊' : item.category === 'Grocery' ? '🌾' : '📦'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">{item.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-[#006a61] bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                                {item.sku}
                              </span>
                              {item.rackLocation && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                                  <MapPin size={10} />
                                  <span>{item.rackLocation}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-extrabold text-sm text-slate-900">
                          {item.currentStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                        </div>
                        {item.secondaryUnit && item.conversionRate && (
                          <div className="text-[10px] text-slate-500 font-semibold">
                            = {item.currentStock * item.conversionRate} {item.secondaryUnit}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {item.mrp ? (
                          <div className="font-bold text-slate-900">MRP: ₹{item.mrp.toFixed(2)}</div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                        {item.wholesalePrice && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            WS: ₹{item.wholesalePrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {expStatus ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${expStatus.css}`}>
                            <Clock size={10} />
                            <span>{expStatus.label}</span>
                          </span>
                        ) : item.batchNumber ? (
                          <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Lot: {item.batchNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No Batch</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${status.css}`}>
                          {status.icon && <AlertTriangle size={10} />}
                          <span>{status.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAdjustingItem(item)}
                            className="p-1.5 text-slate-600 hover:text-[#006a61] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Adjust Stock (+ / -)"
                          >
                            <ArrowDownUp size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-[#006a61] hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Item Details"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Do you wish to delete inventory item "${item.name}"?`)) {
                                handleDeleteItem(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete SKU Record"
                          >
                            <Plus size={14} className="rotate-45" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-xs text-slate-500 font-semibold">
                      <Boxes size={36} className="mx-auto text-slate-300 mb-2" />
                      <p>No inventory items match your selected filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Barcode Label Print Studio Modal */}
      <BarcodePrintStudioModal
        isOpen={isBarcodeStudioOpen}
        onClose={() => setIsBarcodeStudioOpen(false)}
        inventoryItems={inventory}
      />

      {/* Godowns & Stock Transfer Modal */}
      <GodownTransferModal
        isOpen={isGodownModalOpen}
        onClose={() => setIsGodownModalOpen(false)}
        inventoryItems={inventory}
        onTransferSuccess={fetchInventory}
      />
    </motion.div>
  );
}
