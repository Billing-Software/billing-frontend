import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Login from '../pages/Login/Login';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, setCurrentUser } = useAuth();

  if (!currentUser) {
    return <Login onLoginSuccess={(usr) => setCurrentUser(usr)} />;
  }

  return <>{children}</>;
}
