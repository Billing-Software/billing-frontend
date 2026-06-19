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
  Terminal,
  LogOut,
  Building2
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onNewBill: () => void;
  onLogout: () => void;
  user: User | null;
}

export default function Sidebar({ currentTab, onChangeTab, onNewBill, onLogout, user }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'services', label: 'Services', icon: Sparkles },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'staff', label: 'Staff', icon: SquareUser },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside id="sidebar-panel" className="hidden md:flex flex-col h-screen py-6 px-4 bg-white border-r border-[#e2e8f0] w-[240px] shrink-0 z-30 justify-between">
      <div>
        {/* Branding */}
        <div className="mb-6 px-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#000000] text-white flex items-center justify-center font-bold shadow-sm">
            <Terminal size={22} className="text-[#86f2e4]" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-[#0b1c30] tracking-tight leading-tight">SmartBill Pro</h1>
            <p className="font-sans text-xs text-[#7c839b] font-medium leading-none mt-0.5">Admin Terminal</p>
          </div>
        </div>

        {/* Quick Action Button */}
        <button 
          id="new-bill-btn"
          onClick={onNewBill}
          className="w-full mb-6 bg-[#006a61] text-[#ffffff] font-sans text-sm font-semibold py-2.5 px-4 rounded-lg hover:bg-opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#006a61]/10"
        >
          <Plus size={16} />
          <span>New Bill</span>
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
            {user.avatarUrl && user.avatarUrl.trim() !== '' && user.avatarUrl !== 'null' && user.avatarUrl !== 'undefined' ? (
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
              <p className="font-sans text-[10px] text-[#45464d] leading-none truncate">{user.role}</p>
            </div>
            <button 
              id="logout-btn"
              title="Logout Securely" 
              onClick={onLogout}
              className="p-1.5 text-[#76777d] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
