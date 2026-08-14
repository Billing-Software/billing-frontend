import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  Sparkles, 
  Boxes, 
  SquareUser, 
  Settings, 
  HelpCircle,
  Plus,
  LogOut,
  Building2,
  Wallet,
  FileText,
  BadgeCheck,
  FileBarChart
} from 'lucide-react';
import { User } from '../../types';
import logoText from '../../assets/BillCom-text.svg';
import { useBusinessConfig } from '../../context/BusinessConfigContext';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onNewBill: () => void;
  onLogout: () => void;
  user: User | null;
}

export default function Sidebar({ currentTab, onChangeTab, onNewBill, onLogout, user }: SidebarProps) {
  const { config, t, hasFeature } = useBusinessConfig();

  const menuItems = [
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

  const businessTypeBadge = config?.businessType || 'General Retail Store';

  return (
    <aside id="sidebar-panel" className="hidden md:flex flex-col h-screen py-6 px-4 bg-white border-r border-[#e2e8f0] w-[240px] shrink-0 z-30 justify-between">
      <div>
        {/* Branding */}
        <div className="mb-4 px-2 flex flex-col items-start gap-1">
          <img src={logoText} alt="SmartBill Pro" className="h-8 object-contain" />
          <div className="flex items-center gap-1 bg-[#006a61]/10 text-[#006a61] px-2 py-0.5 rounded-full text-[10px] font-bold mt-1">
            <BadgeCheck size={11} />
            <span className="truncate max-w-[170px]" title={businessTypeBadge}>{businessTypeBadge}</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <button 
          id="new-bill-btn"
          onClick={onNewBill}
          className="w-full mb-5 bg-[#006a61] text-[#ffffff] font-sans text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#006a61]/10"
        >
          <Plus size={16} />
          <span>New {t('invoice')}</span>
        </button>

        {/* Menu Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
             const IconComponent = item.icon;
             const isActive = currentTab === item.id;
             return (
               <button
                 key={item.id}
                 id={`nav-${item.id}`}
                 onClick={() => onChangeTab(item.id)}
                 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                   isActive 
                     ? 'bg-[#86f2e4]/30 text-[#006f66] scale-[0.98]' 
                     : 'text-[#45464d] hover:bg-[#eff4ff] hover:text-[#0b1c30]'
                 }`}
               >
                 <IconComponent size={18} className={isActive ? 'text-[#006f66]' : 'text-[#76777d]'} />
                 <span>{item.label}</span>
               </button>
             );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[#e2e8f0]">
        <button
          id="nav-help"
          onClick={() => onChangeTab('help')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
            currentTab === 'help' 
              ? 'bg-[#eff4ff] text-[#006a61]' 
              : 'text-[#45464d] hover:bg-[#eff4ff]'
          }`}
        >
          <HelpCircle size={18} className="text-[#76777d]" />
          <span>Help Center</span>
        </button>

        {user && (
          <div className="mt-4 pt-3 flex items-center gap-2.5 px-1 border-t border-[#e2e8f0]/40">
            {user?.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.trim() !== '' && user.avatarUrl !== 'null' && user.avatarUrl !== 'undefined' ? (
              <img 
                referrerPolicy="no-referrer"
                src={user.avatarUrl} 
                alt={user.name || user.username} 
                className="w-8 h-8 rounded-full object-cover border border-[#c6c6cd]"
              />
            ) : (
              <div 
                title={user.businessName || "Workspace"}
                className="w-8 h-8 rounded-full border border-[#c6c6cd] bg-[#eff4ff] text-[#006a61] flex items-center justify-center shadow-sm shrink-0"
              >
                <Building2 size={16} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-xs font-semibold text-[#0b1c30] truncate">{user.name || user.username}</p>
              <p className="font-sans text-[9px] text-[#45464d] leading-none truncate">{user.role}</p>
              <p className="font-sans text-[9px] text-[#7c839b] leading-normal truncate mt-0.5" title={user.businessName}>
                {user.businessName}
              </p>
            </div>
            <button 
              id="sidebar-logout-icon-btn"
              title="Logout Securely" 
              onClick={onLogout}
              className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
