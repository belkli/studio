'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
    mockUsers as initialUsers, 
    mockFormSubmissions as initialForms, 
    conservatoriums as initialConservatoriums, 
    mockInvoices as initialInvoices,
    mockLessons as initialLessons,
    mockPracticeLogs as initialPracticeLogs,
    mockAssignedRepertoire as initialRepertoire,
    mockLessonNotes as initialNotes,
    mockMessageThreads as initialMessageThreads,
    compositions as initialCompositions,
    type User, 
    type FormSubmission,
    type Conservatorium,
    type Invoice,
    type LessonSlot,
    type PracticeLog,
    type AssignedRepertoire,
    type RepertoireStatus,
    type Composition,
    type LessonNote,
    type MessageThread,
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
  addUser: (newUser: Partial<User>, isApproved?: boolean) => void;
  mockFormSubmissions: FormSubmission[];
  updateForm: (updatedForm: FormSubmission) => void;
  mockLessons: LessonSlot[];
  mockInvoices: Invoice[];
  mockPracticeLogs: PracticeLog[];
  mockAssignedRepertoire: AssignedRepertoire[];
  compositions: Composition[];
  mockLessonNotes: LessonNote[];
  updateRepertoireStatus: (repertoireId: string, status: RepertoireStatus) => void;
  addLessonNote: (note: Partial<LessonNote>) => void;
  mockMessageThreads: MessageThread[];
  addMessage: (threadId: string, senderId: string, body: string) => void;
  newFeaturesEnabled: boolean;
  conservatoriums: Conservatorium[];
  updateConservatorium: (updatedConservatorium: Conservatorium) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [forms, setForms] = useState<FormSubmission[]>(initialForms);
  const [conservatoriums, setConservatoriums] = useState<Conservatorium[]>(initialConservatoriums);
  const [assignedRepertoire, setAssignedRepertoire] = useState<AssignedRepertoire[]>(initialRepertoire);
  const [lessonNotes, setLessonNotes] = useState<LessonNote[]>(initialNotes);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>(initialMessageThreads);
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

  const addUser = (newUser: Partial<User>, isApproved = false) => {
    const fullNewUser: User = {
        id: `user-${Date.now()}`,
        approved: isApproved,
        role: 'student', // Default role
        conservatoriumName: '', // Default
        notifications: [],
        ...newUser,
    } as User;
    setUsers(prevUsers => [...prevUsers, fullNewUser]);
};
  
  const updateForm = (updatedForm: FormSubmission) => {
    const formIndex = forms.findIndex(f => f.id === updatedForm.id);
    if (formIndex > -1) {
      setForms(prevForms =>
        prevForms.map(f => (f.id === updatedForm.id ? { ...f, ...updatedForm } : f))
      );
    } else {
        setForms(prevForms => [updatedForm, ...prevForms]);
    }
  };
  
  const newFeaturesEnabled = React.useMemo(() => {
    if (!user) return false;
    const userConservatorium = conservatoriums.find(c => c.id === user.conservatoriumId);
    return userConservatorium?.newFeaturesEnabled ?? false;
  }, [user, conservatoriums]);

  const updateConservatorium = (updatedConservatorium: Conservatorium) => {
    setConservatoriums(prev => prev.map(c => c.id === updatedConservatorium.id ? updatedConservatorium : c));
  }

  const updateRepertoireStatus = (repertoireId: string, status: RepertoireStatus) => {
    setAssignedRepertoire(prev => prev.map(rep => rep.id === repertoireId ? { ...rep, status } : rep));
  };

  const addLessonNote = (note: Partial<LessonNote>) => {
    const newNote: LessonNote = {
      id: `note-${Date.now()}`,
      lessonSlotId: 'lesson-placeholder-id',
      isSharedWithParent: true,
      isSharedWithStudent: true,
      homeworkAssignments: [],
      createdAt: new Date().toISOString(),
      ...note,
    } as LessonNote;
    setLessonNotes(prev => [newNote, ...prev]);
  };
  
  const addMessage = (threadId: string, senderId: string, body: string) => {
      setMessageThreads(prev => prev.map(thread => {
          if (thread.id === threadId) {
              return {
                  ...thread,
                  messages: [...thread.messages, {
                      senderId,
                      body,
                      sentAt: new Date().toISOString(),
                  }]
              }
          }
          return thread;
      }))
  }

  const value = { 
      user, 
      users, 
      login, 
      logout, 
      isLoading, 
      approveUser, 
      rejectUser, 
      updateUser, 
      addUser, 
      mockFormSubmissions: forms, 
      updateForm, 
      mockLessons: initialLessons, 
      newFeaturesEnabled, 
      mockInvoices: initialInvoices, 
      mockPracticeLogs: initialPracticeLogs, 
      conservatoriums, 
      updateConservatorium,
      mockAssignedRepertoire: assignedRepertoire,
      compositions: initialCompositions,
      mockLessonNotes: lessonNotes,
      updateRepertoireStatus,
      addLessonNote,
      mockMessageThreads: messageThreads,
      addMessage,
  };

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
