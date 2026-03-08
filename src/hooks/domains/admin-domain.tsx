'use client';
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  Conservatorium,
  ConservatoriumInstrument,
  LessonPackage,
  Branch,
  Room,
  WaitlistEntry,
  WaitlistStatus,
  PayrollSummary,
  PayrollStatus,
  Package,
  Invoice,
  PlayingSchoolInvoice,
  ScholarshipApplication,
  DonationCause,
  DonationCauseCategory,
  DonationRecord,
} from '@/lib/types';
import {
  upsertConservatoriumAction,
  createBranchAction,
  updateBranchAction,
  createConservatoriumInstrumentAction,
  updateConservatoriumInstrumentAction,
  deleteConservatoriumInstrumentAction,
  createLessonPackageAction,
  updateLessonPackageAction,
  deleteLessonPackageAction,
  createRoomAction,
  updateRoomAction,
  deleteRoomAction,
  createScholarshipApplicationAction,
  updateScholarshipStatusAction,
  markScholarshipPaidAction,
  createDonationCauseAction,
  recordDonationAction,
} from '@/app/actions';
import { addHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuthDomain } from './auth-domain';
import { useUsersDomain } from './users-domain';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminDomainContextType {
  conservatoriums: Conservatorium[];
  setConservatoriums: React.Dispatch<React.SetStateAction<Conservatorium[]>>;

  conservatoriumInstruments: ConservatoriumInstrument[];
  setConservatoriumInstruments: React.Dispatch<React.SetStateAction<ConservatoriumInstrument[]>>;

  lessonPackages: LessonPackage[];
  setLessonPackages: React.Dispatch<React.SetStateAction<LessonPackage[]>>;

  mockBranches: Branch[];
  branches: Branch[];
  setMockBranches: React.Dispatch<React.SetStateAction<Branch[]>>;

  mockRooms: Room[];
  rooms: Room[];
  setMockRooms: React.Dispatch<React.SetStateAction<Room[]>>;

  mockWaitlist: WaitlistEntry[];
  waitlist: WaitlistEntry[];
  setMockWaitlist: React.Dispatch<React.SetStateAction<WaitlistEntry[]>>;

  mockPayrolls: PayrollSummary[];
  payrolls: PayrollSummary[];
  setMockPayrolls: React.Dispatch<React.SetStateAction<PayrollSummary[]>>;

  mockPackages: Package[];
  packages: Package[];
  setMockPackages: React.Dispatch<React.SetStateAction<Package[]>>;

  mockInvoices: Invoice[];
  invoices: Invoice[];
  setMockInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;

  mockPlayingSchoolInvoices: PlayingSchoolInvoice[];
  playingSchoolInvoices: PlayingSchoolInvoice[];
  setMockPlayingSchoolInvoices: React.Dispatch<React.SetStateAction<PlayingSchoolInvoice[]>>;

  mockScholarshipApplications: ScholarshipApplication[];
  scholarshipApplications: ScholarshipApplication[];
  setMockScholarshipApplications: React.Dispatch<React.SetStateAction<ScholarshipApplication[]>>;

  mockDonationCauses: DonationCause[];
  donationCauses: DonationCause[];
  setMockDonationCauses: React.Dispatch<React.SetStateAction<DonationCause[]>>;

  mockDonations: DonationRecord[];
  donations: DonationRecord[];
  setMockDonations: React.Dispatch<React.SetStateAction<DonationRecord[]>>;

  updateConservatorium: (updatedConservatorium: Conservatorium) => void;
  addBranch: (branchData: Partial<Branch>) => void;
  updateBranch: (branchData: Branch) => void;
  addConservatoriumInstrument: (instrumentData: Partial<ConservatoriumInstrument>) => void;
  updateConservatoriumInstrument: (instrumentId: string, instrumentData: Partial<ConservatoriumInstrument>) => void;
  deleteConservatoriumInstrument: (instrumentId: string) => void;
  addLessonPackage: (packageData: Partial<LessonPackage>) => void;
  updateLessonPackage: (packageId: string, packageData: Partial<LessonPackage>) => void;
  deleteLessonPackage: (packageId: string) => void;
  addRoom: (roomData: Partial<Room>) => void;
  updateRoom: (roomId: string, roomData: Partial<Room>) => void;
  deleteRoom: (roomId: string) => void;
  addToWaitlist: (waitlistEntry: Partial<WaitlistEntry>) => void;
  updateWaitlistStatus: (entryId: string, status: WaitlistStatus) => void;
  offerSlotToWaitlisted: (entryId: string, slotId: string, slotTimeLabel: string) => void;
  acceptWaitlistOffer: (entryId: string) => void;
  declineWaitlistOffer: (entryId: string) => void;
  expireWaitlistOffers: () => void;
  revokeWaitlistOffer: (entryId: string) => void;
  updatePayrollStatus: (payrollId: string, status: PayrollStatus) => void;
  addScholarshipApplication: (applicationData: Partial<ScholarshipApplication>) => void;
  updateScholarshipStatus: (applicationId: string, status: 'APPROVED' | 'REJECTED') => void;
  markScholarshipAsPaid: (applicationId: string) => void;
  addDonationCause: (cause: { names: { he: string; en: string }; descriptions: { he: string; en: string }; category: DonationCauseCategory; targetAmountILS?: number; }) => DonationCause;
  recordDonation: (donation: { causeId: string; amountILS: number; frequency: 'once' | 'monthly' | 'yearly'; donorName?: string; donorEmail?: string; donorId?: string; status?: DonationRecord['status']; }) => DonationRecord;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AdminDomainContext = createContext<AdminDomainContextType | null>(null);

export const useAdminDomain = () => {
  const ctx = useContext(AdminDomainContext);
  if (!ctx) throw new Error('useAdminDomain must be within AdminDomainProvider');
  return ctx;
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AdminDomainProvider({
  children,
  onRoomsChange,
  onConservatoriumInstrumentsChange,
}: {
  children: React.ReactNode;
  onRoomsChange?: (rooms: Room[]) => void;
  onConservatoriumInstrumentsChange?: (instruments: ConservatoriumInstrument[]) => void;
}) {
  // needs current session user for conservatoriumId defaults and scholarship logic
  const { user } = useAuthDomain();
  // needs users for scholarship (finding student) and PS invoice initialization
  const { users } = useUsersDomain();
  const { toast } = useToast();

  const [conservatoriums, setConservatoriums] = useState<Conservatorium[]>([]);
  const [conservatoriumInstruments, setConservatoriumInstruments] = useState<ConservatoriumInstrument[]>([]);
  const [lessonPackages, setLessonPackages] = useState<LessonPackage[]>([]);
  const [mockBranches, setMockBranches] = useState<Branch[]>([]);
  const [mockRooms, setMockRooms] = useState<Room[]>([]);
  const [mockWaitlist, setMockWaitlist] = useState<WaitlistEntry[]>([]);
  const [mockPayrolls, setMockPayrolls] = useState<PayrollSummary[]>([]);
  const [mockPackages, setMockPackages] = useState<Package[]>([]);
  const [mockInvoices, setMockInvoices] = useState<Invoice[]>([]);
  const [mockPlayingSchoolInvoices, setMockPlayingSchoolInvoices] = useState<PlayingSchoolInvoice[]>([]);
  const [mockScholarshipApplications, setMockScholarshipApplications] = useState<ScholarshipApplication[]>([]);
  const [mockDonationCauses, setMockDonationCauses] = useState<DonationCause[]>([]);
  const [mockDonations, setMockDonations] = useState<DonationRecord[]>([]);

  // Sync mockRooms → roomsRef in LessonsDomainProvider via callback prop
  useEffect(() => {
    onRoomsChange?.(mockRooms);
  }, [mockRooms, onRoomsChange]);

  // Sync conservatoriumInstruments → conservatoriumInstrumentsRef in LessonsDomainProvider via callback prop
  useEffect(() => {
    onConservatoriumInstrumentsChange?.(conservatoriumInstruments);
  }, [conservatoriumInstruments, onConservatoriumInstrumentsChange]);

  // Initialize PS invoices when a parent with playing-school children logs in
  useEffect(() => {
    if (user?.role === 'parent' && users.some(u => u.parentId === user.id && u.playingSchoolInfo)) {
      const psChildren = users.filter(u => u.parentId === user.id && u.playingSchoolInfo);
      const initialPsInvoices: PlayingSchoolInvoice[] = psChildren.map(child => ({
        id: `ps-inv-${child.id}`,
        studentId: child.id,
        parentId: user.id,
        amount: 1500,
        description: `Playing School Program - ${child.playingSchoolInfo?.instrument} at ${child.playingSchoolInfo?.schoolName}`,
        dueDate: '2024-04-01',
        status: 'PENDING',
        academicYear: '2023-2024'
      }));
      setMockPlayingSchoolInvoices(initialPsInvoices);
    }
  }, [user, users]);

  // ---------------------------------------------------------------------------
  // updateConservatorium
  // ---------------------------------------------------------------------------
  const updateConservatorium = useCallback((updatedConservatorium: Conservatorium) => {
    setConservatoriums(prev => prev.map(c => c.id === updatedConservatorium.id ? updatedConservatorium : c));

    void upsertConservatoriumAction(updatedConservatorium)
      .then((saved) => {
        setConservatoriums(prev => prev.map(item => item.id === saved.id ? saved : item));
      })
      .catch((error) => {
        console.warn('Failed to persist conservatorium', error);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // addBranch
  // ---------------------------------------------------------------------------
  const addBranch = useCallback((branchData: Partial<Branch>) => {
    const newBranch: Branch = {
      id: branchData.id || `branch-${Date.now()}`,
      conservatoriumId: branchData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      name: branchData.name || 'Branch',
      address: branchData.address || '',
    };
    setMockBranches(prev => [...prev, newBranch]);

    void createBranchAction(newBranch)
      .then((saved) => {
        setMockBranches(prev => prev.map(item => (item.id === newBranch.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist branch', error);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // updateBranch
  // ---------------------------------------------------------------------------
  const updateBranch = useCallback((updatedBranch: Branch) => {
    setMockBranches(prev => prev.map(b => b.id === updatedBranch.id ? updatedBranch : b));

    void updateBranchAction(updatedBranch)
      .then((saved) => {
        setMockBranches(prev => prev.map(item => (item.id === saved.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist branch update, retrying as create', error);
        void createBranchAction({ ...updatedBranch, id: updatedBranch.id })
          .then((saved) => {
            setMockBranches(prev => prev.map(item => (item.id === updatedBranch.id ? saved : item)));
          })
          .catch((createError) => {
            console.warn('Failed to create branch during update fallback', createError);
          });
      });
  }, []);

  // ---------------------------------------------------------------------------
  // addConservatoriumInstrument
  // ---------------------------------------------------------------------------
  const addConservatoriumInstrument = useCallback((instrumentData: Partial<ConservatoriumInstrument>) => {
    const newInstrument: ConservatoriumInstrument = {
      id: instrumentData.id || `cons-inst-${Date.now()}`,
      conservatoriumId: instrumentData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      instrumentCatalogId: instrumentData.instrumentCatalogId,
      names: instrumentData.names || { he: '', en: '' },
      isActive: instrumentData.isActive ?? true,
      teacherCount: instrumentData.teacherCount ?? 0,
      availableForRegistration: instrumentData.availableForRegistration ?? true,
      availableForRental: instrumentData.availableForRental ?? true,
    };
    setConservatoriumInstruments(prev => [...prev, newInstrument]);

    void createConservatoriumInstrumentAction(newInstrument)
      .then((saved) => {
        setConservatoriumInstruments(prev => prev.map(item => (item.id === newInstrument.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist conservatorium instrument', error);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // updateConservatoriumInstrument
  // ---------------------------------------------------------------------------
  const updateConservatoriumInstrument = useCallback((instrumentId: string, instrumentData: Partial<ConservatoriumInstrument>) => {
    setConservatoriumInstruments(prev => prev.map(item => item.id === instrumentId ? { ...item, ...instrumentData } : item));

    setConservatoriumInstruments(prev => {
      const snapshot = prev.find((item) => item.id === instrumentId);
      if (!snapshot) return prev;
      void updateConservatoriumInstrumentAction({ ...snapshot, ...instrumentData, id: instrumentId })
        .then((saved) => {
          setConservatoriumInstruments(current => current.map(item => (item.id === instrumentId ? saved : item)));
        })
        .catch((error) => {
          console.warn('Failed to persist conservatorium instrument update, retrying as create', error);
          void createConservatoriumInstrumentAction({ ...snapshot, ...instrumentData, id: instrumentId })
            .then((saved) => {
              setConservatoriumInstruments(current => current.map(item => (item.id === instrumentId ? saved : item)));
            })
            .catch((createError) => {
              console.warn('Failed to create conservatorium instrument during update fallback', createError);
            });
        });
      return prev;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // deleteConservatoriumInstrument
  // ---------------------------------------------------------------------------
  const deleteConservatoriumInstrument = useCallback((instrumentId: string) => {
    setConservatoriumInstruments(prev => prev.filter(item => item.id !== instrumentId));

    void deleteConservatoriumInstrumentAction(instrumentId)
      .catch((error) => {
        console.warn('Failed to delete conservatorium instrument', error);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // addLessonPackage
  // ---------------------------------------------------------------------------
  const addLessonPackage = useCallback((packageData: Partial<LessonPackage>) => {
    const newPackage: LessonPackage = {
      id: packageData.id || `lesson-pkg-${Date.now()}`,
      conservatoriumId: packageData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      names: packageData.names || { he: '', en: '' },
      type: packageData.type || 'monthly',
      lessonCount: packageData.lessonCount ?? null,
      durationMinutes: packageData.durationMinutes || 45,
      priceILS: packageData.priceILS || 0,
      isActive: packageData.isActive ?? true,
      instruments: packageData.instruments || [],
      conservatoriumInstrumentIds: packageData.conservatoriumInstrumentIds,
      instrumentCatalogIds: packageData.instrumentCatalogIds,
      notes: packageData.notes,
    };
    setLessonPackages(prev => [...prev, newPackage]);

    void createLessonPackageAction(newPackage)
      .then((saved) => {
        setLessonPackages(prev => prev.map(item => (item.id === newPackage.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist lesson package', error);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // updateLessonPackage
  // ---------------------------------------------------------------------------
  const updateLessonPackage = useCallback((packageId: string, packageData: Partial<LessonPackage>) => {
    setLessonPackages(prev => prev.map(item => item.id === packageId ? { ...item, ...packageData } : item));

    setLessonPackages(prev => {
      const snapshot = prev.find((item) => item.id === packageId);
      if (!snapshot) return prev;
      void updateLessonPackageAction({ ...snapshot, ...packageData, id: packageId })
        .then((saved) => {
          setLessonPackages(current => current.map(item => (item.id === packageId ? saved : item)));
        })
        .catch((error) => {
          console.warn('Failed to persist lesson package update, retrying as create', error);
          void createLessonPackageAction({ ...snapshot, ...packageData, id: packageId })
            .then((saved) => {
              setLessonPackages(current => current.map(item => (item.id === packageId ? saved : item)));
            })
            .catch((createError) => {
              console.warn('Failed to create lesson package during update fallback', createError);
            });
        });
      return prev;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // deleteLessonPackage
  // ---------------------------------------------------------------------------
  const deleteLessonPackage = useCallback((packageId: string) => {
    setLessonPackages(prev => prev.filter(item => item.id !== packageId));

    void deleteLessonPackageAction(packageId)
      .catch((error) => {
        console.warn('Failed to delete lesson package', error);
      });
  }, []);

  // ---------------------------------------------------------------------------
  // addRoom
  // ---------------------------------------------------------------------------
  const addRoom = useCallback((roomData: Partial<Room>) => {
    const newRoom: Room = {
      id: roomData.id || `room-${Date.now()}`,
      conservatoriumId: roomData.conservatoriumId || user?.conservatoriumId || 'cons-15',
      branchId: roomData.branchId || mockBranches[0]?.id || 'branch-1',
      name: roomData.name || 'Room',
      capacity: roomData.capacity || 1,
      instrumentEquipment: roomData.instrumentEquipment || [],
      blocks: roomData.blocks || [],
      isActive: roomData.isActive ?? true,
      description: roomData.description,
      photoUrl: roomData.photoUrl,
      equipment: roomData.equipment,
    };
    setMockRooms(prev => [...prev, newRoom]);
    toast({ title: 'Room added successfully' });

    void createRoomAction(newRoom)
      .then((saved) => {
        setMockRooms(prev => prev.map(item => (item.id === newRoom.id ? saved : item)));
      })
      .catch((error) => {
        console.warn('Failed to persist room', error);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mockBranches, toast]);

  // ---------------------------------------------------------------------------
  // updateRoom
  // ---------------------------------------------------------------------------
  const updateRoom = useCallback((roomId: string, roomData: Partial<Room>) => {
    setMockRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...roomData } : r));
    toast({ title: 'Room details updated' });

    setMockRooms(prev => {
      const snapshot = prev.find((room) => room.id === roomId);
      if (!snapshot) return prev;
      void updateRoomAction({ ...snapshot, ...roomData, id: roomId })
        .then((saved) => {
          setMockRooms(current => current.map(item => (item.id === roomId ? saved : item)));
        })
        .catch((error) => {
          console.warn('Failed to persist room update, retrying as create', error);
          void createRoomAction({ ...snapshot, ...roomData, id: roomId })
            .then((saved) => {
              setMockRooms(current => current.map(item => (item.id === roomId ? saved : item)));
            })
            .catch((createError) => {
              console.warn('Failed to create room during update fallback', createError);
            });
        });
      return prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // ---------------------------------------------------------------------------
  // deleteRoom
  // ---------------------------------------------------------------------------
  const deleteRoom = useCallback((roomId: string) => {
    setMockRooms(prev => prev.filter(r => r.id !== roomId));
    toast({ title: 'Room deleted' });

    void deleteRoomAction(roomId)
      .catch((error) => {
        console.warn('Failed to delete room', error);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // ---------------------------------------------------------------------------
  // addToWaitlist
  // ---------------------------------------------------------------------------
  const addToWaitlist = useCallback((waitlistEntry: Partial<WaitlistEntry>) => {
    const newEntry: WaitlistEntry = {
      id: `wl-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      status: 'PENDING',
      ...waitlistEntry
    } as WaitlistEntry;
    setMockWaitlist(prev => [...prev, newEntry]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // updateWaitlistStatus
  // ---------------------------------------------------------------------------
  const updateWaitlistStatus = useCallback((entryId: string, status: WaitlistStatus) => {
    setMockWaitlist(prev => prev.map(e => e.id === entryId ? { ...e, status } : e));
  }, []);

  // ---------------------------------------------------------------------------
  // offerSlotToWaitlisted
  // ---------------------------------------------------------------------------
  const offerSlotToWaitlisted = useCallback((entryId: string, slotId: string, slotTimeLabel: string) => {
    const expiresAt = addHours(new Date(), 48).toISOString();
    setMockWaitlist(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, status: 'OFFERED' as WaitlistStatus, offeredSlotId: slotId, offeredSlotTime: slotTimeLabel, offerExpiresAt: expiresAt, notifiedAt: new Date().toISOString() }
        : e
    ));
  }, []);

  // ---------------------------------------------------------------------------
  // acceptWaitlistOffer
  // ---------------------------------------------------------------------------
  const acceptWaitlistOffer = useCallback((entryId: string) => {
    setMockWaitlist(prev => {
      const entry = prev.find(e => e.id === entryId);
      if (!entry || entry.status !== 'OFFERED') return prev;
      if (entry.offerExpiresAt && new Date(entry.offerExpiresAt) < new Date()) return prev;
      return prev.map(e =>
        e.id === entryId
          ? { ...e, status: 'ACCEPTED' as WaitlistStatus, offerAcceptedAt: new Date().toISOString() }
          : e
      );
    });
  }, []);

  // ---------------------------------------------------------------------------
  // declineWaitlistOffer
  // ---------------------------------------------------------------------------
  const declineWaitlistOffer = useCallback((entryId: string) => {
    setMockWaitlist(prev => prev.map(e =>
      e.id === entryId
        ? { ...e, status: 'DECLINED' as WaitlistStatus, offerDeclinedAt: new Date().toISOString() }
        : e
    ));
  }, []);

  // ---------------------------------------------------------------------------
  // expireWaitlistOffers
  // ---------------------------------------------------------------------------
  const expireWaitlistOffers = useCallback(() => {
    const now = new Date();
    setMockWaitlist(prev => prev.map(e =>
      e.status === 'OFFERED' && e.offerExpiresAt && new Date(e.offerExpiresAt) < now
        ? { ...e, status: 'EXPIRED' as WaitlistStatus }
        : e
    ));
  }, []);

  // ---------------------------------------------------------------------------
  // revokeWaitlistOffer
  // ---------------------------------------------------------------------------
  const revokeWaitlistOffer = useCallback((entryId: string) => {
    setMockWaitlist(prev => prev.map(e =>
      e.id === entryId && e.status === 'OFFERED'
        ? { ...e, status: 'WAITING' as WaitlistStatus, offeredSlotId: undefined, offeredSlotTime: undefined, offerExpiresAt: undefined }
        : e
    ));
  }, []);

  // ---------------------------------------------------------------------------
  // updatePayrollStatus
  // ---------------------------------------------------------------------------
  const updatePayrollStatus = useCallback((payrollId: string, status: PayrollStatus) => {
    setMockPayrolls(prev => prev.map(p => p.id === payrollId ? { ...p, status } : p));
  }, []);

  // ---------------------------------------------------------------------------
  // addScholarshipApplication
  // ---------------------------------------------------------------------------
  const addScholarshipApplication = useCallback((applicationData: Partial<ScholarshipApplication>) => {
    const student = users.find(u => u.id === user?.id || user?.childIds?.includes(u.id));
    if (!student) return;

    const newApplication: ScholarshipApplication = {
      id: `schol-app-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      instrument: student.instruments?.[0]?.instrument || 'Unknown',
      conservatoriumId: student.conservatoriumId || 'cons-1',
      academicYear: '2025-2026',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      priorityScore: Math.floor(Math.random() * 50) + 40,
      paymentStatus: 'UNPAID',
      ...applicationData
    } as ScholarshipApplication;
    setMockScholarshipApplications(prev => [...prev, newApplication]);

    void (async () => {
      try {
        const normalizedStatus =
          newApplication.status === 'DRAFT' || newApplication.status === 'DOCUMENTS_PENDING'
            ? 'SUBMITTED'
            : newApplication.status;
        const saved = await createScholarshipApplicationAction({
          id: newApplication.id,
          studentId: newApplication.studentId,
          studentName: newApplication.studentName,
          instrument: newApplication.instrument,
          conservatoriumId: newApplication.conservatoriumId,
          academicYear: newApplication.academicYear,
          status: normalizedStatus,
          submittedAt: newApplication.submittedAt,
          priorityScore: newApplication.priorityScore,
          approvedAt: newApplication.approvedAt,
          rejectedAt: newApplication.rejectedAt,
          paymentStatus: newApplication.paymentStatus,
          paidAt: newApplication.paidAt,
        });
        setMockScholarshipApplications(prev =>
          prev.map(app => (app.id === newApplication.id ? { ...app, ...saved } : app))
        );
      } catch {
        // Keep optimistic entry in memory even if persistence fails.
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, user]);

  // ---------------------------------------------------------------------------
  // updateScholarshipStatus
  // ---------------------------------------------------------------------------
  const updateScholarshipStatus = useCallback((applicationId: string, status: 'APPROVED' | 'REJECTED') => {
    const now = new Date().toISOString();
    setMockScholarshipApplications(prev => prev.map(app => {
      if (app.id !== applicationId) return app;
      return {
        ...app,
        status,
        approvedAt: status === 'APPROVED' ? now : app.approvedAt,
        rejectedAt: status === 'REJECTED' ? now : app.rejectedAt,
      };
    }));

    void (async () => {
      try {
        const result = await updateScholarshipStatusAction({ applicationId, status });
        if (result?.success && result.scholarship) {
          setMockScholarshipApplications(prev =>
            prev.map(app => (app.id === applicationId ? { ...app, ...result.scholarship } : app))
          );
        }
      } catch {
        // Keep optimistic state in memory if persistence fails.
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // markScholarshipAsPaid
  // ---------------------------------------------------------------------------
  const markScholarshipAsPaid = useCallback((applicationId: string) => {
    const now = new Date().toISOString();
    setMockScholarshipApplications(prev => prev.map(app => app.id === applicationId
      ? { ...app, paymentStatus: 'PAID', paidAt: now }
      : app));

    void (async () => {
      try {
        const result = await markScholarshipPaidAction(applicationId);
        if (result?.success && result.scholarship) {
          setMockScholarshipApplications(prev =>
            prev.map(app => (app.id === applicationId ? { ...app, ...result.scholarship } : app))
          );
        }
      } catch {
        // Keep optimistic state in memory if persistence fails.
      }
    })();
  }, []);

  // ---------------------------------------------------------------------------
  // addDonationCause
  // ---------------------------------------------------------------------------
  const addDonationCause = useCallback((cause: { names: { he: string; en: string }; descriptions: { he: string; en: string }; category: DonationCauseCategory; targetAmountILS?: number; }): DonationCause => {
    const newCause: DonationCause = {
      id: `cause-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      names: cause.names,
      descriptions: cause.descriptions,
      category: cause.category,
      priority: (mockDonationCauses.reduce((max, item) => Math.max(max, item.priority), 0) || 0) + 1,
      isActive: true,
      targetAmountILS: cause.targetAmountILS,
      raisedAmountILS: 0,
    };
    setMockDonationCauses(prev => [...prev, newCause]);

    void (async () => {
      try {
        const saved = await createDonationCauseAction({
          id: newCause.id,
          conservatoriumId: newCause.conservatoriumId,
          names: { ...newCause.names, ru: newCause.names.en, ar: newCause.names.en },
          descriptions: newCause.descriptions,
          category: newCause.category,
          priority: newCause.priority,
          isActive: newCause.isActive,
          targetAmountILS: newCause.targetAmountILS,
          raisedAmountILS: newCause.raisedAmountILS,
          imageUrl: newCause.imageUrl,
        });
        setMockDonationCauses(prev =>
          prev.map(item => (item.id === newCause.id ? { ...item, ...saved } : item))
        );
      } catch {
        // Keep optimistic entry in memory even if persistence fails.
      }
    })();

    return newCause;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mockDonationCauses]);

  // ---------------------------------------------------------------------------
  // recordDonation
  // ---------------------------------------------------------------------------
  const recordDonation = useCallback((donation: { causeId: string; amountILS: number; frequency: 'once' | 'monthly' | 'yearly'; donorName?: string; donorEmail?: string; donorId?: string; status?: DonationRecord['status']; }): DonationRecord => {
    const newDonation: DonationRecord = {
      id: `donation-${Date.now()}`,
      conservatoriumId: user?.conservatoriumId || 'cons-15',
      causeId: donation.causeId,
      amountILS: donation.amountILS,
      frequency: donation.frequency,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorId: donation.donorId,
      status: donation.status || 'INITIATED',
      createdAt: new Date().toISOString(),
    };

    setMockDonations(prev => [...prev, newDonation]);
    setMockDonationCauses(prev => prev.map(cause => cause.id === donation.causeId
      ? { ...cause, raisedAmountILS: cause.raisedAmountILS + donation.amountILS }
      : cause));

    void (async () => {
      try {
        const saved = await recordDonationAction({
          id: newDonation.id,
          conservatoriumId: newDonation.conservatoriumId,
          causeId: newDonation.causeId,
          amountILS: newDonation.amountILS,
          frequency: newDonation.frequency,
          donorName: newDonation.donorName,
          donorEmail: newDonation.donorEmail,
          donorId: newDonation.donorId,
          status: newDonation.status,
          createdAt: newDonation.createdAt,
        });
        setMockDonations(prev =>
          prev.map(item => (item.id === newDonation.id ? { ...item, ...saved } : item))
        );
      } catch {
        // Keep optimistic state in memory if persistence fails.
      }
    })();

    return newDonation;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      conservatoriums,
      setConservatoriums,
      conservatoriumInstruments,
      setConservatoriumInstruments,
      lessonPackages,
      setLessonPackages,
      mockBranches,
      branches: mockBranches,
      setMockBranches,
      mockRooms,
      rooms: mockRooms,
      setMockRooms,
      mockWaitlist,
      waitlist: mockWaitlist,
      setMockWaitlist,
      mockPayrolls,
      payrolls: mockPayrolls,
      setMockPayrolls,
      mockPackages,
      packages: mockPackages,
      setMockPackages,
      mockInvoices,
      invoices: mockInvoices,
      setMockInvoices,
      mockPlayingSchoolInvoices,
      playingSchoolInvoices: mockPlayingSchoolInvoices,
      setMockPlayingSchoolInvoices,
      mockScholarshipApplications,
      scholarshipApplications: mockScholarshipApplications,
      setMockScholarshipApplications,
      mockDonationCauses,
      donationCauses: mockDonationCauses,
      setMockDonationCauses,
      mockDonations,
      donations: mockDonations,
      setMockDonations,
      updateConservatorium,
      addBranch,
      updateBranch,
      addConservatoriumInstrument,
      updateConservatoriumInstrument,
      deleteConservatoriumInstrument,
      addLessonPackage,
      updateLessonPackage,
      deleteLessonPackage,
      addRoom,
      updateRoom,
      deleteRoom,
      addToWaitlist,
      updateWaitlistStatus,
      offerSlotToWaitlisted,
      acceptWaitlistOffer,
      declineWaitlistOffer,
      expireWaitlistOffers,
      revokeWaitlistOffer,
      updatePayrollStatus,
      addScholarshipApplication,
      updateScholarshipStatus,
      markScholarshipAsPaid,
      addDonationCause,
      recordDonation,
    }),
    [
      conservatoriums,
      conservatoriumInstruments,
      lessonPackages,
      mockBranches,
      mockRooms,
      mockWaitlist,
      mockPayrolls,
      mockPackages,
      mockInvoices,
      mockPlayingSchoolInvoices,
      mockScholarshipApplications,
      mockDonationCauses,
      mockDonations,
      updateConservatorium,
      addBranch,
      updateBranch,
      addConservatoriumInstrument,
      updateConservatoriumInstrument,
      deleteConservatoriumInstrument,
      addLessonPackage,
      updateLessonPackage,
      deleteLessonPackage,
      addRoom,
      updateRoom,
      deleteRoom,
      addToWaitlist,
      updateWaitlistStatus,
      offerSlotToWaitlisted,
      acceptWaitlistOffer,
      declineWaitlistOffer,
      expireWaitlistOffers,
      revokeWaitlistOffer,
      updatePayrollStatus,
      addScholarshipApplication,
      updateScholarshipStatus,
      markScholarshipAsPaid,
      addDonationCause,
      recordDonation,
    ],
  );

  return <AdminDomainContext.Provider value={value}>{children}</AdminDomainContext.Provider>;
}
