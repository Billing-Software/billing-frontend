import React, { useEffect } from 'react';
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
  FileText,
  Wallet,
  FileBarChart,
  Crown
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { User, Branch } from '../types';
import logoText from '../assets/BillCom-text.svg';

import { useBusinessConfig } from '../context/BusinessConfigContext';
import { getPlanDetails } from '../constants/subscription.constants';

interface MainLayoutProps {
  children?: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  currentUser: User | null;
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
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
  const { t, hasFeature } = useBusinessConfig();

  // Global Keyboard Shortcuts (Alt+S: Sale, Alt+D: Dashboard, Alt+C: Customers, Alt+I: Invoices, Alt+P: Products)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in text input/textarea
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isTyping = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (e.altKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setActiveTab('billing');
        } else if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          setActiveTab('dashboard');
        } else if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          setActiveTab('customers');
        } else if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          setActiveTab('invoices');
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setActiveTab('inventory');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [setActiveTab]);

  const mobileMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, show: hasFeature('dashboard') },
    { id: 'billing', label: `New ${t('invoice')}`, icon: Receipt, show: hasFeature('billing') },
    { id: 'invoices', label: t('invoice', true), icon: FileText, show: hasFeature('invoices') },
    { id: 'reports', label: 'GST Reports', icon: FileBarChart, show: hasFeature('reports') },
    { id: 'customers', label: t('customer', true), icon: Users, show: hasFeature('customers') },
    { id: 'services', label: t('service', true), icon: Sparkles, show: hasFeature('services') },
    { id: 'inventory', label: t('product', true), icon: Boxes, show: hasFeature('inventory') && hasFeature('products') },
    { id: 'branches', label: 'Branches', icon: Building2, show: hasFeature('branches') },
    { id: 'staff', label: t('staff', true), icon: SquareUser, show: hasFeature('staff_manage') },
    { id: 'expenses', label: 'Expenses', icon: Wallet, show: hasFeature('expenses') },
    { id: 'settings', label: 'Settings', icon: Settings, show: hasFeature('settings') },
  ].filter(item => item.show);

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
                    <img src={logoText} alt="BillCom POS" className="h-6 object-contain" />
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
                  {mobileMenuItems.map(tab => {
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
                  {currentUser?.avatarUrl && typeof currentUser.avatarUrl === 'string' && currentUser.avatarUrl.trim() !== '' && currentUser.avatarUrl !== 'null' && currentUser.avatarUrl !== 'undefined' ? (
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="text-xs font-bold text-[#0b1c30] truncate">{currentUser.name || currentUser.username}</h5>
                      {(() => {
                        const plan = getPlanDetails(currentUser.activePlanId);
                        const isTrial = currentUser.isTrial || currentUser.subscriptionStatus?.toLowerCase() === 'trial';
                        const isTrialExpired = currentUser.subscriptionStatus?.toLowerCase() === 'trialexpired';
                        return (
                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              id="mobile-subscription-badge"
                              onClick={() => {
                                setActiveTab('settings?tab=subscription');
                                setIsMobileMenuOpen(false);
                              }}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase tracking-wider border cursor-pointer ${plan.badgeBg} ${plan.badgeText} ${plan.badgeBorder}`}
                              title="Manage Subscription Plans"
                            >
                              <Crown size={9} className={plan.crownColor} />
                              <span>{plan.shortName}</span>
                            </button>
                            {isTrial && (
                              <span 
                                onClick={() => {
                                  setActiveTab('settings?tab=subscription');
                                  setIsMobileMenuOpen(false);
                                }}
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 cursor-pointer"
                              >
                                ⚡ Trial
                              </span>
                            )}
                            {isTrialExpired && (
                              <span 
                                onClick={() => {
                                  setActiveTab('settings?tab=subscription');
                                  setIsMobileMenuOpen(false);
                                }}
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 cursor-pointer"
                              >
                                ⚠️ Expired
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
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
