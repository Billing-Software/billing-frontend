import React, { useState, useEffect } from 'react';
import { Search, X, Check, FileText, Tag, Loader2 } from 'lucide-react';
import { businessConfigService } from '../../services/businessConfig.service';
import { HSNItem, SACItem } from '../../types';

interface HSNSacSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'Goods' | 'Services';
  onSelect: (code: string, description: string, gstRate: number) => void;
}

export default function HSNSacSearchModal({ isOpen, onClose, type, onSelect }: HSNSacSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [hsnResults, setHsnResults] = useState<HSNItem[]>([]);
  const [sacResults, setSacResults] = useState<SACItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const performSearch = async () => {
      setLoading(true);
      try {
        if (type === 'Goods') {
          const res = await businessConfigService.searchHSN(searchQuery);
          setHsnResults(res);
        } else {
          const res = await businessConfigService.searchSAC(searchQuery);
          setSacResults(res);
        }
      } catch (err) {
        console.error('Failed to search HSN/SAC', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [isOpen, searchQuery, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-display font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <Tag className="text-[#006a61]" size={20} />
              <span>Search {type === 'Goods' ? 'HSN Code (Goods)' : 'SAC Code (Services)'}</span>
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Type product name, trade term, or code (e.g. "shirt", "rice", "haircut", "software")
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={type === 'Goods' ? 'Search "T-Shirt", "Rice", "Sugar", "6109"...' : 'Search "Haircut", "Website", "Restaurant", "996331"...'}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#006a61] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100/60">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin text-[#006a61]" size={24} />
              <span className="text-xs font-semibold">Searching GST master data...</span>
            </div>
          ) : type === 'Goods' ? (
            hsnResults.length > 0 ? (
              hsnResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.code, item.description, item.defaultGSTPercentage);
                    onClose();
                  }}
                  className="pt-2.5 first:pt-0 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-[#006a61]/10 text-[#006a61] px-2 py-0.5 rounded">
                        HSN {item.code}
                      </span>
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200/50">
                        {item.defaultGSTPercentage}% GST ({item.uqc})
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold leading-relaxed group-hover:text-[#006a61] transition-colors">
                      {item.description}
                    </p>
                  </div>
                  <button className="p-2 text-slate-300 group-hover:text-[#006a61] group-hover:bg-[#006a61]/10 rounded-lg transition-colors">
                    <Check size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400">
                <FileText className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-xs font-semibold">No HSN codes found for "{searchQuery}"</p>
                <p className="text-[11px] mt-1 text-slate-400">Try searching by category or 4-digit code</p>
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
                  className="pt-2.5 first:pt-0 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        SAC {item.code}
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200/50">
                        {item.defaultGSTPercentage}% GST
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-semibold leading-relaxed group-hover:text-[#006a61] transition-colors">
                      {item.description}
                    </p>
                  </div>
                  <button className="p-2 text-slate-300 group-hover:text-[#006a61] group-hover:bg-[#006a61]/10 rounded-lg transition-colors">
                    <Check size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400">
                <FileText className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-xs font-semibold">No SAC codes found for "{searchQuery}"</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
