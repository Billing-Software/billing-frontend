import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';

function AppContent() {
  const { setCurrentUser } = useAuth();

  const [searchText, setSearchText] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleLogout = () => {
    if (confirm("Do you really wish to terminate current POS terminal session?")) {
      setCurrentUser(null);
    }
  };

  return (
    <AppRoutes
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
