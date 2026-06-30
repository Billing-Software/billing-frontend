import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Outlet } from 'react-router-dom';
import { 
  X, 
  LogOut, 
  Building2,
  LayoutDashboard,
  Receipt,
  Users,
  Sparkles,
  Boxes,
  SquareUser,
  Settings,
  FileText
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { User } from '../types';
import logoText from '../assets/BillCom-text.svg';

interface MainLayoutProps {
  children?: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  currentUser: User | null;
  currentBranch: 'Main' | 'Downtown';
  setCurrentBranch: (branch: 'Main' | 'Downtown') => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  searchText: string;
  setSearchText: (term: string) => void;
  handleQuickShare: () => void;
}

export default function MainLayout({
  children,
  activeTab,
  setActiveTab,
  onLogout,
  currentUser,
  currentBranch,
  setCurrentBranch,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  searchText,
  setSearchText,
  handleQuickShare
}: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 1. Desktop Navigation Side Panel */}
      <Sidebar 
        currentTab={activeTab} 
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onNewBill={() => setActiveTab('billing')}
        onLogout={onLogout}
        user={currentUser}
      />

      {/* 2. Primary Workspace Panel */}
      <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden relative">
        <Header 
          currentBranch={currentBranch}
          onChangeBranch={setCurrentBranch}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          searchText={searchText}
          onSearch={(v) => {
            setSearchText(v);
            // Dynamic redirection for easier search experience
            if (v && activeTab === 'dashboard') {
              setActiveTab('services');
            }
          }}
          onQuickShare={handleQuickShare}
          onNewBill={() => setActiveTab('billing')}
          user={currentUser}
          onLogout={onLogout}
        />

        {/* Dynamic Inner views container with scroll support */}
        <main className="flex-1 overflow-y-auto w-full min-w-0 overflow-x-hidden p-4 md:p-8 bg-[#f8f9ff]">
          {children || <Outlet />}
        </main>
      </div>

      {/* 3. Mobile Sidebar Drawer Overlay (Slide-out menu for small screens) */}
      <AnimatePresence>
        {isMobileMenuOpen && currentUser && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Dark blur backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            ></motion.div>

            {/* Sidebar Slide-out container */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-72 bg-white h-full flex flex-col justify-between py-6 px-4 shrink-0 shadow-xl"
            >
              <div>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <img src={logoText} alt="SmartBill Pro" className="h-6 object-contain" />
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-[#7c839b] hover:text-[#0b1c30]"
                  >
                    <X size={18} />
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setActiveTab('billing');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-[#006a61] text-white py-2 rounded-lg font-semibold text-xs mb-6 flex items-center justify-center gap-1.5"
                >
                  <span>New Invoice Bill</span>
                </button>

                {/* Mobile Menu Links */}
                <nav className="space-y-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'billing', label: 'Billing', icon: Receipt },
                    { id: 'invoices', label: 'Invoices', icon: FileText },
                    { id: 'customers', label: 'Customers', icon: Users },
                    { id: 'services', label: 'Services', icon: Sparkles },
                    { id: 'inventory', label: 'Inventory', icon: Boxes },
                    ...(currentUser?.role === 'Owner' ? [
                      { id: 'staff', label: 'Staff', icon: SquareUser },
                      { id: 'settings', label: 'Settings', icon: Settings },
                    ] : [])
                  ].map(tab => {
                    const IconComponent = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          isActive 
                            ? 'bg-[#86f2e4]/30 text-[#006f66]' 
                            : 'text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                        }`}
                      >
                        <IconComponent size={18} className={isActive ? 'text-[#006f66]' : 'text-[#76777d]'} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Logout HUD */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-4">
                  {currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '' && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined' ? (
                    <img 
                      referrerPolicy="no-referrer"
                      src={currentUser.avatarUrl} 
                      alt={currentUser.name || currentUser.username} 
                      className="w-8 h-8 rounded-full border object-cover"
                    />
                  ) : (
                    <div 
                      title={currentUser.businessName || "Workspace"}
                      className="w-8 h-8 rounded-full border border-[#c6c6cd] bg-[#eff4ff] text-[#006a61] flex items-center justify-center shadow-sm shrink-0"
                    >
                      <Building2 size={16} />
                    </div>
                  )}
                  <div>
                    <h5 className="text-xs font-bold text-[#0b1c30]">{currentUser.name || currentUser.username}</h5>
                    <p className="text-[9px] text-[#45464d] font-semibold">{currentUser.role}</p>
                    <p className="text-[9px] text-[#7c839b] font-semibold mt-0.5 truncate max-w-[160px]">{currentUser.businessName} (ID: {currentUser.businessId})</p>
                  </div>
                </div>


                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-[#ba1a1a] bg-[#ffdad6]/40 hover:bg-[#ffdad6] rounded-xl transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out Securely</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
