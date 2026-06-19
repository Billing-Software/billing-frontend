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
  const [currentUser, setCurrentUser] = useState<User | null>({
    name: 'Sarah Jenkins',
    email: 'admin@smartbill.com',
    role: 'Platform Owner',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150'
  });

  const [currentBranch, setCurrentBranch] = useState<'Main' | 'Downtown'>('Main');

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, currentBranch, setCurrentBranch }}>
      {children}
    </AuthContext.Provider>
  );
}
