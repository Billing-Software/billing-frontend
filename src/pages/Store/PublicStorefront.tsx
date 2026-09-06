import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  MessageCircle, 
  MapPin, 
  Phone, 
  User, 
  CheckCircle2, 
  X, 
  Store, 
  Tag, 
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';
import { useToast } from '../../hooks/useToast';

interface CartItem {
  id: number;
  name: string;
  price: number;
  mrp?: number;
  unit: string;
  quantity: number;
}

export default function PublicStorefront() {
  const { showToast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState<boolean>(false);

  // Customer Checkout Form
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Store Configuration
  const storeConfig = {
    name: 'BillCom SuperMart & General Store',
    tagline: 'Fresh Groceries, Staples & Daily Essentials Delivered in 30 Mins',
    phone: '9848012345',
    address: 'Shop 14, Main Road, Gandhi Nagar, Vijayawada',
    freeDeliveryAbove: 500,
    deliveryFee: 30
  };

  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const inv = await inventoryService.getAll();
        if (inv && inv.length > 0) {
          setProducts(inv);
        } else {
          // Fallback sample catalog
          setProducts([
            { id: 101, name: 'Sona Masoori Premium Rice (5kg)', category: 'Groceries', price: 320, mrp: 360, unit: 'Bag', stockQuantity: 20 },
            { id: 102, name: 'Tata Salt Vacuum Evaporated (1kg)', category: 'Groceries', price: 28, mrp: 30, unit: 'Pkt', stockQuantity: 50 },
            { id: 103, name: 'Aashirvaad Shudh Chakki Atta (5kg)', category: 'Flour & Grains', price: 245, mrp: 275, unit: 'Bag', stockQuantity: 15 },
            { id: 104, name: 'Freedom Refined Sunflower Oil (1L Pouch)', category: 'Edible Oils', price: 135, mrp: 155, unit: 'Pouch', stockQuantity: 30 },
            { id: 105, name: 'Toor Dal Premium Desi (1kg)', category: 'Dals & Pulses', price: 160, mrp: 180, unit: 'Pkt', stockQuantity: 25 },
            { id: 106, name: 'Cadbury Dairy Milk Silk Chocolate (60g)', category: 'Chocolates & Snacks', price: 80, mrp: 85, unit: 'Pcs', stockQuantity: 40 }
          ]);
        }
      } catch {
        setProducts([
          { id: 101, name: 'Sona Masoori Premium Rice (5kg)', category: 'Groceries', price: 320, mrp: 360, unit: 'Bag', stockQuantity: 20 },
          { id: 102, name: 'Tata Salt Vacuum Evaporated (1kg)', category: 'Groceries', price: 28, mrp: 30, unit: 'Pkt', stockQuantity: 50 }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product: any) => {
    const existing = cart.find(c => c.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: Number(product.sellingPrice || product.price || 0),
        mrp: Number(product.mrp || 0),
        unit: product.unit || 'Pcs',
        quantity: 1
      }]);
    }
    showToast(`Added ${product.name} to cart`, 'info');
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : null;
      }
      return c;
    }).filter(Boolean) as CartItem[]);
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryCharge = cartSubtotal >= storeConfig.freeDeliveryAbove || cartSubtotal === 0 ? 0 : storeConfig.deliveryFee;
  const cartTotal = cartSubtotal + deliveryCharge;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Submit WhatsApp Order
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deliveryAddress) {
      showToast('Please fill in your name, phone, and delivery address', 'error');
      return;
    }

    const orderId = `ORD-${Date.now().toString().slice(-4)}`;
    
    // Construct WhatsApp message
    let msg = `🛒 *NEW STORE ORDER: ${orderId}*\n`;
    msg += `--------------------------------\n`;
    msg += `👤 *Customer*: ${customerName}\n`;
    msg += `📞 *Phone*: ${customerPhone}\n`;
    msg += `📍 *Delivery Address*: ${deliveryAddress}\n`;
    if (orderNotes) msg += `📝 *Notes*: ${orderNotes}\n`;
    msg += `--------------------------------\n`;
    msg += `🛍️ *ITEMS ORDERED*:\n`;
    cart.forEach((item, idx) => {
      msg += `${idx + 1}. ${item.name} × ${item.quantity} ${item.unit} = ₹${(item.price * item.quantity).toLocaleString('en-IN')}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `💵 *Subtotal*: ₹${cartSubtotal.toLocaleString('en-IN')}\n`;
    if (deliveryCharge > 0) msg += `🚚 *Delivery Fee*: ₹${deliveryCharge}\n`;
    else msg += `🚚 *Delivery Fee*: FREE\n`;
    msg += `💰 *TOTAL AMOUNT*: *₹${cartTotal.toLocaleString('en-IN')}*\n`;
    msg += `--------------------------------\n`;
    msg += `Sent via *${storeConfig.name}* Online WhatsApp Catalog`;

    // Persist to local web orders for merchant
    try {
      const stored = localStorage.getItem('billcom_web_orders');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift({
        orderId,
        date: new Date().toISOString(),
        customerName,
        customerPhone,
        deliveryAddress,
        items: cart,
        totalAmount: cartTotal,
        status: 'Pending'
      });
      localStorage.setItem('billcom_web_orders', JSON.stringify(list));
    } catch {}

    // Open WhatsApp
    window.open(`https://wa.me/91${storeConfig.phone}?text=${encodeURIComponent(msg)}`, '_blank');

    setIsOrderPlaced(true);
    setIsCartOpen(false);
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col pb-24">
      {/* ─── Top Banner ─── */}
      <header className="bg-[#006a61] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Store size={22} className="text-[#86f2e4]" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight leading-tight">{storeConfig.name}</h1>
              <p className="text-[10px] text-white/80 line-clamp-1">{storeConfig.tagline}</p>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative bg-white text-[#006a61] font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-slate-100 cursor-pointer"
          >
            <ShoppingBag size={16} />
            <span>Cart ({totalItemsCount})</span>
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ─── Search & Category Chips ─── */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items, groceries, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-2xl shadow-xs focus:outline-none focus:border-[#006a61]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#006a61] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Product Catalog Grid ─── */}
      <main className="max-w-4xl mx-auto w-full px-4 pt-4">
        {isOrderPlaced && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <div>
                <p className="font-bold text-xs">Order dispatched to WhatsApp!</p>
                <p className="text-[10px] text-emerald-700">The merchant will confirm your delivery shortly.</p>
              </div>
            </div>
            <button onClick={() => setIsOrderPlaced(false)} className="text-xs font-bold text-emerald-800 underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredProducts.map((p) => {
            const inCart = cart.find(c => c.id === p.id);
            const price = Number(p.sellingPrice || p.price || 0);
            const mrp = Number(p.mrp || 0);

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-full h-24 bg-slate-100 rounded-xl mb-2 flex items-center justify-center text-slate-300">
                    <ShoppingBag size={28} />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-[#006a61] tracking-wider">{p.category || 'General'}</span>
                  <h3 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 mt-0.5">{p.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Per {p.unit || 'Pcs'}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {mrp > price && (
                      <span className="text-[9px] text-slate-400 line-through block">₹{mrp}</span>
                    )}
                    <span className="font-black text-sm text-slate-900">₹{price}</span>
                  </div>

                  {inCart ? (
                    <div className="flex items-center bg-[#006a61] text-white rounded-lg p-0.5 shadow-xs">
                      <button
                        onClick={() => updateQuantity(p.id, -1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-black/10 rounded cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold px-1.5">{inCart.quantity}</span>
                      <button
                        onClick={() => updateQuantity(p.id, 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-black/10 rounded cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(p)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ─── Sticky Cart Bottom Bar (Mobile) ─── */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 shadow-2xl z-20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-medium">{totalItemsCount} items in cart</p>
              <h4 className="font-black text-base text-slate-900">₹{cartTotal.toLocaleString('en-IN')}</h4>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-[#006a61] text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#005a52] transition-all cursor-pointer shadow-md"
            >
              <span>View Cart &amp; Checkout</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Cart Drawer & WhatsApp Checkout ─── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-5 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#006a61]" />
                  <h3 className="font-black text-base text-slate-900">Your Shopping Cart</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Items List */}
              <div className="py-4 space-y-2.5 max-h-56 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[10px] text-slate-500">₹{item.price} per {item.unit}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 rounded">
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 rounded">
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="font-black text-xs w-14 text-right">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold">₹{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge:</span>
                  <span className="font-semibold">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-200 text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-[#006a61]">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Delivery Details Form */}
              <form id="checkout-form" onSubmit={handlePlaceOrder} className="mt-4 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Delivery Details</h4>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Your Full Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number (WhatsApp) *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Complete Delivery Address / Flat No / Landmark *"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Special instructions (e.g. Leave with guard)"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                form="checkout-form"
                disabled={cart.length === 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                <MessageCircle size={18} />
                <span>Place Order via WhatsApp (₹{cartTotal.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
