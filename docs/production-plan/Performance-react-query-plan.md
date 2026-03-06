# Performance: React Query Migration Plan

## 1. Installation

Added to `package.json`:
- `@tanstack/react-query` ^5.90.21 (dependencies)
- `@tanstack/react-query-devtools` ^5.91.3 (devDependencies)

## 2. Provider Setup

Create `src/providers/query-provider.tsx`:
```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,       // 1 minute default stale time
        gcTime: 5 * 60 * 1000,       // 5 minute garbage collection
        refetchOnWindowFocus: false,  // Disable aggressive refetch
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Wire in `src/app/[locale]/layout.tsx` wrapping `<AuthProvider>` (or replacing it progressively).

---

## 3. Query Key Factory

```typescript
// src/lib/query-keys.ts

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
    user: (userId: string) => [...queryKeys.auth.all, 'user', userId] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    list: (conservatoriumId: string) => [...queryKeys.users.all, 'list', conservatoriumId] as const,
    detail: (userId: string) => [...queryKeys.users.all, 'detail', userId] as const,
    pending: (conservatoriumId: string) => [...queryKeys.users.all, 'pending', conservatoriumId] as const,
  },

  // Lessons
  lessons: {
    all: ['lessons'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.lessons.all, 'list', filters] as const,
    byTeacher: (teacherId: string) => [...queryKeys.lessons.all, 'teacher', teacherId] as const,
    byStudent: (studentId: string) => [...queryKeys.lessons.all, 'student', studentId] as const,
    byConservatorium: (cid: string) => [...queryKeys.lessons.all, 'conservatorium', cid] as const,
    detail: (lessonId: string) => [...queryKeys.lessons.all, 'detail', lessonId] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    byPayer: (payerId: string) => [...queryKeys.invoices.all, 'payer', payerId] as const,
    byConservatorium: (cid: string) => [...queryKeys.invoices.all, 'conservatorium', cid] as const,
  },

  // Forms
  forms: {
    all: ['forms'] as const,
    list: (conservatoriumId: string) => [...queryKeys.forms.all, 'list', conservatoriumId] as const,
    detail: (formId: string) => [...queryKeys.forms.all, 'detail', formId] as const,
    templates: (conservatoriumId: string) => [...queryKeys.forms.all, 'templates', conservatoriumId] as const,
  },

  // Practice
  practice: {
    all: ['practice'] as const,
    logs: (studentId: string) => [...queryKeys.practice.all, 'logs', studentId] as const,
    repertoire: (studentId: string) => [...queryKeys.practice.all, 'repertoire', studentId] as const,
    videos: (studentId: string) => [...queryKeys.practice.all, 'videos', studentId] as const,
  },

  // Events
  events: {
    all: ['events'] as const,
    list: (conservatoriumId: string) => [...queryKeys.events.all, 'list', conservatoriumId] as const,
    detail: (eventId: string) => [...queryKeys.events.all, 'detail', eventId] as const,
    bookings: (conservatoriumId: string) => [...queryKeys.events.all, 'bookings', conservatoriumId] as const,
  },

  // Instruments
  instruments: {
    all: ['instruments'] as const,
    inventory: (conservatoriumId: string) => [...queryKeys.instruments.all, 'inventory', conservatoriumId] as const,
    rentals: (conservatoriumId: string) => [...queryKeys.instruments.all, 'rentals', conservatoriumId] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    threads: (userId: string) => [...queryKeys.messages.all, 'threads', userId] as const,
    thread: (threadId: string) => [...queryKeys.messages.all, 'thread', threadId] as const,
  },

  // Config
  config: {
    all: ['config'] as const,
    conservatorium: (cid: string) => [...queryKeys.config.all, 'conservatorium', cid] as const,
    branches: (cid: string) => [...queryKeys.config.all, 'branches', cid] as const,
    rooms: (cid: string) => [...queryKeys.config.all, 'rooms', cid] as const,
    packages: (cid: string) => [...queryKeys.config.all, 'packages', cid] as const,
  },

  // Stats
  stats: {
    all: ['stats'] as const,
    live: (conservatoriumId: string) => [...queryKeys.stats.all, 'live', conservatoriumId] as const,
  },

  // Scholarships & Donations
  scholarships: {
    all: ['scholarships'] as const,
    list: (conservatoriumId: string) => [...queryKeys.scholarships.all, 'list', conservatoriumId] as const,
  },
  donations: {
    all: ['donations'] as const,
    causes: (conservatoriumId: string) => [...queryKeys.donations.all, 'causes', conservatoriumId] as const,
  },

  // Alumni & Master Classes
  alumni: {
    all: ['alumni'] as const,
    list: (conservatoriumId: string) => [...queryKeys.alumni.all, 'list', conservatoriumId] as const,
    masterClasses: (conservatoriumId: string) => [...queryKeys.alumni.all, 'masterClasses', conservatoriumId] as const,
  },

  // Payroll
  payroll: {
    all: ['payroll'] as const,
    list: (conservatoriumId: string) => [...queryKeys.payroll.all, 'list', conservatoriumId] as const,
  },
} as const;
```

---

## 4. Migration Priority (by render impact)

### Phase 1: Auth + Users (HIGHEST IMPACT)
**Goal:** Isolate auth session from all data queries.

1. `useAuthSession()` - Pure auth hook (user, login, logout)
2. `useUsers(conservatoriumId)` - Query for user list, used by admin pages

**Stale time:** Auth session: `Infinity` (only changes on login/logout). Users list: 30s.

### Phase 2: Lessons + Live Stats (HIGH FREQUENCY)
**Goal:** Eliminate the most frequent mutation-driven re-renders.

3. `useLessons(filters)` - Replaces `useMyLessons` wrapper
4. `useLiveStats(conservatoriumId)` - Replaces direct stats computation

**Stale time:** Lessons: 15s (frequently changing). Stats: 30s.

### Phase 3: Forms + Invoices (ADMIN-HEAVY)
**Goal:** Admin dashboard no longer re-renders for student data changes.

5. `useForms(conservatoriumId)` - Form submissions
6. `useInvoices(filters)` - Billing data

**Stale time:** Forms: 60s. Invoices: 60s.

### Phase 4: Practice + Messages (STUDENT/TEACHER)
**Goal:** Student/teacher pages isolated from admin mutations.

7. `usePracticeLogs(studentId)` - Practice data
8. `useMessageThreads(userId)` - Messaging data

**Stale time:** Practice: 60s. Messages: 15s.

### Phase 5: Remaining Domains (LOW FREQUENCY)
9. Events, Instruments, Scholarships, Alumni, Config, OpenDay, Payroll

**Stale time:** 2-5 minutes (low mutation frequency).

---

## 5. Stale-While-Revalidate Strategy

| Domain | staleTime | gcTime | refetchOnFocus | Rationale |
|--------|-----------|--------|----------------|-----------|
| Auth Session | Infinity | Infinity | false | Only changes on explicit login/logout |
| Lessons | 15s | 5min | true | Real-time schedule awareness |
| Users | 30s | 5min | false | Approval flow needs recency |
| Forms | 60s | 5min | false | Compliance workflows are less time-sensitive |
| Invoices | 60s | 10min | false | Financial data rarely changes within a session |
| Practice Logs | 60s | 5min | false | Student-local, infrequent mutations |
| Messages | 15s | 5min | true | Conversational flow needs freshness |
| Events | 2min | 10min | false | Events change slowly |
| Config | 5min | 30min | false | Admin-only, rarely changes |
| Stats | 30s | 5min | true | Dashboard accuracy |

---

## 6. Optimistic Updates for Booking/Cancellation

### Lesson Booking (Critical Path)
```typescript
useMutation({
  mutationFn: (lessonData: Partial<LessonSlot>) => upsertLessonAction(lessonData),
  onMutate: async (newLesson) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: queryKeys.lessons.all });

    // Snapshot previous value
    const previousLessons = queryClient.getQueryData(queryKeys.lessons.byTeacher(teacherId));

    // Optimistically update
    queryClient.setQueryData(queryKeys.lessons.byTeacher(teacherId), (old) => [...old, optimisticLesson]);

    return { previousLessons };
  },
  onError: (err, newLesson, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKeys.lessons.byTeacher(teacherId), context.previousLessons);
    toast({ variant: 'destructive', title: 'Booking failed' });
  },
  onSettled: () => {
    // Always refetch after mutation
    queryClient.invalidateQueries({ queryKey: queryKeys.lessons.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
  },
});
```

### Lesson Cancellation (with makeup credit)
```typescript
useMutation({
  mutationFn: ({ lessonId, withNotice }) => cancelLessonAction(lessonId, withNotice),
  onMutate: async ({ lessonId, withNotice }) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.lessons.all });

    const status = withNotice ? 'CANCELLED_STUDENT_NOTICED' : 'CANCELLED_STUDENT_NO_NOTICE';

    // Optimistic lesson status update
    queryClient.setQueryData(queryKeys.lessons.byStudent(studentId), (old) =>
      old.map(l => l.id === lessonId ? { ...l, status } : l)
    );

    return { /* snapshot */ };
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.lessons.all });
    // Invalidate makeup credits since cancellation may grant a credit
    queryClient.invalidateQueries({ queryKey: ['makeupCredits'] });
  },
});
```

---

## 7. Firestore onSnapshot Integration Plan

When the FirebaseAdapter is implemented, each domain hook will integrate real-time Firestore listeners:

### Architecture: React Query + onSnapshot

```typescript
// Example: useLessons with onSnapshot
function useLessons(conservatoriumId: string) {
  return useQuery({
    queryKey: queryKeys.lessons.byConservatorium(conservatoriumId),
    queryFn: async () => {
      // Initial fetch from Firestore
      const snapshot = await getDocs(
        query(
          collection(db, 'conservatoriums', conservatoriumId, 'lessonSlots'),
          where('status', 'in', ['SCHEDULED', 'COMPLETED']),
          orderBy('startTime', 'desc'),
          limit(200)
        )
      );
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: Infinity, // onSnapshot keeps it fresh
  });
}

// Separate effect to wire up real-time listener
function useLessonsRealtime(conservatoriumId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'conservatoriums', conservatoriumId, 'lessonSlots'),
        where('status', 'in', ['SCHEDULED', 'COMPLETED'])
      ),
      (snapshot) => {
        const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        queryClient.setQueryData(
          queryKeys.lessons.byConservatorium(conservatoriumId),
          lessons
        );
      }
    );

    return () => unsubscribe();
  }, [conservatoriumId, queryClient]);
}
```

### onSnapshot Priority (by real-time need):
1. **Lessons** - Teachers/students need live booking visibility
2. **Messages** - Chat needs real-time delivery
3. **Announcements** - Push to all users
4. **Stats** - Admin dashboard KPIs
5. **Forms** - Approval flow notifications
6. Everything else - polling via React Query staleTime is sufficient

### Firestore Read Budget
Target: 5 reads per session (from performance targets in 06-security.md section 9).
- Use `onSnapshot` listeners instead of repeated `getDocs` calls
- Listeners count as 1 read for the initial snapshot + 1 read per document change
- Limit collection queries with `limit(200)` and date range filters

---

## 8. Migration Path (Non-Breaking)

### Step 1: Install and Add Provider
- Add `QueryProvider` to root layout alongside existing `AuthProvider`
- No behavior change yet

### Step 2: Create New Hooks (Parallel Track)
- Create React Query-based hooks (e.g., `useLessonsQuery`) alongside existing `useMyLessons`
- New hooks read from the bootstrap API / server actions
- Gradually migrate component by component

### Step 3: Progressive Component Migration
- Start with leaf components (e.g., `KeyMetricsBar`, `TodaySnapshotCard`)
- Move to page-level components (e.g., `AdminCommandCenter`)
- Each migration: replace `useAuth()` destructuring with domain-specific query hooks

### Step 4: Remove State from AuthProvider
- As each domain migrates, remove the corresponding `useState` from `use-auth.tsx`
- Eventually, `AuthProvider` becomes a thin auth-only wrapper

### Step 5: Wire Firestore Listeners
- Once `FirebaseAdapter` is implemented, swap query functions from bootstrap API to direct Firestore reads
- Add `onSnapshot` effects for real-time domains
