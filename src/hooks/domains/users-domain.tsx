'use client';
import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import type { User, NotificationPreferences, PaymentMethod } from '@/lib/types';
import { upsertUserAction } from '@/app/actions';
import { setAuthCookie } from '@/lib/auth-cookie';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsersDomainContextType {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  addUser: (userData: Partial<User>, isAdminFlow?: boolean) => User;
  updateUser: (updatedUser: User) => void;
  markWalkthroughAsSeen: (userId: string) => void;
  updateNotificationPreferences: (preferences: NotificationPreferences) => void;
  updateUserPaymentMethod: (paymentData: {
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  }) => void;
  /**
   * Called by AuthProviderInner to inject the current session user and its setter
   * so that updateUser / markWalkthroughAsSeen can keep the session in sync.
   * Using a registration callback avoids a circular import between auth-domain and
   * users-domain.
   */
  registerAuthSetters: (
    user: User | null,
    setUser: React.Dispatch<React.SetStateAction<User | null>>,
  ) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const UsersDomainContext = createContext<UsersDomainContextType | null>(null);

export const useUsersDomain = () => {
  const ctx = useContext(UsersDomainContext);
  if (!ctx) throw new Error('useUsersDomain must be within UsersDomainProvider');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function UsersDomainProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);

  // Auth setters injected by AuthProviderInner to keep current session in sync
  const authSettersRef = useRef<{
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
  }>({ user: null, setUser: () => {} });

  const registerAuthSetters = useCallback(
    (
      user: User | null,
      setUser: React.Dispatch<React.SetStateAction<User | null>>,
    ) => {
      authSettersRef.current = { user, setUser };
    },
    [],
  );

  // -------------------------------------------------------------------------
  // addUser — pure user-list operation, no session involvement
  // -------------------------------------------------------------------------
  const addUser = useCallback((userData: Partial<User>, isAdminFlow = false): User => {
    const isConservatoriumAdmin =
      userData.role === 'conservatorium_admin' || userData.role === 'delegated_admin';
    const newUser: User = {
      id: `user-${Date.now()}`,
      approved: isAdminFlow,
      avatarUrl: userData.avatarUrl || 'https://i.pravatar.cc/150?u=' + Date.now(),
      achievements: [],
      registrationSource:
        userData.registrationSource || (isAdminFlow ? 'admin_created' : 'email'),
      ...(isConservatoriumAdmin
        ? {
            isDelegatedAdmin: userData.isDelegatedAdmin ?? true,
            isPrimaryConservatoriumAdmin: userData.isPrimaryConservatoriumAdmin ?? false,
          }
        : {}),
      ...userData,
    } as User;

    setUsers((prev) => [...prev, newUser]);

    void upsertUserAction(newUser)
      .then((saved) => {
        setUsers((prev) => prev.map((item) => (item.id === newUser.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist new user', error);
      });

    return newUser;
  }, []);

  // -------------------------------------------------------------------------
  // updateUser — also syncs current session user if ids match
  // -------------------------------------------------------------------------
  const updateUser = useCallback((updatedUser: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));

    const { user, setUser } = authSettersRef.current;
    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
      localStorage.setItem('harmonia-user', JSON.stringify(updatedUser));
      setAuthCookie();
    }

    void upsertUserAction(updatedUser)
      .then((saved) => {
        setUsers((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));

        const { user: currentUser, setUser: setCurrentUser } = authSettersRef.current;
        if (currentUser?.id === saved.id) {
          setCurrentUser((prevCurrent) => {
            if (prevCurrent?.id !== saved.id) return prevCurrent;
            localStorage.setItem('harmonia-user', JSON.stringify(saved));
            setAuthCookie();
            return saved;
          });
        }
      })
      .catch((error) => {
        console.warn('Failed to persist user', error);
      });
  }, []);

  // -------------------------------------------------------------------------
  // markWalkthroughAsSeen
  // -------------------------------------------------------------------------
  const markWalkthroughAsSeen = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, hasSeenWalkthrough: true } : u)),
    );

    const { user, setUser } = authSettersRef.current;
    if (user?.id === userId) {
      const updatedUser = { ...user, hasSeenWalkthrough: true };
      setUser(updatedUser);
      localStorage.setItem('harmonia-user', JSON.stringify(updatedUser));
      setAuthCookie();
    }
  }, []);

  // -------------------------------------------------------------------------
  // updateNotificationPreferences
  // -------------------------------------------------------------------------
  const updateNotificationPreferences = useCallback(
    (preferences: NotificationPreferences) => {
      const { user } = authSettersRef.current;
      if (!user) return;
      const updatedUser = { ...user, notificationPreferences: preferences };
      updateUser(updatedUser);
    },
    [updateUser],
  );

  // -------------------------------------------------------------------------
  // updateUserPaymentMethod
  // -------------------------------------------------------------------------
  const updateUserPaymentMethod = useCallback(
    (paymentData: { last4: string; expiryMonth: number; expiryYear: number }) => {
      const { user } = authSettersRef.current;
      if (!user) return;
      const newPaymentMethod: PaymentMethod = {
        id: `pm-${Date.now()}`,
        type: 'CreditCard',
        last4: paymentData.last4,
        expiryMonth: paymentData.expiryMonth,
        expiryYear: paymentData.expiryYear,
        isPrimary: true,
      };
      const updatedUser: User = {
        ...user,
        paymentMethods: [newPaymentMethod],
      };
      updateUser(updatedUser);
    },
    [updateUser],
  );

  // -------------------------------------------------------------------------
  // Context value — deps limited to users (stable callbacks via useCallback)
  // -------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      users,
      setUsers,
      addUser,
      updateUser,
      markWalkthroughAsSeen,
      updateNotificationPreferences,
      updateUserPaymentMethod,
      registerAuthSetters,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users],
  );

  return <UsersDomainContext.Provider value={value}>{children}</UsersDomainContext.Provider>;
}
