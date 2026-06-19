import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { InventoryItem } from '../../types';
import { inventoryService } from '../../services/inventory.service';

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Create / Edit modal/form states
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [sku, setSku] = useState<string>('');
  const [category, setCategory] = useState<string>('Consumables');
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [unit, setUnit] = useState<string>('Units');
  const [reorderLevel, setReorderLevel] = useState<number>(5);

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

  useEffect(() => {
    fetchInventory();
  }, []);

  const categories = Array.from(new Set(inventory.map(i => i.category)));

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) return;

    try {
      if (editingItem) {
        await inventoryService.update(editingItem.id, {
          name,
          sku: sku.toUpperCase(),
          category,
          currentStock,
          unit,
          reorderLevel,
          imageUrl: editingItem.imageUrl
        });
        alert("Stock database item updated!");
      } else {
        await inventoryService.create({
          name,
          sku: sku.toUpperCase(),
          category,
          currentStock,
          unit,
          reorderLevel
        });
        alert("New inventory SKU added successfully!");
      }

      setIsFormOpen(false);
      setEditingItem(null);
      setName('');
      setSku('');
      setCategory('Consumables');
      setCurrentStock(10);
      setUnit('Units');
      setReorderLevel(5);
      fetchInventory();
    } catch (err: any) {
      alert("Error saving item: " + (err.response?.data || err.message));
    }
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setSku(item.sku);
    setCategory(item.category);
    setCurrentStock(item.currentStock);
    setUnit(item.unit);
    setReorderLevel(item.reorderLevel);
    setIsFormOpen(true);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await inventoryService.delete(id);
      alert("Inventory record deleted successfully.");
      fetchInventory();
    } catch (err: any) {
      alert("Error deleting item: " + (err.response?.data || err.message));
    }
  };

  // Stock status badge calculations
  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { label: 'Out of Stock', css: 'bg-[#ffdad6] text-[#ba1a1a]', icon: true };
    if (item.currentStock <= item.reorderLevel) return { label: 'Low Stock', css: 'bg-[#fff0d4] text-[#8f6b00]', icon: true };
    return { label: 'In Stock', css: 'bg-[#e2f3eb] text-[#1e8e3e]', icon: false };
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
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
          <h2 className="font-display text-2xl font-bold text-[#0b1c30]">Inventory Database</h2>
          <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase tracking-wider mt-1">Audit active consumables, retail products, tool logs, and spare nodes.</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setName('');
            setSku('');
            setCategory('Consumables');
            setCurrentStock(10);
            setUnit('Units');
            setReorderLevel(5);
            setIsFormOpen(true);
          }}
          className="bg-[#006a61] text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:bg-opacity-95 cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Stock Item</span>
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
              {editingItem ? `Update Level SKU: ${editingItem.sku}` : 'Register Warehouse SKU'}
            </h3>
            
            <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Item / Asset Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Keratin Smooth Shampoo" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">SKU Code</label>
                <input 
                  type="text" 
                  value={sku} 
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. SHMP-001" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Warehouse Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded h-9 outline-none focus:border-[#006a61]"
                >
                  <option value="Consumables">Consumables</option>
                  <option value="Repair Parts">Repair Parts</option>
                  <option value="Retail Products">Retail Products</option>
                  <option value="Tools">Tools</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Current Stock Qty</label>
                <input 
                  type="number" 
                  value={currentStock} 
                  onChange={(e) => setCurrentStock(Number(e.target.value))}
                  placeholder="e.g. 15" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Inventory Unit Name</label>
                <input 
                  type="text" 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. Bottles, Pairs, Units" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#7c839b] uppercase">Reorder Level Threshold</label>
                <input 
                  type="number" 
                  value={reorderLevel} 
                  onChange={(e) => setReorderLevel(Number(e.target.value))}
                  placeholder="e.g. 5" 
                  className="w-full text-xs font-semibold p-2 bg-white border border-[#c6c6cd] rounded outline-none focus:border-[#006a61]"
                  required
                />
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
                  Save Stock Item
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filters */}
      <section className="bg-white p-4 rounded-xl border border-[#e2e8f0]/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c839b]" />
          <input
            id="inventory-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter current inventory SKUs, product labels or stock names..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#c6c6cd] rounded-lg font-sans text-xs font-semibold focus:border-[#006a61] outline-none"
          />
        </div>
        
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-1.5 bg-white border border-[#c6c6cd] rounded text-xs font-semibold text-[#45464d] focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      {/* Main Stock Table view */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-[#006a61]" size={28} />
            <p className="text-xs text-[#7c839b] font-bold uppercase tracking-wider">Synchronizing Stock Sheets...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-[#eff4ff]/60">
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Warehouse Asset / SKU</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Warehouse Category</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Available Stock</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Unit Metric</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase">Stock Status</th>
                <th className="py-3 px-4 text-xs font-bold text-[#7c839b] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item, index) => {
                const status = getStockStatus(item);
                return (
                  <tr 
                    key={item.id}
                    className={`border-b hover:bg-[#eff4ff]/40 group ${index % 2 === 1 ? 'bg-[#f8f9ff]/60' : ''}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img 
                            referrerPolicy="no-referrer"
                            src={item.imageUrl} 
                            alt={item.name} 
                            className="w-10 h-10 rounded-md object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[#eff4ff]/80 text-[#131b2e] rounded-md flex items-center justify-center font-bold text-xs">
                            {item.placeholderType === 'cleaning' ? '🧼' : item.placeholderType === 'scissors' ? '✂️' : '🛠️'}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-[#0b1c30]">{item.name}</p>
                          <p className="text-[10px] text-[#7c839b] font-semibold uppercase mt-0.5">{item.sku}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-bold text-[#45464d]">
                      <span className="bg-[#eff4ff] border px-2.5 py-0.5 rounded text-[10px]">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-bold text-[rgb(11,28,48)] text-right">
                      {item.currentStock}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-bold text-[#7c839b] text-right">
                      {item.unit}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status.css}`}>
                        {status.icon && <AlertTriangle size={11} />}
                        <span>{status.label}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-[#7c839b] hover:text-[#006a61] hover:bg-[#eff4ff] rounded transition-colors cursor-pointer"
                          title="Update Stock Details"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Do you wish to delete inventory item "${item.name}"?`)) {
                              handleDeleteItem(item.id);
                            }
                          }}
                          className="p-1 text-[#7c839b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded transition-colors cursor-pointer"
                          title="Delete SKU Record"
                        >
                          <Plus size={13} className="rotate-45" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#7c839b] font-semibold">
                    No inventory records configured matching your key filters.
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
