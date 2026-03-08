'use client';
import { createContext, useContext } from 'react';
import type { User } from '@/lib/types';

export interface AuthDomainContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => { user: User | null; status: 'approved' | 'pending' | 'not_found' };
  logout: () => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, reason: string) => void;
}

export const AuthDomainContext = createContext<AuthDomainContextType | null>(null);

export const useAuthDomain = () => {
  const ctx = useContext(AuthDomainContext);
  if (!ctx) throw new Error('useAuthDomain must be within AuthDomainProvider');
  return ctx;
};
