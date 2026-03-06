# Firebase Custom Claims Cloud Function Spec

## Overview

Firebase Custom Claims are the authoritative source of role and tenant information for every authenticated user. They are embedded in the Firebase ID token and session cookie, enabling both client-side UI rendering and server-side authorization without additional database lookups.

## Claims Payload

```typescript
interface HarmoniaCustomClaims {
  role: UserRole;            // 'student' | 'teacher' | 'parent' | 'conservatorium_admin' | ...
  conservatoriumId: string;  // The tenant ID the user belongs to
  approved: boolean;         // Whether the user has been approved by an admin
}
```

## Cloud Function: `onUserApproved`

### Trigger

Firestore `onDocumentUpdated` trigger on `users/{userId}`.

### Implementation

```typescript
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';

export const onUserApproved = onDocumentUpdated(
  'users/{userId}',
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const userId = event.params.userId;

    if (!before || !after) return;

    // Detect changes that require claims update
    const claimsChanged =
      before.approved !== after.approved ||
      before.role !== after.role ||
      before.conservatoriumId !== after.conservatoriumId;

    if (!claimsChanged) return;

    const newClaims: HarmoniaCustomClaims = {
      role: after.role,
      conservatoriumId: after.conservatoriumId,
      approved: after.approved === true,
    };

    await getAuth().setCustomUserClaims(userId, newClaims);

    // Write a marker so the client knows to refresh its token
    await event.data?.after?.ref.update({
      _claimsUpdatedAt: new Date().toISOString(),
    });

    console.log(`[onUserApproved] Updated claims for ${userId}:`, newClaims);
  }
);
```

### When Claims Are Updated

| Event | Action |
|-------|--------|
| Admin approves a new user | Set `approved: true` in claims |
| Admin changes user role | Update `role` in claims |
| User moved to different conservatorium | Update `conservatoriumId` in claims |
| Admin revokes access | Set `approved: false` in claims |

### Cloud Function: `onUserCreated` (Initial Claims)

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';

export const onUserCreated = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const data = event.data?.data();
    const userId = event.params.userId;
    if (!data) return;

    const initialClaims: HarmoniaCustomClaims = {
      role: data.role || 'student',
      conservatoriumId: data.conservatoriumId || '',
      approved: false, // All new users start unapproved
    };

    await getAuth().setCustomUserClaims(userId, initialClaims);
    console.log(`[onUserCreated] Set initial claims for ${userId}:`, initialClaims);
  }
);
```

## Client-Side Token Refresh Pattern

After claims are updated (e.g., admin approves the user), the client must force-refresh the ID token to pick up the new claims. This is done by polling the `_claimsUpdatedAt` field.

### Implementation in `use-auth.tsx`

```typescript
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// Inside the AuthProvider component:

useEffect(() => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  // Listen for claims update marker
  const unsubscribe = onSnapshot(
    doc(firestore, 'users', currentUser.uid),
    async (snapshot) => {
      const data = snapshot.data();
      if (!data?._claimsUpdatedAt) return;

      // Force refresh the ID token to get updated claims
      const newToken = await currentUser.getIdToken(true);

      // Re-create session cookie with new claims
      await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: newToken }),
      });

      // Update local state
      const tokenResult = await currentUser.getIdTokenResult();
      const claims = tokenResult.claims;
      // Update user state with new role/approval status...
    }
  );

  return () => unsubscribe();
}, [currentUser]);
```

### `/api/auth/refresh` Route Handler

```typescript
// src/app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth-utils';

export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
  }

  try {
    const sessionCookie = await createSessionCookie(idToken);

    const response = NextResponse.json({ ok: true });
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    return response;
  } catch (error) {
    console.error('[/api/auth/refresh] Failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

## Login Flow (Session Cookie Creation)

### `/api/auth/login` Route Handler

```typescript
// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth-utils';

export async function POST(request: Request) {
  const { idToken } = await request.json();

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
  }

  try {
    const sessionCookie = await createSessionCookie(idToken);

    const response = NextResponse.json({ ok: true });
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    // Clear the legacy cookie
    response.cookies.delete('harmonia-user');

    return response;
  } catch (error) {
    console.error('[/api/auth/login] Failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

### Client-Side Login Update

The `login()` function in `use-auth.tsx` must be updated to:

1. Call `signInWithEmailAndPassword(auth, email, password)` instead of array lookup
2. Get the ID token: `const idToken = await user.getIdToken()`
3. Send to `/api/auth/login`: `await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ idToken }) })`
4. Remove `setAuthCookie()` / `document.cookie = 'harmonia-user=1'` usage

## Logout Flow

### `/api/auth/logout` Route Handler

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { revokeSession, verifyAuth } from '@/lib/auth-utils';

export async function POST() {
  try {
    const claims = await verifyAuth();
    await revokeSession(claims.uid);
  } catch {
    // User may already be logged out
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('__session');
  response.cookies.delete('harmonia-user');
  return response;
}
```

## Cloud Function: `onUserUpdated_syncParentOf`

### Purpose

Maintains the denormalized `/parentOf/{parentId}_{studentId}` collection used by Firestore Security Rules for O(1) parent-child access checks (`isParentOfStudent()`). Without these documents, parents lose access to their children's lesson slots, invoices, practice logs, and form submissions.

### Trigger

Firestore `onDocumentUpdated` trigger on `users/{userId}`.

### Document Shape: `/parentOf/{parentId}_{studentId}`

```typescript
{
  parentId: string;
  studentId: string;
  conservatoriumId: string; // from the student's user doc
  createdAt: string;        // ISO Timestamp
}
```

### Implementation

```typescript
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

export const onUserUpdated_syncParentOf = onDocumentUpdated(
  'users/{userId}',
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const userId = event.params.userId;

    if (!before || !after) return;

    const batch = db.batch();
    let hasChanges = false;

    // ── Case 1: Student document — parentId changed ──
    const oldParentId = before.parentId || null;
    const newParentId = after.parentId || null;

    if (oldParentId !== newParentId) {
      // Delete old mapping
      if (oldParentId) {
        const oldDocRef = db.doc(`parentOf/${oldParentId}_${userId}`);
        batch.delete(oldDocRef);
        hasChanges = true;
      }

      // Create new mapping
      if (newParentId) {
        const newDocRef = db.doc(`parentOf/${newParentId}_${userId}`);
        batch.set(newDocRef, {
          parentId: newParentId,
          studentId: userId,
          conservatoriumId: after.conservatoriumId || '',
          createdAt: new Date().toISOString(),
        });
        hasChanges = true;
      }
    }

    // ── Case 2: Parent document — childIds changed ──
    const oldChildIds: string[] = before.childIds || [];
    const newChildIds: string[] = after.childIds || [];

    const removedChildren = oldChildIds.filter((id) => !newChildIds.includes(id));
    const addedChildren = newChildIds.filter((id) => !oldChildIds.includes(id));

    for (const childId of removedChildren) {
      const docRef = db.doc(`parentOf/${userId}_${childId}`);
      batch.delete(docRef);
      hasChanges = true;
    }

    for (const childId of addedChildren) {
      // Fetch the child's user doc to get their conservatoriumId
      const childDoc = await db.doc(`users/${childId}`).get();
      const childData = childDoc.data();

      const docRef = db.doc(`parentOf/${userId}_${childId}`);
      batch.set(docRef, {
        parentId: userId,
        studentId: childId,
        conservatoriumId: childData?.conservatoriumId || after.conservatoriumId || '',
        createdAt: new Date().toISOString(),
      });
      hasChanges = true;
    }

    // ── Case 3: Student's conservatoriumId changed — update existing parentOf docs ──
    if (before.conservatoriumId !== after.conservatoriumId && newParentId) {
      const docRef = db.doc(`parentOf/${newParentId}_${userId}`);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        batch.update(docRef, { conservatoriumId: after.conservatoriumId });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      await batch.commit();
      console.log(`[syncParentOf] Updated parentOf mappings for user ${userId}`);
    }
  }
);
```

### Idempotency

- `batch.set()` with full document is idempotent — re-running creates the same result
- `batch.delete()` on non-existent documents is a no-op in Firestore
- The function handles both directions: student doc changes (parentId) and parent doc changes (childIds)
- If the function is triggered twice for the same change, the second run produces no net effect

### Cloud Function: `onUserCreated_syncParentOf`

Initial parentOf creation when a new user document is created with `parentId` or `childIds` already set (e.g., admin creates a student record with a parent linked).

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const onUserCreated_syncParentOf = onDocumentCreated(
  'users/{userId}',
  async (event) => {
    const data = event.data?.data();
    const userId = event.params.userId;
    if (!data) return;

    const batch = db.batch();
    let hasChanges = false;

    // If this is a student with a parentId
    if (data.parentId) {
      const docRef = db.doc(`parentOf/${data.parentId}_${userId}`);
      batch.set(docRef, {
        parentId: data.parentId,
        studentId: userId,
        conservatoriumId: data.conservatoriumId || '',
        createdAt: new Date().toISOString(),
      });
      hasChanges = true;
    }

    // If this is a parent with childIds
    const childIds: string[] = data.childIds || [];
    for (const childId of childIds) {
      const childDoc = await db.doc(`users/${childId}`).get();
      const childData = childDoc.data();

      const docRef = db.doc(`parentOf/${userId}_${childId}`);
      batch.set(docRef, {
        parentId: userId,
        studentId: childId,
        conservatoriumId: childData?.conservatoriumId || data.conservatoriumId || '',
        createdAt: new Date().toISOString(),
      });
      hasChanges = true;
    }

    if (hasChanges) {
      await batch.commit();
      console.log(`[syncParentOf] Created initial parentOf mappings for user ${userId}`);
    }
  }
);
```

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Admin creates student with parentId pre-set | `onUserCreated_syncParentOf` creates the mapping |
| Admin reassigns student to different parent | `onUserUpdated_syncParentOf` deletes old, creates new |
| Parent adds a child via childIds | `onUserUpdated_syncParentOf` creates mapping, fetches child's conservatoriumId |
| Student moves to different conservatorium | `onUserUpdated_syncParentOf` updates conservatoriumId on existing parentOf doc |
| User document deleted | Requires separate `onUserDeleted` trigger to clean up all parentOf docs (see below) |

### Cloud Function: `onUserDeleted_cleanupParentOf`

```typescript
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

export const onUserDeleted_cleanupParentOf = onDocumentDeleted(
  'users/{userId}',
  async (event) => {
    const data = event.data?.data();
    const userId = event.params.userId;
    if (!data) return;

    const batch = db.batch();

    // If deleted user was a student with a parent
    if (data.parentId) {
      batch.delete(db.doc(`parentOf/${data.parentId}_${userId}`));
    }

    // If deleted user was a parent with children
    const childIds: string[] = data.childIds || [];
    for (const childId of childIds) {
      batch.delete(db.doc(`parentOf/${userId}_${childId}`));
    }

    // Also clean up any parentOf docs where this user appears as a student
    // (in case childIds on the parent side wasn't in sync)
    const asStudentSnap = await db.collection('parentOf')
      .where('studentId', '==', userId)
      .get();
    asStudentSnap.forEach((doc) => batch.delete(doc.ref));

    // Clean up any parentOf docs where this user appears as a parent
    const asParentSnap = await db.collection('parentOf')
      .where('parentId', '==', userId)
      .get();
    asParentSnap.forEach((doc) => batch.delete(doc.ref));

    await batch.commit();
    console.log(`[cleanupParentOf] Cleaned up parentOf mappings for deleted user ${userId}`);
  }
);
```

---

## Deployment Checklist

- [ ] Deploy `onUserApproved` Cloud Function to `europe-west1`
- [ ] Deploy `onUserCreated` Cloud Function to `europe-west1`
- [ ] Deploy `onUserUpdated_syncParentOf` Cloud Function to `europe-west1`
- [ ] Deploy `onUserCreated_syncParentOf` Cloud Function to `europe-west1`
- [ ] Deploy `onUserDeleted_cleanupParentOf` Cloud Function to `europe-west1`
- [ ] Create `/api/auth/login` route handler
- [ ] Create `/api/auth/logout` route handler
- [ ] Create `/api/auth/refresh` route handler
- [ ] Update `login()` in `use-auth.tsx` to use real Firebase Auth
- [ ] Update `logout()` in `use-auth.tsx` to call `/api/auth/logout`
- [ ] Remove `setAuthCookie()` / `removeAuthCookie()` functions
- [ ] Add Firestore index on `users/{userId}._claimsUpdatedAt`
- [ ] Add Firestore indexes on `parentOf` collection: `studentId`, `parentId`
- [ ] Set `FIREBASE_SERVICE_ACCOUNT_KEY` in Secret Manager
- [ ] Backfill existing parent-child relationships into `parentOf` collection
