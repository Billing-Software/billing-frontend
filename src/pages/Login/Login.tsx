import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import AuthView from '../../features/auth/components/AuthView';
import { useAuth } from '../../hooks/useAuth';

export default function Login() {
  const { currentUser, setCurrentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout>
      <AuthView onLoginSuccess={(usr) => setCurrentUser(usr)} />
    </AuthLayout>
  );
}
