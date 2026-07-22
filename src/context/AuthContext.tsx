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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
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
    const handleLogout = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth_logout', handleLogout);
    return () => {
      window.removeEventListener('auth_logout', handleLogout);
    };
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    if (user) {
      localStorage.setItem('auth_data', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_data');
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
      refreshBranches
    }}>
      {children}
    </AuthContext.Provider>
  );
}
