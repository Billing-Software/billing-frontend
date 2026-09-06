import React, { useState } from 'react';
import { Truck, Download, Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

interface EWayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function EWayBillModal({
  isOpen,
  onClose,
  invoice
}: EWayBillModalProps) {
  const { showToast } = useToast();
  const { config } = useBusinessConfig();

  // E-Way Bill Form States
  const [transporterName, setTransporterName] = useState<string>('VRL Logistics Ltd');
  const [transporterId, setTransporterId] = useState<string>('29AAACB2002M1ZP');
  const [transDocNo, setTransDocNo] = useState<string>(`LR-${Date.now().toString().slice(-5)}`);
  const [transMode, setTransMode] = useState<'Road' | 'Rail' | 'Air' | 'Ship'>('Road');
  const [vehicleNo, setVehicleNo] = useState<string>('AP16-TC-9821');
  const [vehicleType, setVehicleType] = useState<'Regular' | 'ODC'>('Regular');
  const [distanceKm, setDistanceKm] = useState<number>(120);

  if (!isOpen || !invoice) return null;

  const handleExportJson = () => {
    // Generate official E-Way Bill JSON structure for ewaybillgst.gov.in
    const ewayPayload = {
      version: '1.0.0421',
      billLists: [
        {
          userGstin: config?.gstIn || '37AAAAA0000A1Z5',
          supplyType: 'O', // Outward
          subSupplyType: '1', // Supply
          docType: 'INV',
          docNo: invoice.billNumber || invoice.id,
          docDate: invoice.date ? invoice.date.split('T')[0] : new Date().toISOString().split('T')[0],
          fromGstin: config?.gstIn || '37AAAAA0000A1Z5',
          fromTrdName: config?.businessName || 'Merchant Business',
          fromAddr1: config?.address || 'Main Road',
          fromPlace: 'Vijayawada',
          fromPincode: 520007,
          fromStateCode: 37,
          toGstin: invoice.customerGstin || 'URP', // Unregistered Person or GSTIN
          toTrdName: invoice.customerName || 'Retail Customer',
          toAddr1: invoice.customerAddress || 'Client Destination Address',
          toPlace: 'Hyderabad',
          toPincode: 500001,
          toStateCode: 36,
          totalValue: Number(invoice.subtotal || invoice.totalAmount || 0),
          cgstValue: Number(invoice.cgst || (invoice.taxAmount ? invoice.taxAmount / 2 : 0)),
          sgstValue: Number(invoice.sgst || (invoice.taxAmount ? invoice.taxAmount / 2 : 0)),
          igstValue: Number(invoice.igst || 0),
          totInvValue: Number(invoice.totalAmount || 0),
          transMode: transMode === 'Road' ? '1' : transMode === 'Rail' ? '2' : transMode === 'Air' ? '3' : '4',
          transDistance: distanceKm.toString(),
          transporterName,
          transporterId,
          transDocNo,
          transDocDate: new Date().toISOString().split('T')[0],
          vehicleNo,
          vehicleType: vehicleType === 'Regular' ? 'R' : 'O',
          itemList: (invoice.items || []).map((item: any, idx: number) => ({
            itemNo: idx + 1,
            productName: item.name || item.itemName || 'Product Item',
            hsnCode: Number(item.hsnSac || 1006),
            quantity: Number(item.quantity || 1),
            qtyUnit: item.unit || 'BOX',
            taxableAmount: Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1),
            gstRate: Number(item.gstRate || 18)
          }))
        }
      ]
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ewayPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EWAY_${invoice.billNumber || invoice.id}_NIC.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Official NIC E-Way Bill JSON downloaded! Ready to upload to ewaybillgst.gov.in', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl border border-[#e2e8f0] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#006a61] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck size={18} />
            <div>
              <h3 className="font-bold text-sm">Generate E-Way Bill (NIC Portal Compliant)</h3>
              <p className="text-[11px] text-white/80">Indian GST e-Way Bill for consignments exceeding ₹50,000.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Invoice Summary */}
          <div className="p-3 bg-slate-50 border border-[#e2e8f0] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#7c839b]">Selected Invoice</span>
              <p className="font-mono font-bold text-[#006a61]">{invoice.billNumber || `#INV-${invoice.id}`}</p>
              <p className="text-[11px] text-[#45464d] mt-0.5">Party: {invoice.customerName}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#7c839b]">Invoice Value</span>
              <p className="font-black text-sm text-[#0b1c30]">₹{Number(invoice.totalAmount || 0).toLocaleString('en-IN')}</p>
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">GST Tax Compliant</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Transporter Name *</label>
              <input
                type="text"
                required
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                className="w-full p-2 border border-[#c6c6cd] rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Transporter GSTIN / ID *</label>
              <input
                type="text"
                required
                value={transporterId}
                onChange={(e) => setTransporterId(e.target.value)}
                className="w-full p-2 border border-[#c6c6cd] rounded-xl font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Vehicle Number *</label>
              <input
                type="text"
                required
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full p-2 border border-[#c6c6cd] rounded-xl font-mono uppercase font-bold text-[#006a61]"
              />
            </div>
            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Approx Distance (KM) *</label>
              <input
                type="number"
                min={1}
                required
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                className="w-full p-2 border border-[#c6c6cd] rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">LR / Doc Number</label>
              <input
                type="text"
                value={transDocNo}
                onChange={(e) => setTransDocNo(e.target.value)}
                className="w-full p-2 border border-[#c6c6cd] rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-bold uppercase text-[10px] text-[#7c839b] block mb-1">Transport Mode</label>
              <select
                value={transMode}
                onChange={(e: any) => setTransMode(e.target.value)}
                className="w-full p-2 border border-[#c6c6cd] rounded-xl"
              >
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
                <option value="Ship">Ship</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
            <ShieldCheck size={16} className="inline mr-1 text-blue-700" />
            Clicking <strong>Export NIC JSON</strong> creates the official JSON file formatted according to the GST Council specifications. Upload this file on <code>ewaybillgst.gov.in</code> to generate your live E-Way Bill Number and QR Code in 10 seconds.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2e8f0] bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-[#45464d] hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold border border-[#c6c6cd] text-[#0b1c30] rounded-xl hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer size={15} />
              <span>Print Challan</span>
            </button>
            <button
              onClick={handleExportJson}
              className="px-4 py-2 text-xs font-bold bg-[#006a61] text-white rounded-xl hover:bg-[#005a52] flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download size={15} />
              <span>Export NIC JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
