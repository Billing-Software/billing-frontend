import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';

// Data imports
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_SERVICES, 
  INITIAL_INVENTORY, 
  INITIAL_STAFF, 
  INITIAL_BILLS, 
  INITIAL_BUSINESS_PROFILE, 
  INITIAL_WHATSAPP 
} from './utils/constants';

// Types
import { 
  Customer, 
  Service, 
  InventoryItem, 
  StaffMember, 
  Bill, 
  BusinessProfile, 
  WhatsAppSettings 
} from './types';

function AppContent() {
  const { setCurrentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [bills, setBills] = useState<Bill[]>(INITIAL_BILLS);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(INITIAL_BUSINESS_PROFILE);
  const [whatsAppSettings, setWhatsAppSettings] = useState<WhatsAppSettings>(INITIAL_WHATSAPP);

  const [searchText, setSearchText] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleLogout = () => {
    if (confirm("Do you really wish to terminate current POS terminal session?")) {
      setCurrentUser(null);
    }
  };

  return (
    <AppRoutes
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      customers={customers}
      setCustomers={setCustomers}
      services={services}
      setServices={setServices}
      inventory={inventory}
      setInventory={setInventory}
      staff={staff}
      setStaff={setStaff}
      bills={bills}
      setBills={setBills}
      businessProfile={businessProfile}
      setBusinessProfile={setBusinessProfile}
      whatsAppSettings={whatsAppSettings}
      setWhatsAppSettings={setWhatsAppSettings}
      searchText={searchText}
      setSearchText={setSearchText}
      isMobileMenuOpen={isMobileMenuOpen}
      setIsMobileMenuOpen={setIsMobileMenuOpen}
      handleLogout={handleLogout}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
