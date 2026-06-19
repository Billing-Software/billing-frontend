import React, { createContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentBranch: 'Main' | 'Downtown';
  setCurrentBranch: (branch: 'Main' | 'Downtown') => void;
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

  const [currentBranch, setCurrentBranch] = useState<'Main' | 'Downtown'>('Main');

  // Listen to logout event dispatched by API client
  React.useEffect(() => {
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
    <AuthContext.Provider value={{ currentUser, setCurrentUser: handleSetCurrentUser, currentBranch, setCurrentBranch }}>
      {children}
    </AuthContext.Provider>
  );
}
