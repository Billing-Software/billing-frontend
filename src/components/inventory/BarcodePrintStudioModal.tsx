import React, { useState } from 'react';
import { Printer, X, Tag, Settings, Sliders, CheckSquare, Square } from 'lucide-react';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

interface BarcodePrintStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: any[];
}

export default function BarcodePrintStudioModal({
  isOpen,
  onClose,
  inventoryItems
}: BarcodePrintStudioModalProps) {
  const { config } = useBusinessConfig();

  const [selectedItemId, setSelectedItemId] = useState<number>(inventoryItems[0]?.id || 0);
  const [numberOfLabels, setNumberOfLabels] = useState<number>(24);
  const [layoutMode, setLayoutMode] = useState<'a4_24' | 'a4_40' | 'thermal_single'>('a4_24');
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showMrp, setShowMrp] = useState<boolean>(true);
  const [showSalePrice, setShowSalePrice] = useState<boolean>(true);
  const [showPackedDate, setShowPackedDate] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentItem = inventoryItems.find(i => i.id === selectedItemId) || inventoryItems[0] || {
    id: 1,
    name: 'Sample Product',
    sku: 'PRD-8820',
    sellingPrice: 450,
    mrp: 499
  };

  const barcodeValue = currentItem.barcode || currentItem.sku || `BC${currentItem.id.toString().padStart(6, '0')}`;
  const storeName = config?.businessName || 'BillCom Store';
  const packedDate = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  // Simple Code128 barcode SVG generator emulator
  const renderBarcodeSvg = (code: string) => {
    // Generate pseudo bar pattern from string characters
    const bars: number[] = [];
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      bars.push((charCode % 3) + 1);
      bars.push(((charCode >> 1) % 2) + 1);
      bars.push(((charCode >> 2) % 3) + 1);
    }
    let x = 10;
    return (
      <svg className="w-full h-10" viewBox="0 0 200 40" preserveAspectRatio="none">
        {bars.slice(0, 32).map((width, idx) => {
          const barX = x;
          x += width * 2 + 1.5;
          return idx % 2 === 0 ? (
            <rect key={idx} x={barX} y={0} width={width * 1.8} height={35} fill="#000" />
          ) : null;
        })}
      </svg>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl border border-[#e2e8f0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#006a61] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag size={18} />
            <div>
              <h3 className="font-bold text-sm">Barcode Label &amp; Sticker Studio</h3>
              <p className="text-[11px] text-white/80">Design and print barcode labels for retail shelves and product packaging.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Controls Sidebar */}
          <div className="md:col-span-4 p-5 border-r border-[#e2e8f0] overflow-y-auto space-y-4 bg-slate-50 text-xs">
            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Select Item *</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                className="w-full p-2 bg-white border border-[#c6c6cd] rounded-xl font-medium"
              >
                {inventoryItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (₹{item.sellingPrice || item.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Sheet Format</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 p-2 bg-white border border-[#e2e8f0] rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    name="layout"
                    checked={layoutMode === 'a4_24'}
                    onChange={() => { setLayoutMode('a4_24'); setNumberOfLabels(24); }}
                  />
                  <div>
                    <p className="font-bold text-[#0b1c30]">A4 Sheet (24 Labels)</p>
                    <p className="text-[10px] text-[#7c839b]">3 columns × 8 rows (63.5mm × 38.1mm)</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white border border-[#e2e8f0] rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    name="layout"
                    checked={layoutMode === 'a4_40'}
                    onChange={() => { setLayoutMode('a4_40'); setNumberOfLabels(40); }}
                  />
                  <div>
                    <p className="font-bold text-[#0b1c30]">A4 Sheet (40 Labels)</p>
                    <p className="text-[10px] text-[#7c839b]">4 columns × 10 rows (Compact)</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white border border-[#e2e8f0] rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    name="layout"
                    checked={layoutMode === 'thermal_single'}
                    onChange={() => { setLayoutMode('thermal_single'); setNumberOfLabels(1); }}
                  />
                  <div>
                    <p className="font-bold text-[#0b1c30]">Thermal Barcode Roll</p>
                    <p className="text-[10px] text-[#7c839b]">50mm × 25mm continuous label roll</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Number of Labels to Print</label>
              <input
                type="number"
                min={1}
                max={120}
                value={numberOfLabels}
                onChange={(e) => setNumberOfLabels(Number(e.target.value))}
                className="w-full p-2 bg-white border border-[#c6c6cd] rounded-xl font-bold"
              />
            </div>

            <div className="pt-2 border-t border-[#e2e8f0]">
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-2">Display Elements</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showStoreName} onChange={(e) => setShowStoreName(e.target.checked)} />
                  <span>Business Store Name</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showMrp} onChange={(e) => setShowMrp(e.target.checked)} />
                  <span>MRP (Maximum Retail Price)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showSalePrice} onChange={(e) => setShowSalePrice(e.target.checked)} />
                  <span>Our Sale Price (₹)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showPackedDate} onChange={(e) => setShowPackedDate(e.target.checked)} />
                  <span>Packed Month / Year</span>
                </label>
              </div>
            </div>
          </div>

          {/* Live Print Preview Sheet */}
          <div className="md:col-span-8 p-6 overflow-y-auto bg-slate-200/50 flex flex-col items-center">
            <div className="mb-3 w-full flex items-center justify-between text-xs text-[#7c839b]">
              <span className="font-bold uppercase text-[10px]">Print Sheet Preview ({numberOfLabels} stickers)</span>
              <span className="font-mono text-[10px]">1:1 Print Ready</span>
            </div>

            {/* Printable Container */}
            <div id="barcode-print-area" className="bg-white p-4 shadow-md rounded border border-slate-300 w-full max-w-lg min-h-[400px]">
              <div className={`grid gap-2 ${
                layoutMode === 'a4_24' ? 'grid-cols-3' :
                layoutMode === 'a4_40' ? 'grid-cols-4' : 'grid-cols-1 max-w-xs mx-auto'
              }`}>
                {Array.from({ length: numberOfLabels }).map((_, idx) => (
                  <div key={idx} className="border border-dashed border-slate-300 p-2 rounded flex flex-col items-center text-center bg-white">
                    {showStoreName && (
                      <p className="text-[8px] font-black uppercase tracking-wider text-slate-800 truncate max-w-full">
                        {storeName}
                      </p>
                    )}
                    <p className="text-[9px] font-bold text-slate-900 leading-tight mt-0.5 line-clamp-1">
                      {currentItem.name}
                    </p>

                    {/* Barcode graphic */}
                    <div className="w-full my-0.5 px-1">
                      {renderBarcodeSvg(barcodeValue)}
                    </div>
                    <p className="font-mono text-[8px] tracking-widest text-slate-700 leading-none">
                      {barcodeValue}
                    </p>

                    {/* Prices */}
                    <div className="mt-1 flex items-baseline justify-center gap-1.5 leading-none">
                      {showMrp && currentItem.mrp && (
                        <span className="text-[8px] text-slate-500 line-through">MRP: ₹{currentItem.mrp}</span>
                      )}
                      {showSalePrice && (
                        <span className="text-[10px] font-black text-slate-900">
                          ₹{currentItem.sellingPrice || currentItem.price}
                        </span>
                      )}
                    </div>

                    {showPackedDate && (
                      <span className="text-[6px] text-slate-400 mt-0.5">Pkd: {packedDate}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e2e8f0] bg-white flex items-center justify-between">
          <p className="text-[11px] text-[#7c839b]">
            Ensure printer scale is set to <span className="font-bold">100% / Actual Size</span> when printing.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-bold bg-[#006a61] text-white rounded-xl hover:bg-[#005a52] flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Printer size={15} />
              <span>Print {numberOfLabels} Barcode Stickers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
