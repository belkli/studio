'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  MessageThread,
  Announcement,
  FormSubmission,
  FormTemplate,
  AuditLogEntry,
} from '@/lib/types';
import { useAuthDomain } from './auth-domain';
import { createAnnouncement, upsertFormSubmissionAction } from '@/app/actions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommsDomainContextType {
  mockMessageThreads: MessageThread[];
  messageThreads: MessageThread[];
  setMockMessageThreads: React.Dispatch<React.SetStateAction<MessageThread[]>>;

  mockAnnouncements: Announcement[];
  announcements: Announcement[];
  setMockAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;

  mockFormSubmissions: FormSubmission[];
  formSubmissions: FormSubmission[];
  setMockFormSubmissions: React.Dispatch<React.SetStateAction<FormSubmission[]>>;

  mockFormTemplates: FormTemplate[];
  formTemplates: FormTemplate[];
  setMockFormTemplates: React.Dispatch<React.SetStateAction<FormTemplate[]>>;

  mockAuditLog: AuditLogEntry[];
  auditLog: AuditLogEntry[];
  setMockAuditLog: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;

  addMessage: (threadId: string, senderId: string, body: string) => void;
  createMessageThread: (participants: string[], initialMessage?: { senderId: string; body: string }) => string;
  addAnnouncement: (announcementData: Partial<Announcement>) => void;
  updateForm: (updatedForm: FormSubmission) => void;
  addFormTemplate: (templateData: Partial<FormTemplate>) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const CommsDomainContext = createContext<CommsDomainContextType | null>(null);

export const useCommsDomain = () => {
  const ctx = useContext(CommsDomainContext);
  if (!ctx) throw new Error('useCommsDomain must be within CommsDomainProvider');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function CommsDomainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // needs current session user for conservatoriumId default in addAnnouncement / addFormTemplate
  const { user } = useAuthDomain();

  const [mockMessageThreads, setMockMessageThreads] = useState<MessageThread[]>([]);
  const [mockAnnouncements, setMockAnnouncements] = useState<Announcement[]>([]);
  const [mockFormSubmissions, setMockFormSubmissions] = useState<FormSubmission[]>([]);
  const [mockFormTemplates, setMockFormTemplates] = useState<FormTemplate[]>([]);
  const [mockAuditLog, setMockAuditLog] = useState<AuditLogEntry[]>([]);

  // ---------------------------------------------------------------------------
  // addMessage
  // ---------------------------------------------------------------------------
  const addMessage = useCallback((threadId: string, senderId: string, body: string) => {
    setMockMessageThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        const newMessage = { senderId, body, sentAt: new Date().toISOString() };
        return { ...thread, messages: [...thread.messages, newMessage] };
      }
      return thread;
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // createMessageThread
  // ---------------------------------------------------------------------------
  const createMessageThread = useCallback((participants: string[], initialMessage?: { senderId: string; body: string }) => {
    const normalizedParticipants = Array.from(new Set(participants));
    let existingId: string | undefined;

    setMockMessageThreads(prev => {
      const existing = prev.find((thread) =>
        thread.participants.length === normalizedParticipants.length &&
        normalizedParticipants.every((participantId) => thread.participants.includes(participantId))
      );

      if (existing) {
        existingId = existing.id;
        if (initialMessage?.body?.trim()) {
          return prev.map(thread => {
            if (thread.id !== existing.id) return thread;
            const newMessage = { senderId: initialMessage.senderId, body: initialMessage.body, sentAt: new Date().toISOString() };
            return { ...thread, messages: [...thread.messages, newMessage] };
          });
        }
        return prev;
      }

      const newThreadId = 'thread-' + Date.now();
      existingId = newThreadId;
      const now = new Date().toISOString();
      const messages = initialMessage?.body?.trim()
        ? [{ senderId: initialMessage.senderId, body: initialMessage.body, sentAt: now }]
        : [];

      return [
        ...prev,
        {
          id: newThreadId,
          participants: normalizedParticipants,
          messages,
        },
      ];
    });

    return existingId!;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // addAnnouncement
  // ---------------------------------------------------------------------------
  const addAnnouncement = useCallback((announcementData: Partial<Announcement>) => {
    const newAnnouncement: Announcement = {
      id: `ann-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      sentAt: new Date().toISOString(),
      ...announcementData
    } as Announcement;
    setMockAnnouncements(prev => [newAnnouncement, ...prev]);

    const newAuditLogEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      notificationId: newAnnouncement.id,
      userId: 'system',
      channel: 'IN_APP',
      status: 'DELIVERED',
      sentAt: new Date().toISOString(),
      title: newAnnouncement.title,
      body: newAnnouncement.body,
    };
    setMockAuditLog(prev => [newAuditLogEntry, ...prev]);

    if (newAnnouncement.title && newAnnouncement.body) {
      void createAnnouncement(newAnnouncement)
        .then((serverAnnouncement) => {
          setMockAnnouncements((prev) => prev.map((item) => (item.id === newAnnouncement.id ? serverAnnouncement : item)));
        })
        .catch((error) => {
          console.warn('Failed to persist announcement', error);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // updateForm
  // ---------------------------------------------------------------------------
  const updateForm = useCallback((updatedForm: FormSubmission) => {
    setMockFormSubmissions(prevForms => {
      const formIndex = prevForms.findIndex(f => f.id === updatedForm.id);
      if (formIndex > -1) {
        return prevForms.map((form, index) => index === formIndex ? updatedForm : form);
      } else {
        return [...prevForms, updatedForm];
      }
    });

    void upsertFormSubmissionAction(updatedForm)
      .then((saved) => {
        setMockFormSubmissions(prevForms => {
          const formIndex = prevForms.findIndex(f => f.id === saved.id);
          if (formIndex > -1) {
            return prevForms.map((form, index) => index === formIndex ? saved : form);
          }
          return [...prevForms, saved];
        });
      })
      .catch((error) => {
        console.warn('Failed to persist form submission', error);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // addFormTemplate
  // ---------------------------------------------------------------------------
  const addFormTemplate = useCallback((templateData: Partial<FormTemplate>) => {
    const newTemplate: FormTemplate = {
      id: `template-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      createdAt: new Date().toISOString(),
      ...templateData
    } as FormTemplate;
    setMockFormTemplates(prev => [...prev, newTemplate]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const value = useMemo(
    () => ({
      mockMessageThreads,
      messageThreads: mockMessageThreads,
      setMockMessageThreads,
      mockAnnouncements,
      announcements: mockAnnouncements,
      setMockAnnouncements,
      mockFormSubmissions,
      formSubmissions: mockFormSubmissions,
      setMockFormSubmissions,
      mockFormTemplates,
      formTemplates: mockFormTemplates,
      setMockFormTemplates,
      mockAuditLog,
      auditLog: mockAuditLog,
      setMockAuditLog,
      addMessage,
      createMessageThread,
      addAnnouncement,
      updateForm,
      addFormTemplate,
    }),
    [
      mockMessageThreads,
      mockAnnouncements,
      mockFormSubmissions,
      mockFormTemplates,
      mockAuditLog,
      addMessage,
      createMessageThread,
      addAnnouncement,
      updateForm,
      addFormTemplate,
    ],
  );

  return <CommsDomainContext.Provider value={value}>{children}</CommsDomainContext.Provider>;
}
