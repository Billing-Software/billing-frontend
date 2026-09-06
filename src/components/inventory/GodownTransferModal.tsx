import React, { useState, useEffect } from 'react';
import { Building, ArrowRight, X, Printer, CheckCircle2, History, Plus } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface GodownTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: any[];
  onTransferSuccess?: () => void;
}

interface Godown {
  id: string;
  name: string;
  location: string;
}

interface StockTransferRecord {
  id: string;
  challanNumber: string;
  date: string;
  fromGodown: string;
  toGodown: string;
  itemName: string;
  quantity: number;
  unit: string;
  driverName?: string;
  notes?: string;
}

const DEFAULT_GODOWNS: Godown[] = [
  { id: 'GD-1', name: 'Main Retail Showroom', location: 'Ground Floor Store' },
  { id: 'GD-2', name: 'City Central Godown', location: 'Industrial Estate, Shed 4' },
  { id: 'GD-3', name: 'Basement Storage Godown', location: 'Basement Floor' }
];

export default function GodownTransferModal({
  isOpen,
  onClose,
  inventoryItems,
  onTransferSuccess
}: GodownTransferModalProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'transfer' | 'history'>('transfer');
  const [godowns, setGodowns] = useState<Godown[]>(() => {
    try {
      const stored = localStorage.getItem('billcom_godowns');
      return stored ? JSON.parse(stored) : DEFAULT_GODOWNS;
    } catch {
      return DEFAULT_GODOWNS;
    }
  });

  const [transfers, setTransfers] = useState<StockTransferRecord[]>(() => {
    try {
      const stored = localStorage.getItem('billcom_stock_transfers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Form states
  const [fromGodown, setFromGodown] = useState<string>('City Central Godown');
  const [toGodown, setToGodown] = useState<string>('Main Retail Showroom');
  const [selectedItemId, setSelectedItemId] = useState<number>(inventoryItems[0]?.id || 0);
  const [transferQty, setTransferQty] = useState<number>(10);
  const [driverName, setDriverName] = useState<string>('Auto Delivery #AP16-XX');
  const [transferNotes, setTransferNotes] = useState<string>('Regular shelf stock replenishment');

  if (!isOpen) return null;

  const selectedItem = inventoryItems.find(i => i.id === selectedItemId) || inventoryItems[0];

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromGodown === toGodown) {
      showToast('Source and destination godowns must be different', 'error');
      return;
    }
    if (transferQty <= 0) {
      showToast('Please enter a valid transfer quantity', 'error');
      return;
    }

    const newTransfer: StockTransferRecord = {
      id: `TR-${Date.now().toString().slice(-4)}`,
      challanNumber: `DC-STK-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      fromGodown,
      toGodown,
      itemName: selectedItem?.name || 'Inventory Item',
      quantity: Number(transferQty),
      unit: selectedItem?.unit || 'Pcs',
      driverName,
      notes: transferNotes
    };

    const updated = [newTransfer, ...transfers];
    setTransfers(updated);
    localStorage.setItem('billcom_stock_transfers', JSON.stringify(updated));

    showToast(`Stock Transfer Challan ${newTransfer.challanNumber} issued!`, 'success');
    if (onTransferSuccess) onTransferSuccess();
    setActiveTab('history');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-[#e2e8f0] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#006a61] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building size={18} />
            <div>
              <h3 className="font-bold text-sm">Godowns &amp; Inter-Warehouse Stock Transfers</h3>
              <p className="text-[11px] text-white/80">Transfer inventory between multiple godowns with transfer challans.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#e2e8f0] px-5 pt-3 bg-slate-50 gap-2">
          <button
            onClick={() => setActiveTab('transfer')}
            className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'transfer' ? 'border-[#006a61] text-[#006a61]' : 'border-transparent text-[#7c839b]'
            }`}
          >
            New Stock Transfer Challan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'history' ? 'border-[#006a61] text-[#006a61]' : 'border-transparent text-[#7c839b]'
            }`}
          >
            Transfer History ({transfers.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'transfer' ? (
            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-[#e2e8f0]">
                <div>
                  <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">From Godown (Source) *</label>
                  <select
                    value={fromGodown}
                    onChange={(e) => setFromGodown(e.target.value)}
                    className="w-full p-2 bg-white border border-[#c6c6cd] rounded-xl font-bold"
                  >
                    {godowns.map(g => (
                      <option key={g.id} value={g.name}>{g.name} ({g.location})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">To Godown (Destination) *</label>
                  <select
                    value={toGodown}
                    onChange={(e) => setToGodown(e.target.value)}
                    className="w-full p-2 bg-white border border-[#c6c6cd] rounded-xl font-bold"
                  >
                    {godowns.map(g => (
                      <option key={g.id} value={g.name}>{g.name} ({g.location})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Item to Transfer *</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(Number(e.target.value))}
                    className="w-full p-2 border border-[#c6c6cd] rounded-xl"
                  >
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (In Stock: {item.stockQuantity} {item.unit || 'Pcs'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Transfer Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value))}
                    className="w-full p-2 border border-[#c6c6cd] rounded-xl font-bold text-[#006a61]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Vehicle / Transporter</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2 border border-[#c6c6cd] rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Transfer Reason / Notes</label>
                  <input
                    type="text"
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full p-2 border border-[#c6c6cd] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#006a61] text-white rounded-xl hover:bg-[#005a52] flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={15} />
                  <span>Execute Stock Transfer</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {transfers.map((tr) => (
                <div key={tr.id} className="p-3.5 bg-slate-50 border border-[#e2e8f0] rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#006a61] text-xs">{tr.challanNumber}</span>
                      <span className="text-[10px] text-[#7c839b]">{tr.date}</span>
                    </div>
                    <p className="font-bold text-[#0b1c30] mt-1">{tr.itemName} — <span className="text-[#006a61]">{tr.quantity} {tr.unit}</span></p>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7c839b] mt-0.5">
                      <span>{tr.fromGodown}</span>
                      <ArrowRight size={12} className="text-[#006a61]" />
                      <span className="font-semibold text-[#0b1c30]">{tr.toGodown}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 text-[#006a61] hover:bg-[#006a61]/10 rounded-lg cursor-pointer"
                      title="Print Transfer Challan"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </div>
              ))}
              {transfers.length === 0 && (
                <div className="py-8 text-center text-[#7c839b]">
                  No stock transfers recorded yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
