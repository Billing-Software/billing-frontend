import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, Branch } from '../types';
import { branchService } from '../services/branch.service';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
  branches: Branch[];
  refreshBranches: () => Promise<void>;
  handleLogout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // 1. Inspect URL parameters (both search query and hash query string) for autologin tokens
    try {
      const searchStr = window.location.search || (window.location.hash.includes('?') ? window.location.hash.substring(window.location.hash.indexOf('?')) : '');
      if (searchStr) {
        const urlParams = new URLSearchParams(searchStr);
        const token = urlParams.get('token');
        const username = urlParams.get('username');
        const email = urlParams.get('email');
        const role = urlParams.get('role');
        const businessId = urlParams.get('businessId');
        const businessName = urlParams.get('businessName');

        if (token && username && email && role && businessId && businessName) {
          const user: User = {
            username,
            email,
            role,
            businessId: parseInt(businessId, 10),
            businessName,
            token
          };
          if (urlParams.get('new') === 'true') {
            localStorage.setItem('onboarding_pending', 'true');
          }
          localStorage.setItem('auth_data', JSON.stringify(user));
          return user;
        }
      }
    } catch (e) {
      console.error('Failed to parse autologin query params in AuthProvider:', e);
    }

    const data = localStorage.getItem('auth_data');
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('auth_data');
    localStorage.removeItem('token');
    localStorage.removeItem('jwt_token');
    setCurrentUser(null);
    window.dispatchEvent(new Event('auth_logout'));
  };

  const refreshBranches = async () => {
    if (!currentUser) return;
    try {
      const data = await branchService.getAll();
      setBranches(data);
      if (data.length > 0) {
        setCurrentBranch(prev => {
          if (prev && data.some(b => b.id === prev.id)) {
            return data.find(b => b.id === prev.id) || data[0];
          }
          return data[0];
        });
      } else {
        setCurrentBranch(null);
      }
    } catch (e) {
      console.error('Failed to load active branches from backend:', e);
    }
  };

  // Fetch branches on mount or login
  useEffect(() => {
    if (currentUser) {
      refreshBranches();
    } else {
      setBranches([]);
      setCurrentBranch(null);
    }
  }, [currentUser]);

  // Listen to logout event dispatched by API client
  useEffect(() => {
    const onAuthLogout = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth_logout', onAuthLogout);
    return () => {
      window.removeEventListener('auth_logout', onAuthLogout);
    };
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    if (user) {
      localStorage.setItem('auth_data', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_data');
      localStorage.removeItem('token');
      localStorage.removeItem('jwt_token');
    }
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      setCurrentUser: handleSetCurrentUser, 
      currentBranch, 
      setCurrentBranch,
      branches,
      refreshBranches,
      handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
}
