import React from 'react';
import { motion } from 'motion/react';
import { Calculator, MessageCircle } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import Dashboard from '../pages/Dashboard/Dashboard';
import Billing from '../pages/Billing/Billing';
import Services from '../pages/Services/Services';
import Customers from '../pages/Customers/Customers';
import Inventory from '../pages/Inventory/Inventory';
import Staff from '../pages/Staff/Staff';
import Settings from '../pages/Settings/Settings';
import Expenses from '../pages/Expenses/Expenses';
import Login from '../pages/Login/Login';
import Invoices from '../pages/Invoices/Invoices';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface AppRoutesProps {
  searchText: string;
  setSearchText: (term: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
}

function Help() {
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
}

export default function AppRoutes({
  searchText,
  setSearchText,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  handleLogout
}: AppRoutesProps) {
  const { currentUser, currentBranch, setCurrentBranch } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current tab name from pathname (e.g. "/billing" -> "billing")
  const activeTab = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';

  const handleSetActiveTab = (tab: string) => {
    navigate('/' + tab);
  };

  const handleQuickShare = () => {
    const shareMessage = `SmartBill Pro Gateway for ${currentBranch} Branch is online: All cash registers are fully operational. Current revenue levels are green.`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareMessage);
      showToast("Access webhook message copied to workspace clipboard!", "success");
    } else {
      showToast(shareMessage, "info");
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />

      {/* Protected routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <MainLayout
              activeTab={activeTab}
              setActiveTab={handleSetActiveTab}
              onLogout={handleLogout}
              currentUser={currentUser}
              currentBranch={currentBranch}
              setCurrentBranch={setCurrentBranch}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
              isMobileMenuOpen={isMobileMenuOpen}
              searchText={searchText}
              setSearchText={setSearchText}
              handleQuickShare={handleQuickShare}
            />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={
          <Dashboard 
            onNavigateToBilling={() => handleSetActiveTab('billing')}
            onNavigateToStaff={() => handleSetActiveTab('staff')}
            onNavigateToServices={() => handleSetActiveTab('services')}
            currentBranch={currentBranch}
          />
        } />
        <Route path="billing" element={<Billing />} />
        <Route path="services" element={<Services />} />
        <Route path="customers" element={<Customers />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="staff" element={currentUser?.role === 'Owner' ? <Staff /> : <Navigate to="/dashboard" replace />} />
        <Route path="settings" element={currentUser?.role === 'Owner' ? <Settings /> : <Navigate to="/dashboard" replace />} />
        <Route path="expenses" element={currentUser?.role === 'Owner' ? <Expenses /> : <Navigate to="/dashboard" replace />} />
        <Route path="help" element={<Help />} />
        
        {/* Redirect from root or invalid paths */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
