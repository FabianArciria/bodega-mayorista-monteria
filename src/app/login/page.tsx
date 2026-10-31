'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoginGate from '@/components/auth/LoginGate';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (role === 'admin') router.push('/admin');
      else if (role === 'worker') router.push('/worker');
      else router.push('/');
    }
  }, [isAuthenticated, role, isLoading, router]);

  return <LoginGate />;
}
