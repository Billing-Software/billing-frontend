import React, { useState, useEffect } from 'react';
import { Search, X, Check, FileText, Tag, Loader2, Sparkles, Filter } from 'lucide-react';
import { businessConfigService } from '../../services/businessConfig.service';
import { HSNItem, SACItem } from '../../types';

interface HSNSacSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'Goods' | 'Services';
  onSelect: (code: string, description: string, gstRate: number) => void;
}

const GOODS_QUICK_FILTERS = [
  'All',
  'Groceries',
  'Dairy & Bakery',
  'Textiles',
  'Electronics',
  'Personal Care',
  'Hardware'
];

const SERVICES_QUICK_FILTERS = [
  'All',
  'Hospitality & Food',
  'Salon & Wellness',
  'IT & Digital',
  'Repairs',
  'Transport',
  'Healthcare'
];

export default function HSNSacSearchModal({ isOpen, onClose, type, onSelect }: HSNSacSearchModalProps) {
  const [activeType, setActiveType] = useState<'Goods' | 'Services'>(type);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);
  const [hsnResults, setHsnResults] = useState<HSNItem[]>([]);
  const [sacResults, setSacResults] = useState<SACItem[]>([]);

  // Sync activeType when prop changes
  useEffect(() => {
    setActiveType(type);
  }, [type]);

  useEffect(() => {
    if (!isOpen) return;

    const performSearch = async () => {
      setLoading(true);
      try {
        const queryTerm = activeFilter !== 'All' ? `${searchQuery} ${activeFilter}` : searchQuery;
        if (activeType === 'Goods') {
          const res = await businessConfigService.searchHSN(queryTerm);
          setHsnResults(res);
        } else {
          const res = await businessConfigService.searchSAC(queryTerm);
          setSacResults(res);
        }
      } catch (err) {
        console.error('Failed to search HSN/SAC', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, activeType, activeFilter]);

  if (!isOpen) return null;

  const quickFilters = activeType === 'Goods' ? GOODS_QUICK_FILTERS : SERVICES_QUICK_FILTERS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006a61]/10 flex items-center justify-center text-[#006a61] shrink-0">
              <Tag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-extrabold text-slate-900 text-base">
                  Official GST Master Directory
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold bg-[#006a61]/10 text-[#006a61] px-2 py-0.5 rounded-full">
                  <Sparkles size={10} />
                  CBIC Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Instant statutory codes, standard tax slabs & UQC units for Indian GST invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Goods vs Services Segmented Toggle */}
        <div className="px-5 pt-3 pb-2 bg-white flex items-center justify-between border-b border-slate-100 gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveType('Goods');
                setActiveFilter('All');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'Goods'
                  ? 'bg-white text-[#006a61] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📦 Goods (HSN Codes)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveType('Services');
                setActiveFilter('All');
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'Services'
                  ? 'bg-white text-[#006a61] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛠️ Services (SAC Codes)
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            Click any row to auto-apply Code & Tax Rate
          </span>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeType === 'Goods'
                  ? 'Type product name or code (e.g. "Rice", "T-Shirt", "Mobile", "Cement", "8517")...'
                  : 'Type service name or code (e.g. "Haircut", "Restaurant", "Software", "AC Repair", "9963")...'
              }
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#006a61] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
            <Filter size={12} className="text-slate-400 shrink-0 mr-0.5" />
            {quickFilters.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveFilter(chip)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  activeFilter === chip
                    ? 'bg-[#006a61] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin text-[#006a61]" size={28} />
              <span className="text-xs font-semibold">Filtering Indian GST master catalog...</span>
            </div>
          ) : activeType === 'Goods' ? (
            hsnResults.length > 0 ? (
              hsnResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.code, item.description, item.defaultGSTPercentage);
                    onClose();
                  }}
                  className="p-3 bg-white hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 rounded-xl transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        HSN {item.code}
                      </span>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200/60">
                        {item.defaultGSTPercentage}% GST
                      </span>
                      {item.uqc && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          Unit: {item.uqc}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 font-semibold leading-relaxed group-hover:text-emerald-900 transition-colors">
                      {item.description}
                    </p>
                  </div>
                  <div className="shrink-0 p-2 text-slate-300 group-hover:text-emerald-700 group-hover:bg-emerald-100/60 rounded-lg transition-colors">
                    <Check size={18} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400">
                <FileText className="mx-auto mb-2 opacity-50 text-slate-400" size={32} />
                <p className="text-xs font-bold text-slate-600">No HSN codes found for "{searchQuery}"</p>
                <p className="text-[11px] mt-1 text-slate-400">Try searching broad terms like "rice", "shirt", "oil", "phone" or 4-digit code</p>
              </div>
            )
          ) : (
            sacResults.length > 0 ? (
              sacResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.code, item.description, item.defaultGSTPercentage);
                    onClose();
                  }}
                  className="p-3 bg-white hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-300 rounded-xl transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                >
                  <div className="space-y-1 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                        SAC {item.code}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200/60">
                        {item.defaultGSTPercentage}% GST
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold leading-relaxed group-hover:text-indigo-900 transition-colors">
                      {item.description}
                    </p>
                  </div>
                  <div className="shrink-0 p-2 text-slate-300 group-hover:text-indigo-700 group-hover:bg-indigo-100/60 rounded-lg transition-colors">
                    <Check size={18} />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-slate-400">
                <FileText className="mx-auto mb-2 opacity-50 text-slate-400" size={32} />
                <p className="text-xs font-bold text-slate-600">No SAC codes found for "{searchQuery}"</p>
                <p className="text-[11px] mt-1 text-slate-400">Try searching "salon", "software", "restaurant", "repair", "transport" or 6-digit code</p>
              </div>
            )
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Official CBIC GST Rate Master</span>
          <span>Press <strong>Esc</strong> to close</span>
        </div>
      </div>
    </div>
  );
}
