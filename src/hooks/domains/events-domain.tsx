'use client';
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  EventProduction,
  EventProductionStatus,
  PerformanceBooking,
  PerformanceBookingStatus,
  PerformanceAssignment,
  Masterclass,
  StudentMasterClassAllowance,
  OpenDayEvent,
  OpenDayAppointment,
  Alumnus,
  TicketTier,
} from '@/lib/types';
import { saveAlumnus, createMasterClassAction, publishMasterClassAction, registerToMasterClassAction, createEventAction, updateEventAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuthDomain } from './auth-domain';
import { useUsersDomain } from './users-domain';
import { useRepertoireDomain } from './repertoire-domain';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EventsDomainContextType {
  mockEvents: EventProduction[];
  events: EventProduction[];
  setMockEvents: React.Dispatch<React.SetStateAction<EventProduction[]>>;

  mockPerformanceBookings: PerformanceBooking[];
  performanceBookings: PerformanceBooking[];
  setMockPerformanceBookings: React.Dispatch<React.SetStateAction<PerformanceBooking[]>>;

  mockMasterclasses: Masterclass[];
  masterClasses: Masterclass[];
  setMockMasterclasses: React.Dispatch<React.SetStateAction<Masterclass[]>>;

  mockMasterClassAllowances: StudentMasterClassAllowance[];
  masterClassAllowances: StudentMasterClassAllowance[];
  setMockMasterClassAllowances: React.Dispatch<React.SetStateAction<StudentMasterClassAllowance[]>>;

  mockOpenDayEvents: OpenDayEvent[];
  openDayEvents: OpenDayEvent[];
  setMockOpenDayEvents: React.Dispatch<React.SetStateAction<OpenDayEvent[]>>;

  mockOpenDayAppointments: OpenDayAppointment[];
  openDayAppointments: OpenDayAppointment[];
  setMockOpenDayAppointments: React.Dispatch<React.SetStateAction<OpenDayAppointment[]>>;

  mockAlumni: Alumnus[];
  alumni: Alumnus[];
  setMockAlumni: React.Dispatch<React.SetStateAction<Alumnus[]>>;

  addEvent: (eventData: Partial<EventProduction>) => void;
  updateEvent: (event: EventProduction) => void;
  updateEventStatus: (eventId: string, status: EventProductionStatus) => void;
  bookEventTickets: (
    eventId: string,
    selections: Record<string, number>,
    attendee: { name: string; email: string; phone: string },
    userId?: string
  ) => { success: boolean; soldOut?: boolean; bookingRef?: string; totalAmount: number };
  addPerformanceToEvent: (eventId: string, studentId: string, repertoireId: string) => void;
  removePerformanceFromEvent: (eventId: string, performanceId: string) => void;
  assignMusiciansToPerformance: (bookingId: string, assignments: Pick<PerformanceAssignment, 'userId' | 'role'>[]) => void;
  updatePerformanceBookingStatus: (bookingId: string, status: PerformanceBookingStatus) => void;
  respondToPerformanceInvitation: (bookingId: string, userId: string, accept: boolean, declineReason?: string) => void;
  addPerformanceBooking: (bookingData: Partial<PerformanceBooking>) => void;
  createMasterClass: (payload: Partial<Masterclass>) => Masterclass;
  publishMasterClass: (masterClassId: string) => void;
  registerToMasterClass: (masterClassId: string, studentId: string) => Promise<{ success: boolean; chargedILS?: number; remaining?: number; reason?: string }>;
  addOpenDayAppointment: (appointmentData: Partial<OpenDayAppointment>) => void;
  graduateStudent: (studentId: string, graduationYear: number) => void;
  upsertAlumniProfile: (payload: Partial<Alumnus> & { userId: string }) => Alumnus;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const EventsDomainContext = createContext<EventsDomainContextType | null>(null);

export const useEventsDomain = () => {
  const ctx = useContext(EventsDomainContext);
  if (!ctx) throw new Error('useEventsDomain must be within EventsDomainProvider');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function EventsDomainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // needs current session user for conservatoriumId defaults and role checks
  const { user } = useAuthDomain();
  // needs users list for addPerformanceToEvent, assignMusiciansToPerformance, graduateStudent, upsertAlumniProfile, registerToMasterClass
  const { users, setUsers } = useUsersDomain();
  // needs mockAssignedRepertoire and mockRepertoire for addPerformanceToEvent
  const { mockAssignedRepertoire, mockRepertoire } = useRepertoireDomain();
  const { toast } = useToast();

  const [mockEvents, setMockEvents] = useState<EventProduction[]>([]);
  const [mockPerformanceBookings, setMockPerformanceBookings] = useState<PerformanceBooking[]>([]);
  const [mockMasterclasses, setMockMasterclasses] = useState<Masterclass[]>([]);
  const [mockMasterClassAllowances, setMockMasterClassAllowances] = useState<StudentMasterClassAllowance[]>([]);
  const [mockOpenDayEvents, setMockOpenDayEvents] = useState<OpenDayEvent[]>([]);
  const [mockOpenDayAppointments, setMockOpenDayAppointments] = useState<OpenDayAppointment[]>([]);
  const [mockAlumni, setMockAlumni] = useState<Alumnus[]>([]);

  // ---------------------------------------------------------------------------
  // addEvent
  // ---------------------------------------------------------------------------
  const addEvent = useCallback((eventData: Partial<EventProduction>) => {
    const newEvent: EventProduction = {
      id: `event-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      program: [],
      title: eventData.title || { he: eventData.name || "", en: eventData.name || "" },
      description: eventData.description || { he: "", en: "" },
      venueDetails: eventData.venueDetails || {
        name: { he: eventData.venue || "", en: eventData.venue || "" },
        address: "",
        capacity: eventData.totalSeats || 0,
        isOnline: false,
      },
      isFree: eventData.isFree ?? true,
      ticketPrices: eventData.ticketPrices || [],
      bookedSeats: eventData.bookedSeats || [],
      tags: eventData.tags || [],
      ...eventData,
    } as EventProduction;
    setMockEvents(prev => [newEvent, ...prev]);

    void createEventAction(newEvent)
      .then((saved) => {
        setMockEvents(prev => prev.map(item => (item.id === newEvent.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist event', error);
      });
  }, [user]);

  // ---------------------------------------------------------------------------
  // updateEvent
  // ---------------------------------------------------------------------------
  const updateEvent = useCallback((updatedEvent: EventProduction) => {
    setMockEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));

    void updateEventAction(updatedEvent)
      .then((saved) => {
        setMockEvents(prev => prev.map(item => (item.id === saved.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist event update', error);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // updateEventStatus
  // ---------------------------------------------------------------------------
  const updateEventStatus = useCallback((eventId: string, status: EventProductionStatus) => {
    setMockEvents(prev => prev.map(e => e.id === eventId ? { ...e, status } : e));

    setMockEvents(prev => {
      const snapshot = prev.find((event) => event.id === eventId);
      if (!snapshot) return prev;
      void updateEventAction({ ...snapshot, status })
        .then((saved) => {
          setMockEvents(current => current.map(item => (item.id === eventId ? saved : item)));
        })
        .catch((error) => {
          console.warn('Failed to persist event status update', error);
        });
      return prev;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // bookEventTickets
  // ---------------------------------------------------------------------------
  const bookEventTickets = useCallback((
    eventId: string,
    selections: Record<string, number>,
    attendee: { name: string; email: string; phone: string },
    userId = 'guest'
  ): { success: boolean; soldOut?: boolean; bookingRef?: string; totalAmount: number } => {
    const bookingRef = 'BK-' + Date.now();
    let totalAmount = 0;
    let soldOut = false;
    let updatedEventSnapshot: EventProduction | null = null;

    setMockEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;

      const currentBookedSeats = [...(event.bookedSeats || [])];
      const fallbackFreeTier = {
        id: 'tier-free',
        name: { he: 'Free Entry', en: 'Free Entry', ru: 'Free Entry', ar: 'Free Entry' },
        priceILS: 0,
        availableCount: Math.max(0, (event.totalSeats || 0) - currentBookedSeats.length),
      };

      const tiersInput = (event.ticketPrices && event.ticketPrices.length > 0)
        ? event.ticketPrices
        : [fallbackFreeTier];

      const tiers = tiersInput.map((tier: TicketTier) => {
        const requested = Math.max(0, selections[tier.id] || 0);
        if (requested === 0) return tier;

        if (tier.availableCount < requested) {
          soldOut = true;
          return tier;
        }

        totalAmount += requested * tier.priceILS;
        for (let i = 0; i < requested; i += 1) {
          currentBookedSeats.push({
            userId,
            tierId: tier.id,
            bookingRef,
            paidAt: tier.priceILS > 0 ? new Date().toISOString() : undefined,
          });
        }

        return { ...tier, availableCount: tier.availableCount - requested };
      });

      if (soldOut) return event;

      const remainingTotal = tiers.reduce((acc: number, tier: TicketTier) => acc + tier.availableCount, 0);
      const updatedEvent = {
        ...event,
        ticketPrices: event.ticketPrices && event.ticketPrices.length > 0 ? tiers : event.ticketPrices,
        bookedSeats: currentBookedSeats,
        totalSeats: event.totalSeats ?? remainingTotal + currentBookedSeats.length,
        status: remainingTotal <= 0 ? 'CLOSED' : event.status,
      };
      updatedEventSnapshot = updatedEvent;
      return updatedEvent;
    }));

    if (soldOut) {
      return { success: false, soldOut: true, totalAmount: 0 };
    }

    if (updatedEventSnapshot) {
      void updateEventAction(updatedEventSnapshot)
        .then((saved) => {
          setMockEvents(prev => prev.map(item => item.id === saved.id ? saved : item));
        })
        .catch((error) => {
          console.warn('Failed to persist ticket booking event state', error);
        });
    }

    return { success: true, bookingRef, totalAmount };
  }, []);

  // ---------------------------------------------------------------------------
  // addPerformanceToEvent
  // ---------------------------------------------------------------------------
  const addPerformanceToEvent = useCallback((eventId: string, studentId: string, repertoireId: string) => {
    const student = users.find(u => u.id === studentId);
    const repertoireItem = mockAssignedRepertoire.find(r => r.id === repertoireId);
    const composition = mockRepertoire.find(c => c.id === repertoireItem?.compositionId);

    if (!student || !repertoireItem || !composition) {
      toast({ variant: 'destructive', title: 'Description will be added soon' });
      return;
    }

    const newPerformance = {
      id: 'ps-' + Date.now(),
      studentId,
      studentName: student.name,
      compositionTitle: composition.title,
      composer: composition.composer,
      duration: composition.duration,
    };

    let updatedEventSnapshot: EventProduction | null = null;
    setMockEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;
      const updatedEvent = { ...event, program: [...event.program, newPerformance] };
      updatedEventSnapshot = updatedEvent;
      return updatedEvent;
    }));

    if (updatedEventSnapshot) {
      void updateEventAction(updatedEventSnapshot)
        .then((saved) => {
          setMockEvents(prev => prev.map(item => item.id === saved.id ? saved : item));
        })
        .catch((error) => {
          console.warn('Failed to persist added performance', error);
        });
    }
    toast({ title: student.name + ' added to program!' });
  }, [users, mockAssignedRepertoire, mockRepertoire, toast]);

  // ---------------------------------------------------------------------------
  // removePerformanceFromEvent
  // ---------------------------------------------------------------------------
  const removePerformanceFromEvent = useCallback((eventId: string, performanceId: string) => {
    let updatedEventSnapshot: EventProduction | null = null;
    setMockEvents(prev => prev.map(event => {
      if (event.id !== eventId) return event;
      const updatedEvent = { ...event, program: event.program.filter(p => p.id !== performanceId) };
      updatedEventSnapshot = updatedEvent;
      return updatedEvent;
    }));

    if (updatedEventSnapshot) {
      void updateEventAction(updatedEventSnapshot)
        .then((saved) => {
          setMockEvents(prev => prev.map(item => item.id === saved.id ? saved : item));
        })
        .catch((error) => {
          console.warn('Failed to persist removed performance', error);
        });
    }
    toast({ title: 'Performance removed from program' });
  }, [toast]);

  // ---------------------------------------------------------------------------
  // assignMusiciansToPerformance
  // ---------------------------------------------------------------------------
  const assignMusiciansToPerformance = useCallback((bookingId: string, assignments: Pick<PerformanceAssignment, 'userId' | 'role'>[]) => {
    setMockPerformanceBookings(prev =>
      prev.map(booking => {
        if (booking.id === bookingId) {
          const now = new Date().toISOString();
          const assignedMusicians: PerformanceAssignment[] = assignments.map(a => {
            const musicianUser = users.find(u => u.id === a.userId);
            // Preserve existing assignment data (response, rate) if already assigned
            const existing = booking.assignedMusicians?.find(m => m.userId === a.userId);
            return {
              userId: a.userId,
              name: musicianUser?.name || 'Unknown',
              instrument: musicianUser?.instruments?.[0]?.instrument || 'Unknown',
              role: a.role,
              status: existing?.status ?? 'pending',
              ratePerHour: musicianUser?.performanceProfile?.performanceRatePerHour ?? existing?.ratePerHour,
              responseAt: existing?.responseAt,
              declineReason: existing?.declineReason,
              assignedAt: existing?.assignedAt ?? now,
              assignedBy: existing?.assignedBy ?? (user?.id ?? 'admin'),
            };
          });
          return { ...booking, assignedMusicians, status: 'INVITATIONS_SENT' as PerformanceBookingStatus };
        }
        return booking;
      })
    );
  }, [users, user]);

  // ---------------------------------------------------------------------------
  // updatePerformanceBookingStatus
  // ---------------------------------------------------------------------------
  const updatePerformanceBookingStatus = useCallback((bookingId: string, status: PerformanceBookingStatus) => {
    setMockPerformanceBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId ? { ...booking, status } : booking
      )
    );
  }, []);

  // ---------------------------------------------------------------------------
  // respondToPerformanceInvitation (teacher action, client-side mock)
  // ---------------------------------------------------------------------------
  const respondToPerformanceInvitation = useCallback((
    bookingId: string,
    userId: string,
    accept: boolean,
    declineReason?: string
  ) => {
    setMockPerformanceBookings(prev =>
      prev.map(booking => {
        if (booking.id !== bookingId) return booking;
        const now = new Date().toISOString();
        const updatedMusicians = (booking.assignedMusicians ?? []).map(m => {
          if (m.userId !== userId) return m;
          return {
            ...m,
            status: accept ? 'accepted' as const : 'declined' as const,
            responseAt: now,
            declineReason: accept ? undefined : declineReason,
          };
        });
        const allAccepted = updatedMusicians.every(m => m.status === 'accepted');
        const hasDeclined = updatedMusicians.some(m => m.status === 'declined');
        const newStatus: PerformanceBookingStatus = allAccepted ? 'CONFIRMED' : hasDeclined ? 'MUSICIANS_NEEDED' : booking.status;
        return { ...booking, assignedMusicians: updatedMusicians, status: newStatus };
      })
    );
  }, []);

  // ---------------------------------------------------------------------------
  // addPerformanceBooking
  // ---------------------------------------------------------------------------
  const addPerformanceBooking = useCallback((bookingData: Partial<PerformanceBooking>) => {
    const newBooking: PerformanceBooking = {
      id: `perf-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      status: 'INQUIRY_RECEIVED',
      inquiryReceivedAt: new Date().toISOString(),
      ...bookingData
    } as PerformanceBooking;
    setMockPerformanceBookings(prev => [...prev, newBooking]);
  }, [user]);

  // ---------------------------------------------------------------------------
  // createMasterClass
  // ---------------------------------------------------------------------------
  const createMasterClass = useCallback((payload: Partial<Masterclass>): Masterclass => {
    const instructorInstrument = user?.instruments?.[0]?.instrument || payload.instrument || 'General';
    const created: Masterclass = {
      id: payload.id || ('mc-' + Date.now()),
      conservatoriumId: payload.conservatoriumId || user?.conservatoriumId || 'cons-15',
      title: payload.title || { he: payload.instrument || 'Master class', en: payload.instrument || 'Master Class' },
      description: payload.description || { he: 'Description will be added soon', en: 'Description will be added soon' },
      instructor: payload.instructor || {
        userId: user?.id || 'unknown',
        displayName: user?.name || 'Instructor',
        instrument: instructorInstrument,
        bio: user?.bio,
        photoUrl: user?.avatarUrl,
      },
      instrument: payload.instrument || instructorInstrument,
      maxParticipants: payload.maxParticipants || 12,
      targetAudience: payload.targetAudience || 'all',
      date: payload.date || new Date().toISOString().split('T')[0],
      startTime: payload.startTime || '18:00',
      durationMinutes: payload.durationMinutes || 90,
      location: payload.location || 'Main Hall',
      isOnline: payload.isOnline ?? false,
      streamUrl: payload.streamUrl,
      includedInPackage: payload.includedInPackage ?? false,
      priceILS: payload.priceILS,
      packageMasterClassCount: payload.packageMasterClassCount,
      status: user?.role === 'conservatorium_admin' || user?.role === 'site_admin' ? 'published' : 'draft',
      registrations: payload.registrations || [],
    };

    setMockMasterclasses((prev) => [created, ...prev]);
    void createMasterClassAction(created)
      .then((serverMasterClass) => {
        setMockMasterclasses((prev) => prev.map((item) => (item.id === created.id ? serverMasterClass : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist master class', error);
      });
    return created;
  }, [user]);

  // ---------------------------------------------------------------------------
  // publishMasterClass
  // ---------------------------------------------------------------------------
  const publishMasterClass = useCallback((masterClassId: string) => {
    setMockMasterclasses((prev) => prev.map((item) =>
      item.id === masterClassId ? { ...item, status: 'published' } : item
    ));
    void publishMasterClassAction(masterClassId)
      .then((serverMasterClass) => {
        setMockMasterclasses((prev) => prev.map((item) => (item.id === masterClassId ? serverMasterClass : item)));
      })
      .catch((error) => {
        console.warn('Failed to publish master class', error);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // registerToMasterClass
  // ---------------------------------------------------------------------------
  const registerToMasterClass = useCallback(async (masterClassId: string, studentId: string) => {
    const target = mockMasterclasses.find((item) => item.id === masterClassId);
    const student = users.find((item) => item.id === studentId);
    if (!target || !student) return { success: false, reason: 'not_found' };
    if (target.status !== 'published') return { success: false, reason: 'not_published' };
    if (target.registrations.some((r) => r.studentId === studentId)) return { success: false, reason: 'already_registered' };
    if (target.registrations.length >= target.maxParticipants) return { success: false, reason: 'full' };

    const allowance = mockMasterClassAllowances.find((item) =>
      item.studentId === studentId && item.conservatoriumId === target.conservatoriumId
    );

    const isPartOfPackage = Boolean(target.includedInPackage && allowance && allowance.remaining > 0);

    if (isPartOfPackage && allowance) {
      setMockMasterClassAllowances((prev) => prev.map((item) =>
        item.studentId === allowance.studentId && item.conservatoriumId === allowance.conservatoriumId
          ? { ...item, used: item.used + 1, remaining: Math.max(0, item.remaining - 1) }
          : item
      ));
    }

    const registration = {
      studentId,
      registeredAt: new Date().toISOString(),
      attendanceStatus: 'registered' as const,
      isPartOfPackage,
    };

    setMockMasterclasses((prev) => prev.map((item) =>
      item.id === masterClassId
        ? { ...item, registrations: [...item.registrations, registration] }
        : item
    ));

    if (!isPartOfPackage && (target.priceILS || 0) > 0) {
      return { success: true, chargedILS: target.priceILS || 0, remaining: allowance?.remaining };
    }

    const nextAllowance = isPartOfPackage && allowance ? Math.max(0, allowance.remaining - 1) : allowance?.remaining;
    const optimisticResult = { success: true, chargedILS: 0, remaining: nextAllowance };
    try {
      const serverResult = await registerToMasterClassAction({
        masterClassId,
        studentId,
        allowances: mockMasterClassAllowances,
      });
      if (!serverResult.success) {
        console.warn('Master class registration rejected by server', serverResult.reason);
        return serverResult;
      }
      setMockMasterclasses((prev) => prev.map((item) =>
        item.id === masterClassId ? serverResult.masterClass : item
      ));
      setMockMasterClassAllowances(serverResult.allowances);
      return { success: true, chargedILS: serverResult.chargedILS, remaining: serverResult.remaining };
    } catch (error) {
      console.warn('Failed to persist master class registration', error);
      return optimisticResult;
    }
  }, [mockMasterclasses, mockMasterClassAllowances, users]);

  // ---------------------------------------------------------------------------
  // addOpenDayAppointment
  // ---------------------------------------------------------------------------
  const addOpenDayAppointment = useCallback((appointmentData: Partial<OpenDayAppointment>) => {
    const newAppointment: OpenDayAppointment = {
      id: `open-day-appt-${Date.now()}`,
      status: 'SCHEDULED',
      registeredAt: new Date().toISOString(),
      ...appointmentData
    } as OpenDayAppointment;
    setMockOpenDayAppointments(prev => [...prev, newAppointment]);
  }, []);

  // ---------------------------------------------------------------------------
  // graduateStudent
  // ---------------------------------------------------------------------------
  const graduateStudent = useCallback((studentId: string, graduationYear: number) => {
    const student = users.find((item) => item.id === studentId);
    if (!student) return;

    setUsers((prev) => prev.map((item) =>
      item.id === studentId
        ? { ...item, status: 'graduated', graduationYear }
        : item
    ));

    setMockAlumni((prev) => {
      const exists = prev.find((item) => item.userId === studentId);
      if (exists) return prev;
      const profile: Alumnus = {
        id: 'alumni-' + studentId,
        userId: studentId,
        conservatoriumId: student.conservatoriumId,
        displayName: student.name,
        graduationYear,
        primaryInstrument: student.instruments?.[0]?.instrument || 'General',
        bio: {},
        profilePhotoUrl: student.avatarUrl,
        isPublic: false,
        availableForMasterClasses: false,
      };
      return [profile, ...prev];
    });
  }, [users, setUsers]);

  // ---------------------------------------------------------------------------
  // upsertAlumniProfile
  // ---------------------------------------------------------------------------
  const upsertAlumniProfile = useCallback((payload: Partial<Alumnus> & { userId: string }): Alumnus => {
    const existing = mockAlumni.find((item) => item.userId === payload.userId);
    if (existing) {
      const merged = { ...existing, ...payload } as Alumnus;
      setMockAlumni((prev) => prev.map((item) => (item.userId === payload.userId ? merged : item)));
      void saveAlumnus(merged)
        .then((serverAlumnus) => {
          setMockAlumni((prev) => prev.map((item) => (item.userId === payload.userId ? serverAlumnus : item)));
        })
        .catch((error) => {
          console.warn('Failed to persist alumni profile', error);
        });
      return merged;
    }

    const student = users.find((item) => item.id === payload.userId);
    const created: Alumnus = {
      id: payload.id || ('alumni-' + payload.userId),
      userId: payload.userId,
      conservatoriumId: payload.conservatoriumId || student?.conservatoriumId || user?.conservatoriumId || 'cons-15',
      displayName: payload.displayName || student?.name || 'Alumnus',
      graduationYear: payload.graduationYear || new Date().getFullYear(),
      primaryInstrument: payload.primaryInstrument || student?.instruments?.[0]?.instrument || 'General',
      currentOccupation: payload.currentOccupation,
      bio: payload.bio || {},
      profilePhotoUrl: payload.profilePhotoUrl || student?.avatarUrl,
      isPublic: payload.isPublic ?? false,
      achievements: payload.achievements || [],
      socialLinks: payload.socialLinks,
      availableForMasterClasses: payload.availableForMasterClasses ?? false,
    };

    setMockAlumni((prev) => [created, ...prev]);
    void saveAlumnus(created)
      .then((serverAlumnus) => {
        setMockAlumni((prev) => prev.map((item) => (item.userId === payload.userId ? serverAlumnus : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist alumni profile', error);
      });
    return created;
  }, [mockAlumni, users, user]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      mockEvents,
      events: mockEvents,
      setMockEvents,
      mockPerformanceBookings,
      performanceBookings: mockPerformanceBookings,
      setMockPerformanceBookings,
      mockMasterclasses,
      masterClasses: mockMasterclasses,
      setMockMasterclasses,
      mockMasterClassAllowances,
      masterClassAllowances: mockMasterClassAllowances,
      setMockMasterClassAllowances,
      mockOpenDayEvents,
      openDayEvents: mockOpenDayEvents,
      setMockOpenDayEvents,
      mockOpenDayAppointments,
      openDayAppointments: mockOpenDayAppointments,
      setMockOpenDayAppointments,
      mockAlumni,
      alumni: mockAlumni,
      setMockAlumni,
      addEvent,
      updateEvent,
      updateEventStatus,
      bookEventTickets,
      addPerformanceToEvent,
      removePerformanceFromEvent,
      assignMusiciansToPerformance,
      updatePerformanceBookingStatus,
      respondToPerformanceInvitation,
      addPerformanceBooking,
      createMasterClass,
      publishMasterClass,
      registerToMasterClass,
      addOpenDayAppointment,
      graduateStudent,
      upsertAlumniProfile,
    }),
    [
      mockEvents,
      mockPerformanceBookings,
      mockMasterclasses,
      mockMasterClassAllowances,
      mockOpenDayEvents,
      mockOpenDayAppointments,
      mockAlumni,
      addEvent,
      updateEvent,
      updateEventStatus,
      bookEventTickets,
      addPerformanceToEvent,
      removePerformanceFromEvent,
      assignMusiciansToPerformance,
      updatePerformanceBookingStatus,
      respondToPerformanceInvitation,
      addPerformanceBooking,
      createMasterClass,
      publishMasterClass,
      registerToMasterClass,
      addOpenDayAppointment,
      graduateStudent,
      upsertAlumniProfile,
    ],
  );

  return <EventsDomainContext.Provider value={value}>{children}</EventsDomainContext.Provider>;
}
