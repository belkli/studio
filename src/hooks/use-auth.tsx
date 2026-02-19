'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
    mockUsers as initialUsers, 
    mockFormSubmissions as initialForms, 
    conservatoriums, 
    mockInvoices as initialInvoices,
    mockPracticeLogs as initialPracticeLogs,
    type User, 
    type FormSubmission,
    type Invoice,
    type PracticeLog
} from '@/lib/data';

interface LoginResult {
  user: User | null;
  status: 'approved' | 'pending' | 'not_found';
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string) => LoginResult;
  logout: () => void;
  isLoading: boolean;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, reason: string) => void;
  updateUser: (updatedUser: User) => void;
  addUser: (newUser: Partial<User>) => void;
  mockFormSubmissions: FormSubmission[];
  updateForm: (updatedForm: FormSubmission) => void;
  mockInvoices: Invoice[];
  mockPracticeLogs: PracticeLog[];
  newFeaturesEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [forms, setForms] = useState<FormSubmission[]>(initialForms);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [practiceLogs, setPracticeLogs] = useState<PracticeLog[]>(initialPracticeLogs);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUserFromStorage = useCallback(() => {
    try {
      const savedUserId = localStorage.getItem('userId');
      if (savedUserId) {
        const foundUser = users.find(u => u.id === savedUserId);
        if (foundUser && foundUser.approved) {
          setUser(foundUser);
        } else {
          localStorage.removeItem('userId');
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Could not access localStorage.", error);
    }
    setIsLoading(false);
  }, [users]);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Redirect to login if no user and not on a public page
  useEffect(() => {
    if (!isLoading && !user && !['/login', '/register', '/'].includes(pathname)) {
        router.push('/login');
    }
  }, [user, isLoading, pathname, router]);
  
  const login = (email: string): LoginResult => {
    const foundUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!foundUser) {
      return { user: null, status: 'not_found' };
    }

    if (!foundUser.approved) {
      return { user: foundUser, status: 'pending' };
    }

    localStorage.setItem('userId', foundUser.id);
    setUser(foundUser);
    router.push('/dashboard');
    return { user: foundUser, status: 'approved' };
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setUser(null);
    router.push('/login');
  };
  
  const approveUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, approved: true, rejectionReason: undefined } : u));
  };

  const rejectUser = (userId: string, reason: string) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, approved: false, rejectionReason: reason } : u));
  };

  const updateUser = (updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
    }
  };

  const addUser = (newUser: Partial<User>) => {
    const fullNewUser: User = {
        id: `user-${Date.now()}`,
        approved: false, // All new users start as not approved
        role: 'student', // Default role
        conservatoriumName: '', // Default
        notifications: [],
        ...newUser,
    } as User;
    setUsers(prevUsers => [...prevUsers, fullNewUser]);
};
  
  const updateForm = (updatedForm: FormSubmission) => {
    setForms(prevForms =>
      prevForms.map(f => (f.id === updatedForm.id ? { ...f, ...updatedForm } : f))
    );
  };
  
  const newFeaturesEnabled = useMemo(() => {
    if (!user) return false;
    const userConservatorium = conservatoriums.find(c => c.id === user.conservatoriumId);
    return userConservatorium?.newFeaturesEnabled ?? false;
  }, [user]);

  const value = { user, users, login, logout, isLoading, approveUser, rejectUser, updateUser, addUser, mockFormSubmissions: forms, updateForm, newFeaturesEnabled, mockInvoices: invoices, mockPracticeLogs: practiceLogs };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
