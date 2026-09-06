import React, { useState, useEffect } from 'react';
import { 
  Store, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  ShoppingBag, 
  MessageCircle, 
  Phone, 
  Sliders, 
  QrCode, 
  Printer, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useBusinessConfig } from '../../context/BusinessConfigContext';
import { useToast } from '../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

interface WebOrder {
  orderId: string;
  date: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: any[];
  totalAmount: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
}

export default function StoreManager() {
  const { config } = useBusinessConfig();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [copied, setCopied] = useState<boolean>(false);
  const [orders, setOrders] = useState<WebOrder[]>([]);

  // Settings
  const [storeName, setStoreName] = useState<string>(config?.businessName || 'My Online Store');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('9848012345');
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState<number>(500);
  const [deliveryFee, setDeliveryFee] = useState<number>(30);
  const [isStoreLive, setIsStoreLive] = useState<boolean>(true);

  const storeUrl = `${window.location.origin}/#/shop`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('billcom_web_orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      } else {
        // Mock initial order
        const initialOrder: WebOrder = {
          orderId: 'ORD-9821',
          date: new Date().toISOString(),
          customerName: 'Kalyan Ram',
          customerPhone: '9848099887',
          deliveryAddress: 'Flat 402, Sai Residency, Main Road',
          items: [
            { name: 'Sona Masoori Rice (5kg)', quantity: 2, price: 320 },
            { name: 'Freedom Sunflower Oil 1L', quantity: 3, price: 135 }
          ],
          totalAmount: 1045,
          status: 'Pending'
        };
        setOrders([initialOrder]);
        localStorage.setItem('billcom_web_orders', JSON.stringify([initialOrder]));
      }
    } catch {}
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    showToast('Online Store URL copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConvertOrderToBill = (order: WebOrder) => {
    // Save order items into billing cart and navigate to /billing
    try {
      localStorage.setItem('billcom_order_to_convert', JSON.stringify(order));
      showToast(`Loading order ${order.orderId} onto POS register...`, 'info');
      navigate('/billing');
    } catch {
      navigate('/billing');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#0b1c30] tracking-tight">My Online Store (WhatsApp Catalog)</h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live &amp; Active
            </span>
          </div>
          <p className="text-xs text-[#7c839b] font-medium mt-1">
            Accept online product orders directly from customers via WhatsApp with 1-click POS billing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-white border border-[#c6c6cd] text-[#0b1c30] font-semibold text-xs py-2.5 px-3.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
          >
            <ExternalLink size={15} />
            <span>Open Public Store</span>
          </a>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-[#006a61] text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-[#005a52] transition-all cursor-pointer shadow-sm shadow-[#006a61]/20"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Link Copied!' : 'Copy Store Link'}</span>
          </button>
        </div>
      </div>

      {/* ─── Hero Store Share Card ─── */}
      <div className="bg-gradient-to-r from-[#006a61] to-[#004d47] text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-[#86f2e4]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#86f2e4]">Instant Customer Web Store</span>
          </div>
          <h2 className="text-xl font-black">{storeName}</h2>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            Share your catalog link on WhatsApp Status, Facebook, and Instagram. Customers can browse your inventory and send ordered carts straight to your phone.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <span className="font-mono text-xs bg-black/25 px-3 py-1.5 rounded-xl border border-white/20 select-all truncate max-w-xs">
              {storeUrl}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 bg-white text-[#006a61] rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Quick QR Code Counter Standee */}
        <div className="bg-white p-4 rounded-2xl shadow-xl text-slate-900 flex flex-col items-center shrink-0">
          <div className="w-28 h-28 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center p-2">
            <QrCode size={80} className="text-slate-800" />
          </div>
          <p className="text-[10px] font-bold text-slate-800 mt-2">Scan &amp; Order Online</p>
          <button
            onClick={() => window.print()}
            className="text-[9px] font-bold text-[#006a61] hover:underline mt-0.5 cursor-pointer flex items-center gap-1"
          >
            <Printer size={10} />
            <span>Print Counter Standee</span>
          </button>
        </div>
      </div>

      {/* ─── Incoming Web Orders ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#006a61]" />
            <h3 className="font-bold text-sm text-[#0b1c30]">Incoming Web &amp; WhatsApp Orders ({orders.length})</h3>
          </div>
          <span className="text-[11px] text-[#7c839b] font-medium">Orders placed via your digital store link</span>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#e2e8f0] text-[#7c839b] uppercase text-[10px] font-bold">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Delivery Address</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Order Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {orders.map((ord) => (
                  <tr key={ord.orderId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#006a61]">{ord.orderId}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#0b1c30]">{ord.customerName}</p>
                      <p className="text-[10px] text-[#7c839b] flex items-center gap-1">
                        <Phone size={10} />
                        <span>+91 {ord.customerPhone}</span>
                      </p>
                    </td>
                    <td className="py-3 px-4 text-[#45464d] max-w-xs truncate">{ord.deliveryAddress}</td>
                    <td className="py-3 px-4 text-[#45464d]">
                      {ord.items.map(i => `${i.name} (×${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#0b1c30]">
                      ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleConvertOrderToBill(ord)}
                        className="px-3 py-1.5 bg-[#006a61] hover:bg-[#005a52] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <span>Convert to Bill</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No web orders received yet. Share your store link on WhatsApp!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
