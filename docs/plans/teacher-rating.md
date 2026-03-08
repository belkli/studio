# Teacher Rating Plan

## 1. teacher_ratings Table Schema (scripts/db/schema.sql)

```sql
CREATE TABLE IF NOT EXISTS teacher_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  conservatorium_id UUID NOT NULL REFERENCES conservatoriums(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_ratings_teacher ON teacher_ratings(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_conservatorium ON teacher_ratings(conservatorium_id);

-- Uniqueness: one rating per reviewer per teacher per conservatorium
CREATE UNIQUE INDEX IF NOT EXISTS uq_teacher_ratings_teacher_reviewer_conservatorium
  ON teacher_ratings(teacher_id, reviewer_user_id, conservatorium_id);
```

Integrity trigger (`trg_teacher_ratings_role_integrity`) enforces that `teacher_id` must reference a user with `role = 'TEACHER'`.

## 2. TeacherRating Type to Add to types.ts

```ts
export type TeacherRating = {
  id: string;
  teacherId: string;
  reviewerUserId: string;
  conservatoriumId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string; // ISO timestamp
};
```

Add to `src/lib/types.ts` after the `ScholarshipApplication` block.

### Existing scaffolding in the User type:
`src/lib/types.ts` already has `teacherRatingAvg?: number` and `teacherRatingCount?: number` on the `User` type (~line 492–493). These are display-only denormalised fields that should be kept in sync whenever a new rating is saved.

## 3. Who Can Rate

**Eligible reviewers:** users with role `student` or `parent` who have at least one completed lesson (`status === 'completed'`) with the target teacher within the same `conservatoriumId`.

**Rules:**
- One rating per reviewer per teacher (enforced by DB unique index and server-side check).
- Reviewer must be in the same conservatorium as the teacher.
- Anonymous public visitors cannot rate.
- Teachers, admins, and ministry directors cannot rate other teachers.
- A student under-13 delegates to parent: parent rates, not student (use role check: `role === 'parent' || role === 'student'` where student can be over-13 only).

**Eligibility check in server action:**
```ts
const completedLessons = await db.lessons.list();
const hasCompletedLesson = completedLessons.some(
  l => l.teacherId === teacherId
    && (l.studentId === userId || /* parent check */ parentStudentIds.includes(l.studentId))
    && l.status === 'completed'
    && l.conservatoriumId === conservatoriumId
);
```

## 4. saveTeacherRating Server Action

### Location: `src/app/actions.ts`

```ts
const SaveTeacherRatingSchema = z.object({
  teacherId: z.string(),
  conservatoriumId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export const saveTeacherRatingAction = withAuth(
  SaveTeacherRatingSchema,
  async ({ teacherId, conservatoriumId, rating, comment }) => {
    await requireRole(['student', 'parent']);
    const db = await getDb();
    const { userId } = getCurrentAuthContext(); // from withAuth closure

    // Eligibility: must have a completed lesson with this teacher
    const lessons = await db.lessons.list();
    const eligible = lessons.some(
      l => l.teacherId === teacherId
        && l.conservatoriumId === conservatoriumId
        && l.status === 'completed'
        && (l.studentId === userId || /* parent child */ false) // expand for parent
    );
    if (!eligible) return { success: false as const, reason: 'no_completed_lesson' as const };

    // Uniqueness: check existing rating
    const existing = await db.ratings.findByTeacherAndReviewer(teacherId, userId, conservatoriumId);
    if (existing) return { success: false as const, reason: 'already_rated' as const };

    const newRating = await db.ratings.create({
      teacherId, reviewerUserId: userId, conservatoriumId,
      rating: rating as 1|2|3|4|5,
      comment,
      createdAt: new Date().toISOString(),
    });

    // Recompute denormalised avg on the teacher user record
    const allRatings = await db.ratings.findByTeacher(teacherId);
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await db.users.update(teacherId, {
      teacherRatingAvg: Math.round(avg * 10) / 10,
      teacherRatingCount: allRatings.length,
    });

    return { success: true as const, rating: newRating };
  }
);
```

Note: `withAuth` in this codebase wraps a Server Action and provides `requireRole`. The exact mechanism for `userId` depends on `src/lib/auth-utils.ts` `verifyAuth()`. In dev mode it returns `site_admin` dev user — in tests the rating eligibility check will need a mock completed lesson for the dev user.

## 5. Mock DB — In-Memory Ratings Store

### 5a. MemorySeed (src/lib/db/adapters/shared.ts)

Add to `MemorySeed`:
```ts
ratings: TeacherRating[];
```

Add to `buildDefaultMemorySeed()` (in `src/lib/db/default-memory-seed.ts`):
```ts
ratings: [],
```

### 5b. Repository interface (src/lib/db/types.ts)

```ts
export interface TeacherRatingRepository extends ScopedRepository<TeacherRating> {
  findByTeacher(teacherId: string): Promise<TeacherRating[]>;
  findByTeacherAndReviewer(
    teacherId: string,
    reviewerUserId: string,
    conservatoriumId: string
  ): Promise<TeacherRating | null>;
}
```

Add to `DbAdapter` interface:
```ts
ratings: TeacherRatingRepository;
```

### 5c. createTeacherRatingRepository (shared.ts)

```ts
function createTeacherRatingRepository(initial: TeacherRating[]): TeacherRatingRepository {
  const base = createScopedRepository<TeacherRating>(initial, 'rating');
  const state: TeacherRating[] = [...initial]; // keep own mutable copy for custom queries

  return {
    ...base,
    async findByTeacher(teacherId: string) {
      const all = await base.list();
      return all.filter(r => r.teacherId === teacherId);
    },
    async findByTeacherAndReviewer(teacherId, reviewerUserId, conservatoriumId) {
      const all = await base.list();
      return all.find(
        r => r.teacherId === teacherId
          && r.reviewerUserId === reviewerUserId
          && r.conservatoriumId === conservatoriumId
      ) ?? null;
    },
  };
}
```

Wire in `MemoryDbAdapter` constructor:
```ts
this.ratings = createTeacherRatingRepository(seed.ratings ?? []);
```

### 5d. use-auth.tsx mutations

Add to `AuthContextType`:
```ts
saveTeacherRating: (teacherId: string, rating: 1|2|3|4|5, comment?: string) => Promise<{ success: boolean; reason?: string }>;
teacherRatings: TeacherRating[];
```

Implement in `use-auth.tsx`:
```ts
const [mockTeacherRatings, setMockTeacherRatings] = useState<TeacherRating[]>([]);

const saveTeacherRating = async (teacherId: string, rating: 1|2|3|4|5, comment?: string) => {
  const teacher = users.find(u => u.id === teacherId);
  if (!teacher) return { success: false, reason: 'not_found' };

  // Eligibility check in mock: does user have a completed lesson with this teacher?
  const lessons = mockLessons.filter(
    l => l.teacherId === teacherId && l.status === 'completed'
      && (l.studentId === user?.id || user?.childIds?.includes(l.studentId))
  );
  if (lessons.length === 0) return { success: false, reason: 'no_completed_lesson' };

  // Uniqueness check
  const alreadyRated = mockTeacherRatings.some(
    r => r.teacherId === teacherId && r.reviewerUserId === (user?.id ?? '')
  );
  if (alreadyRated) return { success: false, reason: 'already_rated' };

  const newRating: TeacherRating = {
    id: `rating-${Date.now()}`,
    teacherId,
    reviewerUserId: user?.id ?? '',
    conservatoriumId: teacher.conservatoriumId ?? '',
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  setMockTeacherRatings(prev => [...prev, newRating]);

  // Update denormalised avg on the teacher user
  const updatedRatings = [...mockTeacherRatings, newRating].filter(r => r.teacherId === teacherId);
  const avg = updatedRatings.reduce((s, r) => s + r.rating, 0) / updatedRatings.length;
  // Note: users state is managed outside useAuth; trigger an in-place update or pass to a separate setter

  // Fire server action (optimistic approach: don't await, ignore errors)
  void saveTeacherRatingAction({
    teacherId,
    conservatoriumId: teacher.conservatoriumId ?? '',
    rating,
    comment,
  }).catch(() => {});

  return { success: true };
};
```

Note: updating the denormalised `teacherRatingAvg` / `teacherRatingCount` on the `users` array in the mock requires access to the users setter. The cleanest approach: derive displayed avg/count from `mockTeacherRatings` at render time rather than patching the User object in memory — compute on the fly in the component.

## 6. UI — StarRatingDialog

### Component: `src/components/harmonia/star-rating-dialog.tsx`

A focused Dialog component. Props:
```ts
type StarRatingDialogProps = {
  teacherId: string;
  teacherName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: 1|2|3|4|5, comment?: string) => Promise<{ success: boolean; reason?: string }>;
};
```

Content:
- 5 star buttons (filled/unfilled amber stars, click to select rating).
- Optional `<Textarea>` for comment (max 500 chars).
- Submit button (disabled until a star is selected).
- On submit: show spinner, call `onSubmit`, show success/error toast, close dialog.
- If `reason === 'already_rated'`: show info toast "You have already rated this teacher".
- If `reason === 'no_completed_lesson'`: show info toast "You need a completed lesson to rate this teacher".

### Where to render:

**About page** (`src/app/[locale]/about/page.tsx`):
- The selected teacher detail panel already shows `teacherRatingAvg` and `teacherRatingCount` in the expanded view.
- Add a "Rate this teacher" button below the existing star display, visible only when `user?.role === 'student' || user?.role === 'parent'` (from `useAuth`).
- Button opens `<StarRatingDialog>`.

**Conservatorium public profile page** (`src/components/harmonia/conservatorium-public-profile-page.tsx`):
- Teacher cards in the sidebar list and the detail panel lack rating display currently.
- Add `teacherRatingAvg` / `teacherRatingCount` to the `ProfileEntry` type at line ~25.
- Propagate these fields when building `allProfiles` from `matchedTeacher` (line ~222) and `teachersInCons` (line ~241).
- Add star display + "Rate" button to the detail panel (same as About page pattern).

## 7. Display — Average Stars + Count on Teacher Cards

### Existing display (About page):
Already implemented at `about/page.tsx` lines 953–958 (list item) and 994–999 (detail panel):
```tsx
{typeof profile.teacherRatingAvg === 'number' && (profile.teacherRatingCount || 0) > 0 && (
  <p className="flex items-center gap-1 text-sm text-amber-600">
    <Star className="h-4 w-4 fill-current" />
    <span>{profile.teacherRatingAvg.toFixed(1)} ({profile.teacherRatingCount})</span>
  </p>
)}
```
This reads from the User's `teacherRatingAvg` / `teacherRatingCount` fields — which must be kept in sync when ratings are saved.

### Conservatorium profile page (to add):
Same JSX pattern. Source: build `teacherRatingAvg` / `teacherRatingCount` into `ProfileEntry` from the matched teacher user object when constructing `allProfiles`.

### Landing page (`src/components/harmonia/public-landing-page.tsx`):
Teacher cards already show the premium badge. If `user.teacherRatingAvg` is available from mock data, add the same star display below the instrument line. This is a read-only display — no rate button on the public landing page (unauthenticated context).

### Derived display in mock (alternative to patching User):
If patching the User object proves complex, components can instead call a helper:
```ts
function getTeacherAvgRating(teacherId: string, ratings: TeacherRating[]) {
  const tr = ratings.filter(r => r.teacherId === teacherId);
  if (tr.length === 0) return null;
  return { avg: tr.reduce((s, r) => s + r.rating, 0) / tr.length, count: tr.length };
}
```
Expose `teacherRatings` from `useAuth()` and compute inline in the rendering component.

## 8. Translation Keys

Add a new `TeacherRating` namespace to all 4 locale files. Suggested file: `src/messages/{he,en,ar,ru}/public.json` (used by the public about/profile pages). Alternatively, place in `common.json` if used in both public and dashboard contexts.

| Key | en | he | ar | ru |
|---|---|---|---|---|
| `rateTeacher` | "Rate teacher" | "דרג מורה" | "قيّم المعلم" | "Оценить учителя" |
| `ratingTitle` | "Rate {name}" | "דרג את {name}" | "قيّم {name}" | "Оценить {name}" |
| `ratingLabel` | "Your rating" | "הדירוג שלך" | "تقييمك" | "Ваша оценка" |
| `commentLabel` | "Comment (optional)" | "הערה (אופציונלי)" | "تعليق (اختياري)" | "Комментарий (необязательно)" |
| `commentPlaceholder` | "Share your experience..." | "שתף את חווייתך..." | "شارك تجربتك..." | "Поделитесь опытом..." |
| `submitRating` | "Submit rating" | "שלח דירוג" | "إرسال التقييم" | "Отправить оценку" |
| `ratingSuccess` | "Thank you for your rating!" | "תודה על הדירוג!" | "شكراً لتقييمك!" | "Спасибо за оценку!" |
| `alreadyRated` | "You have already rated this teacher." | "כבר דירגת את המורה הזה." | "لقد قيّمت هذا المعلم مسبقاً." | "Вы уже оценили этого учителя." |
| `noCompletedLesson` | "You need to complete a lesson before rating." | "עליך להשלים שיעור לפני הדירוג." | "تحتاج إلى إكمال درس قبل التقييم." | "Вам нужно завершить урок перед оценкой." |
| `starsLabel` | "{count} stars" | "{count} כוכבים" | "{count} نجوم" | "{count} звёзды" |
| `ratingsCount` | "({count} ratings)" | "({count} דירוגים)" | "({count} تقييمات)" | "({count} оценок)" |

## 9. Files to Create / Edit in Order

1. **`src/lib/types.ts`** — add `TeacherRating` type; verify `User.teacherRatingAvg` and `User.teacherRatingCount` already present (they are).
2. **`src/lib/db/types.ts`** — add `TeacherRatingRepository` interface; add `ratings` to `DbAdapter`.
3. **`src/lib/db/adapters/shared.ts`** — add `ratings: TeacherRating[]` to `MemorySeed`; implement `createTeacherRatingRepository`; wire in `MemoryDbAdapter` constructor.
4. **`src/lib/db/default-memory-seed.ts`** — add `ratings: []` to the seed object.
5. **`src/app/actions.ts`** — add `saveTeacherRatingAction`.
6. **`src/hooks/use-auth.tsx`** — add `mockTeacherRatings` state; add `saveTeacherRating` mutation; expose `teacherRatings` in context value; update `AuthContextType` interface; import `saveTeacherRatingAction`.
7. **`src/components/harmonia/star-rating-dialog.tsx`** — create new component.
8. **`src/app/[locale]/about/page.tsx`** — add "Rate" button + `<StarRatingDialog>` to teacher detail panel.
9. **`src/components/harmonia/conservatorium-public-profile-page.tsx`** — add `teacherRatingAvg`/`teacherRatingCount` to `ProfileEntry` type; propagate from user data; add star display + "Rate" button to detail panel.
10. **`src/messages/{he,en,ar,ru}/public.json`** — add `TeacherRating` namespace with 11 keys above.
11. **`scripts/db/schema.sql`** — already complete (table + indexes + trigger exist at lines 114–634).

## 10. Notes and Gotchas

- The `teacher_ratings` table and its uniqueness index and integrity trigger are **already in schema.sql** — no SQL changes needed.
- The `User` type already carries `teacherRatingAvg?: number` and `teacherRatingCount?: number` — just needs to be populated.
- Mock seed data has 71 directory teachers and 2 premium teachers. Add a handful of seed ratings (e.g., 3–5 entries) to `buildDefaultMemorySeed()` so the star display is visible during development without needing to submit ratings.
- The `saveTeacherRatingAction` must be in `src/app/actions.ts` (already has `'use server'` directive) — do not add `'use server'` to the new file; it is already at the top.
- To avoid Vitest import issues (CLAUDE.md: "Files with 'use server' cannot be imported in Vitest"), unit-test the eligibility logic as a pure function extracted from the action — mirror the pattern in `tests/` for other actions.
