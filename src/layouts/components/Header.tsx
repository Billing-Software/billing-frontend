import React from 'react';
import { Search, Bell, Grid, Share2, Plus, Menu, LogOut } from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
  currentBranch: 'Main' | 'Downtown';
  onChangeBranch: (branch: 'Main' | 'Downtown') => void;
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
          <span className="font-display text-[#000000] font-black text-base tracking-tight leading-none">SmartBill Pro</span>
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

      {/* Middle section: Branch selectors */}
      <nav id="branch-nav" className="hidden md:flex items-center gap-6 h-full">
        <button
          id="branch-main-btn"
          onClick={() => onChangeBranch('Main')}
          className={`relative h-16 flex items-center px-1 text-xs font-semibold leading-none tracking-wider uppercase transition-all ${
            currentBranch === 'Main' 
              ? 'text-[#006a61] border-b-2 border-[#006a61]' 
              : 'text-[#45464d] hover:text-[#0b1c30]'
          }`}
        >
          Main Branch
        </button>
        <button
          id="branch-downtown-btn"
          onClick={() => onChangeBranch('Downtown')}
          className={`relative h-16 flex items-center px-1 text-xs font-semibold leading-none tracking-wider uppercase transition-all ${
            currentBranch === 'Downtown' 
              ? 'text-[#006a61] border-b-2 border-[#006a61]' 
              : 'text-[#45464d] hover:text-[#0b1c30]'
          }`}
        >
          Downtown Hub
        </button>
      </nav>

      {/* Right section: Quick actions, notifications, user profile */}
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
          className="p-2 text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30] rounded-full transition-all"
        >
          <Grid size={18} />
        </button>

        {/* Simple User Portrait popup preview trigger */}
        {user && (
          <div className="flex items-center gap-2 border-l border-[#e2e8f0]/40 pl-3">
            <img 
              referrerPolicy="no-referrer"
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-8 h-8 rounded-full border border-[#c6c6cd] object-cover hover:opacity-85 transition-opacity cursor-pointer text-xs"
            />
            {/* Quick Mobile Logout indicator */}
            <button
              onClick={onLogout}
              className="md:hidden p-1 bg-[#ffdad6]/40 text-[#ba1a1a] rounded hover:bg-[#ffdad6] transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
