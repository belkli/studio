# FirebaseAdapter Implementation Plan

> **Author:** @Backend | **Date:** 2026-03-06

---

## 1. Current State

`src/lib/db/adapters/firebase.ts` (7 lines):

```typescript
import { buildDefaultSeed, MemoryDatabaseAdapter } from './shared';

export class FirebaseAdapter extends MemoryDatabaseAdapter {
  constructor() {
    super(buildDefaultSeed());
  }
}
```

This is a **complete stub** -- it extends `MemoryDatabaseAdapter` and populates itself with seed data on every instantiation. No Firestore SDK calls are made.

---

## 2. Target Architecture

Replace the stub with a real Firestore-backed adapter that implements all 18 repositories in the `DatabaseAdapter` interface (defined in `src/lib/db/types.ts`).

### Firestore SDK imports needed:

```typescript
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  runTransaction,
  Timestamp,
  FieldValue,
  type DocumentReference,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';
```

Alternatively, for server-side (Admin SDK):

```typescript
import { getFirestore } from 'firebase-admin/firestore';
```

**Decision:** Since all DB access happens in Server Actions (`'use server'`), we should use the **Firebase Admin SDK** for Firestore access. This avoids Security Rules overhead on server-side calls and gives full admin access within the trusted server environment.

---

## 3. Firestore Collection Mapping

Each repository maps to a Firestore collection. Multi-tenant isolation uses `conservatoriums/{cid}/` subcollections.

| Repository | Firestore Collection Path | Notes |
|------------|--------------------------|-------|
| `users` | `/users/{userId}` | Top-level; has `conservatoriumId` field for filtering |
| `conservatoriums` | `/conservatoriums/{cid}` | Top-level; tenant root |
| `conservatoriumInstruments` | `/conservatoriums/{cid}/instruments/{id}` | Subcollection |
| `lessonPackages` | `/conservatoriums/{cid}/packages/{id}` | Subcollection |
| `lessons` | `/conservatoriums/{cid}/lessonSlots/{id}` | Subcollection |
| `branches` | `/conservatoriums/{cid}/branches/{id}` | Subcollection |
| `rooms` | `/conservatoriums/{cid}/rooms/{id}` | Subcollection |
| `events` | `/conservatoriums/{cid}/events/{id}` | Subcollection |
| `forms` | `/conservatoriums/{cid}/formSubmissions/{id}` | Subcollection |
| `approvals` | Same as `forms` with status filter | Shared collection; `findPending` uses `where('status', 'in', [...])` |
| `scholarships` | `/conservatoriums/{cid}/scholarships/{id}` | Subcollection |
| `rentals` | `/conservatoriums/{cid}/rentals/{id}` | Subcollection |
| `payments` | `/conservatoriums/{cid}/invoices/{id}` | Subcollection |
| `payrolls` | `/conservatoriums/{cid}/payrolls/{id}` | Subcollection |
| `announcements` | `/conservatoriums/{cid}/announcements/{id}` | Subcollection |
| `alumni` | `/conservatoriums/{cid}/alumni/{id}` | Subcollection |
| `masterClasses` | `/conservatoriums/{cid}/masterClasses/{id}` | Subcollection |
| `repertoire` | `/repertoire/{id}` | Top-level; shared across conservatoriums |
| `donationCauses` | `/conservatoriums/{cid}/donationCauses/{id}` | Subcollection |
| `donations` | `/conservatoriums/{cid}/donations/{id}` | Subcollection |

### Missing collections to add:

| New Collection | Path | Purpose | Security Rule |
|----------------|------|---------|---------------|
| `makeupCredits` | `/conservatoriums/{cid}/makeupCredits/{id}` | Makeup credit tracking | `allow write: if false` (Cloud Functions only) |
| `practiceLogs` | `/conservatoriums/{cid}/practiceLogs/{id}` | Student practice journals | Student/parent create; teacher comment-only update |
| `notifications` | `/conservatoriums/{cid}/notifications/{id}` | In-app notifications | User reads own; Cloud Functions create; user can mark `read` only |
| `roomLocks` | `/conservatoriums/{cid}/roomLocks/{lockKey}` | Transient room booking locks | `allow write: if false` (transactional Cloud Functions only) |
| `teacherExceptions` | `/conservatoriums/{cid}/teacherExceptions/{id}` | Teacher availability overrides | Teacher creates own; admin updates |
| `consentRecords` | `/consentRecords/{id}` (**TOP-LEVEL**) | PDPPA consent audit | User/parent creates; immutable after creation (`allow update, delete: if false`) |
| `complianceLogs` | `/conservatoriums/{cid}/complianceLogs/{id}` | System compliance audit | Admin read; `allow write: if false` (append-only Cloud Functions) |

**Note:** `consentRecords` is intentionally top-level (not per-conservatorium) because consent applies to the user globally, not to a specific conservatorium. All other new collections are per-conservatorium subcollections.

---

## 4. Implementation Pattern per Repository

### 4.1 Generic Firestore Repository Factory

```typescript
function createFirestoreRepository<T extends { id: string }>(
  collectionPath: string,
  conservatoriumIdField: string = 'conservatoriumId'
): ScopedRepository<T> {
  const db = getFirestore();

  return {
    async findById(id: string): Promise<T | null> {
      const docRef = doc(db, collectionPath, id);
      const snap = await getDoc(docRef);
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
    },

    async findByConservatorium(conservatoriumId: string): Promise<T[]> {
      const q = query(
        collection(db, collectionPath),
        where(conservatoriumIdField, '==', conservatoriumId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    },

    async list(): Promise<T[]> {
      const snap = await getDocs(collection(db, collectionPath));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
    },

    async create(data: Partial<T>): Promise<T> {
      const colRef = collection(db, collectionPath);
      const docRef = data.id ? doc(colRef, data.id) : doc(colRef);
      const record = { ...data, id: docRef.id };
      await setDoc(docRef, record);
      return record as T;
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const docRef = doc(db, collectionPath, id);
      await updateDoc(docRef, data as Record<string, unknown>);
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() } as T;
    },

    async delete(id: string): Promise<void> {
      await deleteDoc(doc(db, collectionPath, id));
    },
  };
}
```

### 4.2 Subcollection Pattern (Tenant-Scoped)

For subcollections under `/conservatoriums/{cid}/`, the repository needs to resolve the collection path dynamically. Two approaches:

**Option A: Statically scoped per adapter instance**
```typescript
// Each tenant gets its own adapter instance
const adapter = new FirebaseAdapter(conservatoriumId);
```

**Option B: Dynamic path resolution**
```typescript
// findByConservatorium queries the specific subcollection
async findByConservatorium(conservatoriumId: string): Promise<T[]> {
  const colRef = collection(db, `conservatoriums/${conservatoriumId}/lessonSlots`);
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
}
```

**Recommendation:** Option B -- dynamic resolution. This keeps a single adapter instance shared across the server and matches how the current `MemoryDatabaseAdapter` filters by `conservatoriumId`.

### 4.3 UserRepository (Special -- Top-Level Collection)

```typescript
async findByEmail(email: string): Promise<User | null> {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email),
    limit(1)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as User);
}

async search(queryStr: string, conservatoriumId?: string): Promise<User[]> {
  // Firestore doesn't support LIKE queries
  // Option 1: Client-side filter (acceptable for small datasets)
  // Option 2: Algolia/Typesense for full-text search
  // Option 3: Use array-contains with name tokens
  const constraints = [];
  if (conservatoriumId) {
    constraints.push(where('conservatoriumId', '==', conservatoriumId));
  }
  const q = query(collection(db, 'users'), ...constraints);
  const snap = await getDocs(q);
  const normalized = queryStr.trim().toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as User))
    .filter(u => u.name.toLowerCase().includes(normalized) || u.email.toLowerCase().includes(normalized));
}
```

### 4.4 ApprovalRepository (Special -- Status Filter)

```typescript
async findPending(conservatoriumId?: string): Promise<FormSubmission[]> {
  const pendingStatuses = ['PENDING', 'PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED'];
  const colRef = conservatoriumId
    ? collection(db, `conservatoriums/${conservatoriumId}/formSubmissions`)
    : collection(db, 'formSubmissions'); // fallback if no cid
  const q = query(colRef, where('status', 'in', pendingStatuses));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as FormSubmission));
}
```

---

## 5. Batch Write Strategy

Firestore batch writes are limited to 500 operations per batch.

**Use cases for batch writes:**
- `generateYearlySlots`: Up to 1,600 lesson slots (4 batches)
- `expireMakeupCredits`: Batch update expired credits
- Seed data population

**Pattern:**
```typescript
async function batchWrite<T>(
  collectionPath: string,
  items: T[],
  batchSize: number = 400
): Promise<void> {
  const db = getFirestore();
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = items.slice(i, i + batchSize);
    for (const item of chunk) {
      const docRef = doc(collection(db, collectionPath));
      batch.set(docRef, item);
    }
    await batch.commit();
  }
}
```

---

## 6. Transaction Strategy

**Use cases for transactions:**
- `bookLessonSlot`: 5 reads + 3 writes (most complex)
- `bookMakeupLesson`: 3 reads + 2 writes
- `recordDonationAction`: Read cause + update raised amount + create donation
- `registerToMasterClassAction`: Read masterclass + check capacity + update registrations

**Pattern:**
```typescript
async function bookLessonSlot(input: BookingRequest): Promise<string> {
  const db = getFirestore();
  return runTransaction(db, async (tx) => {
    // 1. Check teacher conflicts
    const conflictsQuery = query(
      collection(db, `conservatoriums/${input.conservatoriumId}/lessonSlots`),
      where('teacherId', '==', input.teacherId),
      where('startTime', '>=', input.startTime),
      where('status', '==', 'SCHEDULED')
    );
    // Note: Firestore transactions require all reads before writes
    const conflicts = await tx.get(conflictsQuery);
    if (!conflicts.empty) throw new Error('TEACHER_CONFLICT');

    // 2. Room lock (if roomId provided)
    // 3. Package credit deduction
    // 4. Create slot
    // 5. Update stats
  });
}
```

---

## 7. Migration Strategy

### Phase 1: Read-only Firestore (with fallback)
- Implement `findById`, `list`, `findByConservatorium` with real Firestore reads
- Keep `MemoryDatabaseAdapter` as fallback when `FIRESTORE_PROJECT_ID` is unset
- Toggle via `DB_BACKEND` env var (already supported in `src/lib/db/index.ts`)

### Phase 2: Write operations
- Implement `create`, `update`, `delete` with real Firestore writes
- Add `conservatoriumId` enforcement on every write
- Add Firestore Security Rules validation

### Phase 3: Transaction operations
- Implement booking transactions as Cloud Functions
- Server Actions call Cloud Functions instead of direct Firestore writes for transactional operations

---

## 8. Performance Considerations

1. **Caching:** Use Firestore's built-in offline persistence for reads, or implement server-side LRU cache for frequently accessed entities (conservatorium config, user profiles).

2. **Pagination:** The current `list()` method returns all documents. For production, add `limit(100)` + cursor pagination using `startAfter()`.

3. **Indexes:** Composite indexes are required for queries with multiple `where` clauses + `orderBy`. These must be defined in `firestore.indexes.json` (@DBA deliverable).

4. **Read amplification:** The `findByConservatorium` pattern reads an entire subcollection. For large conservatoriums (100+ students), consider:
   - Paginated queries
   - Collection group queries for cross-tenant admin views
   - Denormalized summary documents (e.g., `conservatoriumStats/live`)

---

## 9. Dependencies

| Dependency | From | Status |
|------------|------|--------|
| Firestore collection schema | @DBA | Done — `docs/production-plan/DBA-schema-report.md` |
| Firestore Security Rules | @DBA | Done — `firestore.rules` (585 lines) |
| Firestore composite indexes | @DBA | Done — `firestore.indexes.json` (17 indexes) |
| Firebase Admin SDK initialization | @Security | Done — `src/lib/firebase-admin.ts` |
| `DB_BACKEND` env var set to `firebase` | @Infrastructure | Done — `apphosting.yaml` |
| 7 missing repository interfaces | @Backend | Done — `src/lib/db/types.ts` (25 repositories total) |
| FirebaseAdapter updated with 7 new repos | @DBA | Done — `src/lib/db/adapters/firebase.ts` |

---

*End of FirebaseAdapter Implementation Plan*
