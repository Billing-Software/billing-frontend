import React from 'react';
import { motion } from 'motion/react';
import { Calculator, MessageCircle } from 'lucide-react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
import ReportsPage from '../pages/Reports/ReportsPage';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Onboarding from '../pages/Onboarding/Onboarding';
import SuperAdminDashboard from '../pages/SuperAdmin/SuperAdminDashboard';
import Branches from '../pages/Branches/Branches';
import { useBusinessConfig } from '../context/BusinessConfigContext';

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
  const { hasFeature } = useBusinessConfig();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current tab name from pathname (e.g. "/billing" -> "billing")
  const activeTab = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';

  const handleSetActiveTab = (tab: string) => {
    navigate('/' + tab);
  };

  const handleQuickShare = () => {
    const shareMessage = `BillCom POS Gateway for ${currentBranch?.name || 'Default'} Branch is online: All cash registers are fully operational. Current revenue levels are green.`;
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
      <Route path="/register" element={<Navigate to="/login" replace />} />
      <Route path="/autologin" element={<AutoLogin />} />
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/superadmin" 
        element={
          <ProtectedRoute>
            {currentUser?.role === 'SuperAdmin' ? <SuperAdminDashboard /> : <Navigate to="/dashboard" replace />}
          </ProtectedRoute>
        } 
      />

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
          currentUser?.role === 'SuperAdmin' ? (
            <Navigate to="/superadmin" replace />
          ) : (
            <Dashboard 
              onNavigateToBilling={() => handleSetActiveTab('billing')}
              onNavigateToStaff={() => handleSetActiveTab('staff')}
              onNavigateToServices={() => handleSetActiveTab('services')}
              currentBranch={currentBranch}
            />
          )
        } />
        <Route path="billing" element={hasFeature('billing') ? <Billing /> : <Navigate to="/dashboard" replace />} />
        <Route path="services" element={hasFeature('services') ? <Services /> : <Navigate to="/dashboard" replace />} />
        <Route path="customers" element={hasFeature('customers') ? <Customers /> : <Navigate to="/dashboard" replace />} />
        <Route path="inventory" element={hasFeature('inventory') ? <Inventory /> : <Navigate to="/dashboard" replace />} />
        <Route path="invoices" element={hasFeature('invoices') ? <Invoices /> : <Navigate to="/dashboard" replace />} />
        <Route path="reports" element={hasFeature('reports') ? <ReportsPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="staff" element={hasFeature('staff_manage') ? <Staff /> : <Navigate to="/dashboard" replace />} />
        <Route path="branches" element={hasFeature('branches') ? <Branches /> : <Navigate to="/dashboard" replace />} />
        <Route path="settings" element={hasFeature('settings') ? <Settings /> : <Navigate to="/dashboard" replace />} />
        <Route path="expenses" element={hasFeature('expenses') ? <Expenses /> : <Navigate to="/dashboard" replace />} />
        <Route path="help" element={<Help />} />
        
        {/* Redirect from root or invalid paths */}
        <Route index element={<Navigate to={currentUser?.role === 'SuperAdmin' ? "/superadmin" : "/dashboard"} replace />} />
        <Route path="*" element={<Navigate to={currentUser?.role === 'SuperAdmin' ? "/superadmin" : "/dashboard"} replace />} />
      </Route>
    </Routes>
  );
}

function AutoLogin() {
  const [searchParams] = useSearchParams();
  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const rawSearch = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
    const urlParams = new URLSearchParams(rawSearch);

    const token = searchParams.get('token') || urlParams.get('token');
    const username = searchParams.get('username') || urlParams.get('username');
    const email = searchParams.get('email') || urlParams.get('email');
    const role = searchParams.get('role') || urlParams.get('role');
    const businessId = searchParams.get('businessId') || urlParams.get('businessId');
    const businessName = searchParams.get('businessName') || urlParams.get('businessName');
    const isNew = (searchParams.get('new') || urlParams.get('new')) === 'true';

    if (token && username && email && role && businessId && businessName) {
      const user = {
        username,
        email,
        role,
        businessId: parseInt(businessId, 10),
        businessName,
        token
      };
      if (isNew) {
        localStorage.setItem('onboarding_pending', 'true');
      }
      setCurrentUser(user);
      navigate('/dashboard', { replace: true });
    } else {
      // If auth_data is already set in localStorage by AuthProvider initializer, navigate to dashboard
      const existingAuth = localStorage.getItem('auth_data');
      if (existingAuth) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [searchParams, setCurrentUser, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#006a61] border-t-transparent mb-4"></div>
      <h3 className="font-semibold text-sm">Logging you in automatically...</h3>
      <p className="text-[10px] text-slate-400 font-medium">Authenticating POS session securely.</p>
    </div>
  );
}
