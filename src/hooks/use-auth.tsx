'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { mockUsers, siteAdminUser, type User } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  login: (email: string) => User | null;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUser = useCallback(() => {
    try {
        const savedUserId = localStorage.getItem('userId');
        const foundUser = savedUserId ? mockUsers.find(u => u.id === savedUserId) : siteAdminUser; // Default to site admin if no user is saved
        setUser(foundUser || siteAdminUser);
    } catch (error) {
        // localStorage is not available on the server
        setUser(siteAdminUser); // Default for SSR
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Redirect to login if no user and not on a public page
  useEffect(() => {
    if (!isLoading && !user && !['/login', '/register', '/'].includes(pathname)) {
        router.push('/login');
    }
  }, [user, isLoading, pathname, router]);
  

  const login = (email: string): User | null => {
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      localStorage.setItem('userId', foundUser.id);
      setUser(foundUser);
      router.push('/dashboard');
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setUser(null);
    router.push('/login');
  };
  
  const value = { user, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
