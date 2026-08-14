import React from 'react';
import { Search, Bell, Grid, Share2, Plus, Menu, Building2, LogOut } from 'lucide-react';
import { User, Branch } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import logoText from '../../assets/BillCom-text.svg';

interface HeaderProps {
  currentBranch: Branch | null;
  onChangeBranch: (branch: Branch | null) => void;
  onOpenMobileMenu: () => void;
  onSearch: (term: string) => void;
  searchText: string;
  onQuickShare: () => void;
  onNewBill: () => void;
  user: User | null;
  onLogout: () => void;
}

export default function Header({
  currentBranch,
  onChangeBranch,
  onOpenMobileMenu,
  onSearch,
  searchText,
  onQuickShare,
  onNewBill,
  user,
  onLogout
}: HeaderProps) {
  const { branches } = useAuth();

  return (
    <header className="flex justify-between items-center h-16 px-4 md:px-8 bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-[#e2e8f0] shrink-0">
      {/* Left section: Hamburger on mobile, Search bar on desktop */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button 
          id="mobile-hamburger"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-[#45464d] hover:bg-[#eff4ff] rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Brand Logo for Mobile Only */}
        <div className="md:hidden flex items-center gap-1.5">
          <img src={logoText} alt="BillCom POS" className="h-6 object-contain" />
        </div>

        {/* Global Search Bar (Visible except on very small mobile) */}
        <div className="hidden sm:flex items-center bg-[#eff4ff] rounded-full px-3 py-1.5 border border-[#e2e8f0]/40">
          <Search size={16} className="text-[#45464d] ml-1 shrink-0" />
          <input
            id="global-search-input"
            type="text"
            value={searchText}
            onChange={(e) => onSearch(e.target.value)}
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs font-sans text-[#0b1c30] w-48 lg:w-64 placeholder-[#45464d]/60 ml-1.5 min-h-[1.5rem]"
            placeholder="Search catalog, clients, serials..."
          />
        </div>
      </div>

      {/* Right section: Quick actions, notifications, branch selection, user profile */}
      <div className="flex items-center gap-3">
        {/* Quick Actions (only on larger screens to avoid overlay clutter) */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            id="quick-share-btn"
            onClick={onQuickShare}
            className="px-4 py-1.5 bg-white border border-[#c6c6cd] text-[#000000] font-sans font-semibold text-xs rounded-lg hover:bg-[#eff4ff] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Share2 size={13} />
            <span>Quick Share</span>
          </button>
          <button
            id="quick-new-bill-btn"
            onClick={onNewBill}
            className="px-4 py-1.5 bg-[#006a61] text-[#ffffff] font-sans font-semibold text-xs rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-1.5 shadow-sm shadow-[#006a61]/10"
          >
            <Plus size={13} />
            <span>New Bill</span>
          </button>
        </div>

        {/* Small spacer/line */}
        <div className="hidden lg:block h-6 w-[1px] bg-[#e2e8f0]/80 mx-1"></div>

        {/* Dynamic Branch Switcher Dropdown */}
        {branches.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-[#e2e8f0] px-2.5 py-1.5 rounded-lg shadow-sm">
            <Building2 size={14} className="text-[#006a61] shrink-0" />
            <select
              id="branch-switcher"
              value={currentBranch?.id || ''}
              onChange={(e) => {
                const bId = parseInt(e.target.value, 10);
                const selected = branches.find(b => b.id === bId);
                if (selected) onChangeBranch(selected);
              }}
              className="bg-transparent border-none text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-0 max-w-[120px] pr-6 cursor-pointer uppercase tracking-wider outline-none p-0"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notifications & System Icons */}
        <button 
          id="notification-bell"
          title="Notifications"
          className="p-2 text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] rounded-full transition-all relative"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ba1a1a] rounded-full"></span>
        </button>
        <button 
          id="system-grid-btn"
          title="App Suite"
          className="hidden md:inline-flex p-2 text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] rounded-full transition-all"
        >
          <Grid size={18} />
        </button>
 
        {/* User Portrait preview */}
        {user && (
          <div className="flex items-center gap-2.5 md:border-l md:border-[#e2e8f0] md:pl-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user.name || user.username}</span>
              <span className="text-[10px] text-slate-500 font-semibold leading-none">{user.role}</span>
            </div>

            {user?.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.trim() !== '' && user.avatarUrl !== 'null' && user.avatarUrl !== 'undefined' ? (
              <img 
                referrerPolicy="no-referrer"
                src={user.avatarUrl} 
                alt={user.name || user.username} 
                className="hidden md:block w-8 h-8 rounded-full border border-[#c6c6cd] object-cover hover:opacity-85 transition-opacity cursor-pointer text-xs"
              />
            ) : (
              <div 
                title={user.businessName || "Workspace"}
                className="hidden md:flex w-8 h-8 rounded-full border border-[#c6c6cd] bg-[#eff4ff] text-[#006a61] items-center justify-center hover:opacity-85 transition-opacity cursor-pointer shadow-sm"
              >
                <Building2 size={16} />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
