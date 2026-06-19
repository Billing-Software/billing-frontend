import React from 'react';
import { motion } from 'motion/react';
import { Calculator, MessageCircle } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from '../pages/Dashboard/Dashboard';
import Billing from '../pages/Billing/Billing';
import Services from '../pages/Services/Services';
import Customers from '../pages/Customers/Customers';
import Inventory from '../pages/Inventory/Inventory';
import Staff from '../pages/Staff/Staff';
import Settings from '../pages/Settings/Settings';
import { useAuth } from '../hooks/useAuth';

// Types
import { 
  Customer, 
  Service, 
  InventoryItem, 
  StaffMember, 
  Bill, 
  BusinessProfile, 
  WhatsAppSettings 
} from '../types';

interface AppRoutesProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  bills: Bill[];
  setBills: React.Dispatch<React.SetStateAction<Bill[]>>;
  businessProfile: BusinessProfile;
  setBusinessProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  whatsAppSettings: WhatsAppSettings;
  setWhatsAppSettings: React.Dispatch<React.SetStateAction<WhatsAppSettings>>;
  searchText: string;
  setSearchText: (term: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
}

export default function AppRoutes({
  activeTab,
  setActiveTab,
  customers,
  setCustomers,
  services,
  setServices,
  inventory,
  setInventory,
  staff,
  setStaff,
  bills,
  setBills,
  businessProfile,
  setBusinessProfile,
  whatsAppSettings,
  setWhatsAppSettings,
  searchText,
  setSearchText,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleLogout
}: AppRoutesProps) {
  const { currentUser, currentBranch, setCurrentBranch } = useAuth();

  // Core callback modifiers
  const handleAddNewBill = (newBill: Bill) => {
    setBills(prev => [newBill, ...prev]);
    
    // Automatically update cumulative crew performance points
    setStaff(prev => prev.map(member => {
      if (member.role === 'Manager' || member.role === 'Cashier') {
        return {
          ...member,
          totalBills: member.totalBills + 1,
          revenueGen: member.revenueGen + Math.round(newBill.totalAmount)
        };
      }
      return member;
    }));
  };

  const handleAddNewCustomer = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleAddNewService = (newService: Service) => {
    setServices(prev => [newService, ...prev]);
  };

  const handleUpdateService = (updatedService: Service) => {
    setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleAddNewInventory = (newItem: InventoryItem) => {
    setInventory(prev => [newItem, ...prev]);
  };

  const handleUpdateInventory = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
  };

  const handleDeleteInventory = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  const handleAddNewStaff = (newMember: StaffMember) => {
    setStaff(prev => [newMember, ...prev]);
  };

  const handleUpdateStaff = (updatedMember: StaffMember) => {
    setStaff(prev => prev.map(s => s.id === updatedMember.id ? updatedMember : s));
  };

  const handleDeleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  const handleQuickShare = () => {
    const shareMessage = `SmartBill Pro Gateway for ${currentBranch} Branch is online: All cash registers are fully operational. Current revenue levels are green.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareMessage);
      alert("Access webhook message copied to workspace clipboard!");
    } else {
      alert(shareMessage);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            bills={bills} 
            onNavigateToBilling={() => setActiveTab('billing')}
            onNavigateToStaff={() => setActiveTab('staff')}
            onNavigateToServices={() => setActiveTab('services')}
            currentBranch={currentBranch}
          />
        );
      case 'billing':
        return (
          <Billing 
            services={services} 
            customers={customers}
            onAddBill={handleAddNewBill}
            onAddCustomer={handleAddNewCustomer}
          />
        );
      case 'services':
        return (
          <Services 
            services={services}
            onAddService={handleAddNewService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
          />
        );
      case 'customers':
        return (
          <Customers 
            customers={customers}
            onAddCustomer={handleAddNewCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case 'inventory':
        return (
          <Inventory 
            inventory={inventory}
            onAddItem={handleAddNewInventory}
            onUpdateItem={handleUpdateInventory}
            onDeleteItem={handleDeleteInventory}
          />
        );
      case 'staff':
        return (
          <Staff 
            staff={staff}
            onAddStaff={handleAddNewStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
          />
        );
      case 'settings':
        return (
          <Settings 
            profile={businessProfile}
            onUpdateProfile={setBusinessProfile}
            whatsApp={whatsAppSettings}
            onUpdateWhatsApp={setWhatsAppSettings}
          />
        );
      case 'help':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl border p-8 shadow-sm space-y-6"
          >
            <div>
              <h2 className="font-display text-2xl font-black text-[#0b1c30]">Help &amp; System Manual</h2>
              <p className="font-sans text-xs text-[#7c839b] font-semibold uppercase mt-1">Operational guidelines for point of sale triggers.</p>
            </div>

            <div className="space-y-4 font-sans text-sm text-[#45464d]">
              <div className="p-4 bg-[#eff4ff] border rounded-lg">
                <h4 className="font-bold text-[#0b1c30] flex items-center gap-2">
                  <Calculator size={16} />
                  <span>Interactive Walkthrough</span>
                </h4>
                <p className="mt-1 leading-normal text-xs text-[#45464d] font-medium">
                  Add clients, update pricing models, manage stocks and generate point-of-sale invoices. On completion, click the checkout trigger to simulate live invoicing and audit operations.
                </p>
              </div>

              <div className="p-4 bg-[#e6f4ea] border border-[#1e8e3e]/20 rounded-lg">
                <h4 className="font-bold text-[#1e8e3e] flex items-center gap-2">
                  <MessageCircle size={16} />
                  <span>WhatsApp Integration Webhook</span>
                </h4>
                <p className="mt-1 leading-normal text-xs text-[#1e8e3e]/90 font-medium">
                  Go to settings tab to update webhook authorizations. Simulated background tasks handle bulk communication with maximum reliability.
                </p>
              </div>
            </div>
          </motion.div>
        );
      default:
        return <div className="text-sm font-semibold text-[#45464d]">Resource under deployment.</div>;
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        currentUser={currentUser}
        currentBranch={currentBranch}
        setCurrentBranch={setCurrentBranch}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        searchText={searchText}
        setSearchText={setSearchText}
        handleQuickShare={handleQuickShare}
      >
        {renderTabContent()}
      </MainLayout>
    </ProtectedRoute>
  );
}
