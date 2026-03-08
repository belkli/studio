'use client';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  InstrumentInventory,
  InstrumentRental,
  PracticeVideo,
  RentalModel,
  RentalCondition,
  Notification,
} from '@/lib/types';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUsersDomain } from './users-domain';
import { useAuthDomain } from './auth-domain';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InstrumentsDomainContextType {
  mockInstrumentInventory: InstrumentInventory[];
  instrumentInventory: InstrumentInventory[];
  setMockInstrumentInventory: React.Dispatch<React.SetStateAction<InstrumentInventory[]>>;

  mockInstrumentRentals: InstrumentRental[];
  instrumentRentals: InstrumentRental[];
  setMockInstrumentRentals: React.Dispatch<React.SetStateAction<InstrumentRental[]>>;

  mockPracticeVideos: PracticeVideo[];
  practiceVideos: PracticeVideo[];
  setMockPracticeVideos: React.Dispatch<React.SetStateAction<PracticeVideo[]>>;

  addInstrument: (instrumentData: Partial<InstrumentInventory>) => void;
  updateInstrument: (instrumentId: string, instrumentData: Partial<InstrumentInventory>) => void;
  deleteInstrument: (instrumentId: string) => void;
  assignInstrumentToStudent: (instrumentId: string, studentId: string, checkoutDetails?: { expectedReturnDate: string; parentSignatureUrl: string; depositAmount?: number }) => void;
  initiateInstrumentRental: (payload: { instrumentId: string; studentId: string; parentId: string; rentalModel: RentalModel; startDate: string; expectedReturnDate?: string; depositAmountILS?: number; monthlyFeeILS?: number; purchasePriceILS?: number; monthsUntilPurchaseEligible?: number; }) => { rentalId: string; signingToken: string; signingLink: string };
  getRentalByToken: (token: string) => InstrumentRental | undefined;
  confirmRentalSignature: (token: string, signatureUrl: string) => { success: boolean; rentalId?: string };
  returnInstrument: (instrumentId: string) => void;
  markInstrumentRentalReturned: (rentalId: string, condition: RentalCondition, customRefundAmountILS?: number) => { success: boolean; refundAmountILS: number };
  addPracticeVideo: (videoData: Partial<PracticeVideo>) => void;
  addVideoFeedback: (videoId: string, comment: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const InstrumentsDomainContext = createContext<InstrumentsDomainContextType | null>(null);

export const useInstrumentsDomain = () => {
  const ctx = useContext(InstrumentsDomainContext);
  if (!ctx) throw new Error('useInstrumentsDomain must be within InstrumentsDomainProvider');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function InstrumentsDomainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // needs setUsers to push rent-to-own purchase-eligible notifications to parent users
  const { users, setUsers } = useUsersDomain();
  // needs current session user for conservatoriumId defaults and addPracticeVideo / addVideoFeedback logic
  const { user } = useAuthDomain();
  const { toast } = useToast();

  const [mockInstrumentInventory, setMockInstrumentInventory] = useState<InstrumentInventory[]>([]);
  const [mockInstrumentRentals, setMockInstrumentRentals] = useState<InstrumentRental[]>([]);
  const [mockPracticeVideos, setMockPracticeVideos] = useState<PracticeVideo[]>([]);

  // ---------------------------------------------------------------------------
  // Rent-to-own purchase-eligible notification effect
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const now = new Date();
    const dueRentals = mockInstrumentRentals.filter((rental) => {
      if (rental.rentalModel !== 'rent_to_own') return false;
      if (rental.status !== 'active') return false;
      if (!rental.monthsUntilPurchaseEligible) return false;
      if (rental.purchaseEligibleNotifiedAt) return false;

      const start = startOfDay(new Date(rental.startDate));
      const elapsedDays = differenceInCalendarDays(now, start);
      const minimumDays = rental.monthsUntilPurchaseEligible * 30;
      return elapsedDays >= minimumDays;
    });

    if (dueRentals.length === 0) return;

    const nowIso = now.toISOString();
    const dueIds = new Set(dueRentals.map((item) => item.id));
    const notificationsByParent = new Map<string, Notification[]>();

    for (const rental of dueRentals) {
      const instrument = mockInstrumentInventory.find((inst) => inst.id === rental.instrumentId);
      const notification: Notification = {
        id: 'notif-rent-to-own-' + rental.id + '-' + Date.now(),
        title: 'Purchase option is now available',
        message: 'You can now purchase ' + (instrument?.name || instrument?.type || 'your rented instrument') + '.',
        timestamp: nowIso,
        link: '/dashboard/admin/rentals',
        read: false,
      };

      const existing = notificationsByParent.get(rental.parentId) || [];
      notificationsByParent.set(rental.parentId, [notification, ...existing]);
    }

    setMockInstrumentRentals((prev) =>
      prev.map((rental) => (dueIds.has(rental.id) ? { ...rental, purchaseEligibleNotifiedAt: nowIso } : rental))
    );

    setUsers((prevUsers) =>
      prevUsers.map((entry) => {
        const parentNotifications = notificationsByParent.get(entry.id);
        if (!parentNotifications || parentNotifications.length === 0) return entry;
        return { ...entry, notifications: [...parentNotifications, ...(entry.notifications || [])] };
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockInstrumentInventory, mockInstrumentRentals]);

  // ---------------------------------------------------------------------------
  // assignInstrumentToStudent
  // ---------------------------------------------------------------------------
  const assignInstrumentToStudent = useCallback((instrumentId: string, studentId: string, checkoutDetails?: { expectedReturnDate: string; parentSignatureUrl: string; depositAmount?: number }) => {
    setMockInstrumentInventory(prev => prev.map(inst =>
      inst.id === instrumentId
        ? {
          ...inst,
          currentRenterId: studentId,
          rentalStartDate: new Date().toISOString(),
          currentCheckout: checkoutDetails ? {
            studentId,
            checkedOutAt: new Date().toISOString(),
            expectedReturnDate: checkoutDetails.expectedReturnDate,
            parentSignatureUrl: checkoutDetails.parentSignatureUrl,
            depositAmount: checkoutDetails.depositAmount
          } : undefined
        }
        : inst
    ));
    toast({ title: 'Instrument assigned successfully' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // ---------------------------------------------------------------------------
  // initiateInstrumentRental
  // ---------------------------------------------------------------------------
  const initiateInstrumentRental = useCallback((payload: { instrumentId: string; studentId: string; parentId: string; rentalModel: RentalModel; startDate: string; expectedReturnDate?: string; depositAmountILS?: number; monthlyFeeILS?: number; purchasePriceILS?: number; monthsUntilPurchaseEligible?: number; }) => {
    const token = 'rent-sign-' + Date.now();
    const rentalId = 'rental-' + Date.now();
    const now = new Date().toISOString();

    const newRental: InstrumentRental = {
      id: rentalId,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      instrumentId: payload.instrumentId,
      studentId: payload.studentId,
      parentId: payload.parentId,
      rentalModel: payload.rentalModel,
      depositAmountILS: payload.depositAmountILS,
      monthlyFeeILS: payload.monthlyFeeILS,
      purchasePriceILS: payload.purchasePriceILS,
      monthsUntilPurchaseEligible: payload.monthsUntilPurchaseEligible,
      startDate: payload.startDate,
      expectedReturnDate: payload.expectedReturnDate,
      status: 'pending_signature',
      signingToken: token,
      condition: 'good',
      notes: 'Awaiting parent signature',
    };

    setMockInstrumentRentals(prev => [newRental, ...prev]);

    const parent = users.find(u => u.id === payload.parentId);
    if (parent) {
      const parentNotification: Notification = {
        id: 'notif-rental-' + Date.now(),
        title: 'Instrument rental request awaiting your signature',
        message: 'Please sign the rental agreement: /rental-sign/' + token,
        timestamp: now,
        link: '/rental-sign/' + token,
        read: false,
      };
      setUsers(prevUsers => prevUsers.map(u => u.id === parent.id
        ? { ...u, notifications: [parentNotification, ...(u.notifications || [])] }
        : u));
    }

    toast({ title: 'Signature request sent to parent (app + SMS/WhatsApp link)' });
    return { rentalId, signingToken: token, signingLink: '/rental-sign/' + token };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, users, setUsers, toast]);

  // ---------------------------------------------------------------------------
  // getRentalByToken
  // ---------------------------------------------------------------------------
  const getRentalByToken = useCallback((token: string) => {
    return mockInstrumentRentals.find(r => r.signingToken === token);
  }, [mockInstrumentRentals]);

  // ---------------------------------------------------------------------------
  // confirmRentalSignature
  // ---------------------------------------------------------------------------
  const confirmRentalSignature = useCallback((token: string, signatureUrl: string) => {
    const rental = mockInstrumentRentals.find(r => r.signingToken === token);
    if (!rental || rental.status !== 'pending_signature') {
      return { success: false };
    }

    const signedAt = new Date().toISOString();
    setMockInstrumentRentals(prev => prev.map(item => item.signingToken === token
      ? { ...item, parentSignedAt: signedAt, parentSignatureUrl: signatureUrl, status: 'active' }
      : item));

    setMockInstrumentInventory(prev => prev.map(inst => {
      if (inst.id !== rental.instrumentId) return inst;
      return {
        ...inst,
        currentRenterId: rental.studentId,
        rentalStartDate: rental.startDate,
        currentCheckout: {
          studentId: rental.studentId,
          checkedOutAt: signedAt,
          expectedReturnDate: rental.expectedReturnDate || rental.startDate,
          parentSignatureUrl: signatureUrl,
          depositAmount: rental.depositAmountILS,
        }
      };
    }));

    const student = users.find(u => u.id === rental.studentId);
    const parent = users.find(u => u.id === rental.parentId);
    const instrument = mockInstrumentInventory.find(inst => inst.id === rental.instrumentId);
    const adminNotification: Notification = {
      id: 'notif-admin-rental-' + Date.now(),
      title: 'Rental agreement signed',
      message: (parent?.name || 'Parent') + ' has signed rental for ' + (instrument?.name || instrument?.type || student?.name || rental.studentId),
      timestamp: signedAt,
      link: '/dashboard/admin/rentals',
      read: false,
    };
    setUsers(prevUsers => prevUsers.map(u => (u.role === 'conservatorium_admin' || u.role === 'site_admin') && u.conservatoriumId === rental.conservatoriumId
      ? { ...u, notifications: [adminNotification, ...(u.notifications || [])] }
      : u));

    return { success: true, rentalId: rental.id };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockInstrumentRentals, mockInstrumentInventory, users, setUsers]);

  // ---------------------------------------------------------------------------
  // returnInstrument
  // ---------------------------------------------------------------------------
  const returnInstrument = useCallback((instrumentId: string) => {
    setMockInstrumentInventory(prev => prev.map(inst =>
      inst.id === instrumentId
        ? { ...inst, currentRenterId: undefined, rentalStartDate: undefined, currentCheckout: undefined }
        : inst
    ));
    toast({ title: 'Instrument returned to inventory' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // ---------------------------------------------------------------------------
  // markInstrumentRentalReturned
  // ---------------------------------------------------------------------------
  const markInstrumentRentalReturned = useCallback((rentalId: string, condition: RentalCondition, customRefundAmountILS?: number) => {
    const rental = mockInstrumentRentals.find(item => item.id === rentalId);
    if (!rental) return { success: false, refundAmountILS: 0 };

    const deposit = rental.depositAmountILS || 0;
    const refundMap: Record<RentalCondition, number> = {
      excellent: deposit,
      good: deposit,
      fair: Math.round(deposit * 0.7),
      damaged: 0,
    };

    const refundAmountILS = customRefundAmountILS ?? refundMap[condition];
    const now = new Date().toISOString();

    setMockInstrumentRentals(prev => prev.map(item => item.id === rentalId
      ? { ...item, status: 'returned', condition, actualReturnDate: now, refundAmountILS }
      : item));

    setMockInstrumentInventory(prev => prev.map(inst => inst.id === rental.instrumentId
      ? { ...inst, currentRenterId: undefined, rentalStartDate: undefined, currentCheckout: undefined }
      : inst));

    toast({ title: 'Refund calculated: ILS ' + refundAmountILS });
    return { success: true, refundAmountILS };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockInstrumentRentals, toast]);

  // ---------------------------------------------------------------------------
  // addInstrument
  // ---------------------------------------------------------------------------
  const addInstrument = useCallback((instrumentData: Partial<InstrumentInventory>) => {
    const newInstrument: InstrumentInventory = {
      id: `inst-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-1',
      condition: 'GOOD',
      ...instrumentData,
    } as InstrumentInventory;
    setMockInstrumentInventory(prev => [...prev, newInstrument]);
    toast({ title: 'Instrument added to inventory' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, toast]);

  // ---------------------------------------------------------------------------
  // updateInstrument
  // ---------------------------------------------------------------------------
  const updateInstrument = useCallback((instrumentId: string, instrumentData: Partial<InstrumentInventory>) => {
    setMockInstrumentInventory(prev => prev.map(inst =>
      inst.id === instrumentId ? { ...inst, ...instrumentData } : inst
    ));
    toast({ title: 'Instrument details updated' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // ---------------------------------------------------------------------------
  // deleteInstrument
  // ---------------------------------------------------------------------------
  const deleteInstrument = useCallback((instrumentId: string) => {
    setMockInstrumentInventory(prev => prev.filter(inst => inst.id !== instrumentId));
    toast({ title: 'Room details updated' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // ---------------------------------------------------------------------------
  // addPracticeVideo
  // ---------------------------------------------------------------------------
  const addPracticeVideo = useCallback((videoData: Partial<PracticeVideo>) => {
    if (!user) return;
    const studentId = user.role === 'student' ? user.id : user.childIds?.[0];
    const student = users.find(u => u.id === studentId);
    const teacherName = student?.instruments?.[0]?.teacherName;
    const teacherId = teacherName ? users.find(t => t.name === teacherName)?.id : undefined;
    if (!studentId || !teacherId) return;

    const newVideo: PracticeVideo = {
      id: `pv-${Date.now()}`,
      studentId: studentId,
      teacherId: teacherId,
      createdAt: new Date().toISOString(),
      videoUrl: 'https://placehold.co/600x400.mp4',
      ...videoData
    } as PracticeVideo;
    setMockPracticeVideos(prev => [...prev, newVideo]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, users]);

  // ---------------------------------------------------------------------------
  // addVideoFeedback
  // ---------------------------------------------------------------------------
  const addVideoFeedback = useCallback((videoId: string, comment: string) => {
    if (!user) return;
    const newFeedback = {
      teacherId: user.id,
      comment: comment,
      createdAt: new Date().toISOString(),
    };
    setMockPracticeVideos(prev => prev.map(v => v.id === videoId ? { ...v, feedback: [...(v.feedback || []), newFeedback] } : v));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      mockInstrumentInventory,
      instrumentInventory: mockInstrumentInventory,
      setMockInstrumentInventory,
      mockInstrumentRentals,
      instrumentRentals: mockInstrumentRentals,
      setMockInstrumentRentals,
      mockPracticeVideos,
      practiceVideos: mockPracticeVideos,
      setMockPracticeVideos,
      addInstrument,
      updateInstrument,
      deleteInstrument,
      assignInstrumentToStudent,
      initiateInstrumentRental,
      getRentalByToken,
      confirmRentalSignature,
      returnInstrument,
      markInstrumentRentalReturned,
      addPracticeVideo,
      addVideoFeedback,
    }),
    [
      mockInstrumentInventory,
      mockInstrumentRentals,
      mockPracticeVideos,
      addInstrument,
      updateInstrument,
      deleteInstrument,
      assignInstrumentToStudent,
      initiateInstrumentRental,
      getRentalByToken,
      confirmRentalSignature,
      returnInstrument,
      markInstrumentRentalReturned,
      addPracticeVideo,
      addVideoFeedback,
    ],
  );

  return <InstrumentsDomainContext.Provider value={value}>{children}</InstrumentsDomainContext.Provider>;
}
