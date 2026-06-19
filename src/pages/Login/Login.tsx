import React from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import AuthView from '../../features/auth/components/AuthView';
import { User } from '../../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  return (
    <AuthLayout>
      <AuthView onLoginSuccess={onLoginSuccess} />
    </AuthLayout>
  );
}
