'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { User } from '@/lib/types';
import { useRouter } from '@/i18n/routing';
import { upsertUserAction } from '@/app/actions';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth-cookie';
import { useUsersDomain } from './users-domain';

export interface AuthDomainContextType {
  user: User | null;
  isLoading: boolean;
  bootstrapResolved: boolean;
  login: (email: string) => { user: User | null; status: 'approved' | 'pending' | 'not_found' };
  logout: () => Promise<void>;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string, reason: string) => void;
  // Setters exposed so the bootstrap effect in use-auth.tsx can drive them
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setBootstrapResolved: React.Dispatch<React.SetStateAction<boolean>>;
  setBootstrapUsedMockFallback: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AuthDomainContext = createContext<AuthDomainContextType | null>(null);

export const useAuthDomain = () => {
  const ctx = useContext(AuthDomainContext);
  if (!ctx) throw new Error('useAuthDomain must be within AuthDomainProvider');
  return ctx;
};

export function AuthDomainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { users, setUsers } = useUsersDomain();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bootstrapResolved, setBootstrapResolved] = useState(false);
  const [, setBootstrapUsedMockFallback] = useState(false);

  const router = useRouter();

  const login = useCallback(
    (email: string): { user: User | null; status: 'approved' | 'pending' | 'not_found' } => {
      const normalizedEmail = email.toLowerCase();
      const foundUser = users.find(
        (u) => typeof u?.email === 'string' && u.email.toLowerCase() === normalizedEmail,
      );

      if (foundUser) {
        if (foundUser.approved !== false) {
          localStorage.setItem('harmonia-user', JSON.stringify(foundUser));
          setAuthCookie();
          setUser(foundUser);
          router?.push?.('/dashboard');
          return { user: foundUser, status: 'approved' };
        }

        router?.push?.('/pending-approval');
        return { user: foundUser, status: 'pending' };
      }

      return { user: null, status: 'not_found' };
    },
    [users, router],
  );

  const logout = useCallback(async () => {
    // Sign out from the auth provider if available
    try {
      const { getClientAuthProvider } = await import('@/lib/auth/provider');
      const authProvider = await getClientAuthProvider();
      await authProvider.signOut();
    } catch {
      // Provider may not be configured — continue with cleanup
    }

    // Clear server-side session cookie
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Network error — clear local state anyway
    }

    localStorage.removeItem('harmonia-user');
    clearAuthCookie();
    setUser(null);
    router?.push?.('/');
  }, [router]);

  const approveUser = useCallback(
    (userId: string) => {
      const target = users.find((u) => u.id === userId);
      if (!target) return;
      const approvedUser = { ...target, approved: true, rejectionReason: undefined };

      setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? approvedUser : u)));

      void upsertUserAction(approvedUser)
        .then((saved) => {
          setUsers((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
        })
        .catch((error) => {
          console.warn('Failed to approve user in DB', error);
        });
    },
    [users, setUsers],
  );

  const rejectUser = useCallback(
    (userId: string, reason: string) => {
      const target = users.find((u) => u.id === userId);
      if (!target) return;
      const rejectedUser = { ...target, approved: false, rejectionReason: reason };

      setUsers((prevUsers) => prevUsers.map((u) => (u.id === userId ? rejectedUser : u)));

      void upsertUserAction(rejectedUser)
        .then((saved) => {
          setUsers((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
        })
        .catch((error) => {
          console.warn('Failed to reject user in DB', error);
        });
    },
    [users, setUsers],
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      bootstrapResolved,
      login,
      logout,
      approveUser,
      rejectUser,
      setUser,
      setIsLoading,
      setBootstrapResolved,
      setBootstrapUsedMockFallback,
    }),
    [user, isLoading, bootstrapResolved, login, logout, approveUser, rejectUser],
  );

  return <AuthDomainContext.Provider value={value}>{children}</AuthDomainContext.Provider>;
}
