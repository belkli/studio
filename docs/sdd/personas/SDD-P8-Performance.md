# SDD-P8: Persona Audit — Performance Specialist
**Harmonia 360° Architecture Audit**
**Persona:** Performance Engineer / Site Reliability Specialist
**Auditor Role:** Firebase Optimization Expert, Media Pipeline Architect
**Version:** 1.0 | **Date:** 2026-02-25

---

## 1. Executive Summary

Performance at a music conservatorium has a specific profile: a 2-hour window every weekday between 15:00–17:00 when hundreds of students and parents simultaneously open the app to check their lesson schedule, log practice, and book next week's session. Then silence. Then another spike at 19:00 when parents come home and check invoices. Outside these windows, traffic is near zero.

This is not a "sustained high-load" problem — it's a **thundering herd** problem. The architecture must handle 10× normal traffic for 2-hour windows, then idle cheaply. Firebase's serverless model is theoretically ideal for this, but the way the application is currently designed would make these spikes catastrophic.

**Critical Performance Architecture Findings:**

The prototype's `use-auth.tsx` reveals the deepest performance problem in the system: **the entire application state is loaded into a single React context on app initialization**. Every user gets every dataset — all lessons, all invoices, all practice logs, all form submissions — loaded in one giant context. In production with thousands of records, this pattern would:
1. Fire hundreds of Firestore reads on every page load (one per collection)
2. Load data irrelevant to the current user's role
3. Re-render the entire component tree on any state change
4. Exhaust Firestore's free read quota within days

This architectural decision — which was correct for a mock-data prototype — must be completely reversed before production.

---

## 2. Performance Problem Catalog

### PP-1: Monolithic Context — The Root Performance Problem
**Impact:** 50–200 Firestore reads per user session | Cold start latency: potentially 3–5 seconds

The `AuthProvider` in `use-auth.tsx` initializes 25+ state arrays, all populated from `initialMockData`. When migrated to Firebase, each of these would become a Firestore collection query on mount:

```typescript
// This pattern — 25 collection reads on app mount — is catastrophic in production:
const [mockLessons, setMockLessons] = useState(initialMockData.mockLessons);
const [mockPackages, setMockPackages] = useState(initialMockData.mockPackages);
const [mockInvoices, setMockInvoices] = useState(initialMockData.mockInvoices);
// × 22 more collections...
```

**Fix:** Decompose into role-scoped, lazy-loaded, query-specific hooks with React Query or SWR:

```typescript
// Replace monolithic context with focused, lazy hooks
// src/hooks/data/use-my-lessons.ts
export function useMyLessons(userId: string, role: UserRole, conservatoriumId: string) {
  return useFirestoreQuery<LessonSlot>(
    // Query is role-scoped — teacher sees only their lessons, student sees only theirs
    query(
      collection(db, `conservatoriums/${conservatoriumId}/lessonSlots`),
      role === 'TEACHER'
        ? where('teacherId', '==', userId)
        : where('studentId', '==', userId),
      where('startTime', '>=', Timestamp.fromDate(startOfWeek(new Date()))),
      where('startTime', '<=', Timestamp.fromDate(addWeeks(new Date(), 4))),
      orderBy('startTime', 'asc'),
      limit(50)   // Never load more than 50 at once
    )
  );
}

// src/hooks/data/use-my-invoices.ts
export function useMyInvoices(payerId: string, conservatoriumId: string) {
  return useFirestoreQuery<Invoice>(
    query(
      collection(db, `conservatoriums/${conservatoriumId}/invoices`),
      where('payerId', '==', payerId),
      where('status', 'in', ['SENT', 'OVERDUE', 'PENDING']),  // Only unpaid — don't load 3 years of history
      orderBy('dueDate', 'desc'),
      limit(10)
    )
  );
}
// Each hook loads only when the component that needs it mounts
// Uses React Query's stale-while-revalidate for instant cache hits
```

---

### PP-2: Heavy PDF Scores in Firebase Storage
**Impact:** 2–8MB per score PDF, loaded in-browser without optimization

Sheet music PDFs can be large. Loading a full orchestral score at full resolution on a mobile phone is wasteful and slow.

**Fix: PDF optimization pipeline using Cloud Functions + ImageMagick:**

```typescript
// functions/src/storage/onSheetMusicUploaded.ts
export const onSheetMusicUploaded = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  if (!filePath?.includes('/sheetMusic/')) return;
  if (filePath.endsWith('_optimized.pdf')) return; // prevent infinite loop

  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);

  // Download original
  const [buffer] = await file.download();

  // Compress PDF using pdf-lib or ghostscript (via child_process)
  // Target: reduce 5MB → ~1.5MB without visible quality loss at screen resolution
  const optimized = await compressPDF(buffer, { dpi: 150, quality: 85 });

  // Upload optimized version
  const optimizedPath = filePath.replace('.pdf', '_optimized.pdf');
  await bucket.file(optimizedPath).save(optimized, {
    contentType: 'application/pdf',
    metadata: { optimized: 'true', originalSize: buffer.length.toString() },
  });

  // Update the composition document to point to optimized version
  const compositionId = extractCompositionId(filePath);
  await db.doc(`sheetMusic/${compositionId}`).update({
    pdfUrl: optimizedPath,
    pdfSizeBytes: optimized.length,
    pdfOptimizedAt: Timestamp.now(),
  });
});
```

---

### PP-3: Video Practice Log Storage and Delivery
**Impact:** 100–500MB per student per month in video uploads, served without CDN optimization

Student practice videos uploaded directly to Firebase Storage are served from Firebase's CDN with no transcoding, no thumbnail generation, and no adaptive bitrate streaming. A parent on mobile cellular viewing their child's practice video gets the raw 4K file from their phone's camera.

**Fix: Firebase Extensions + Cloud Functions video pipeline:**

```typescript
// Option A: Firebase Extension "Resize Images" (extended for video)
// Option B: Custom Cloud Function using ffmpeg

// functions/src/storage/onPracticeVideoUploaded.ts
import { spawn } from 'child_process';
import * as path from 'path';

export const onPracticeVideoUploaded = onObjectFinalized(async (event) => {
  const filePath = event.data.name;
  if (!filePath?.includes('/practiceVideos/')) return;
  if (filePath.includes('_720p') || filePath.includes('_thumb')) return;

  const bucket = admin.storage().bucket();
  const localInput = `/tmp/input_${Date.now()}.mp4`;
  const local720p = `/tmp/output_720p_${Date.now()}.mp4`;
  const localThumb = `/tmp/thumb_${Date.now()}.jpg`;

  await bucket.file(filePath).download({ destination: localInput });

  // Transcode to 720p (max 2Mbps) using ffmpeg
  await runFFmpeg([
    '-i', localInput,
    '-vf', 'scale=-2:720',
    '-c:v', 'libx264', '-crf', '28', '-preset', 'fast',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',   // Enable streaming without full download
    local720p
  ]);

  // Generate thumbnail at 5 seconds
  await runFFmpeg(['-i', localInput, '-ss', '00:00:05', '-vframes', '1', '-q:v', '2', localThumb]);

  // Upload processed versions
  const basePath = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));

  await bucket.upload(local720p, { destination: `${basePath}/${baseName}_720p.mp4` });
  await bucket.upload(localThumb, { destination: `${basePath}/${baseName}_thumb.jpg` });

  // Update practice video document with processed URLs
  const videoId = extractVideoId(filePath);
  await db.doc(`practiceLogs/${videoId}`).update({
    videoUrl720p: `${basePath}/${baseName}_720p.mp4`,
    thumbnailUrl: `${basePath}/${baseName}_thumb.jpg`,
    processingStatus: 'COMPLETE',
    processedAt: Timestamp.now(),
  });
});
```

---

### PP-4: Genkit AI Latency
**Impact:** Matchmaker takes 2–5 seconds; progress report takes 4–8 seconds; both block user interaction

**Observed latency pattern:** Genkit calls to Gemini are synchronous in the current flow implementations. The enrollment wizard blocks at Step 5 waiting for teacher match results. The progress report generation blocks the teacher dashboard.

**Fix: Non-blocking AI with optimistic UI and background processing:**

```typescript
// Pattern 1: Background job for slow AI operations (progress reports)
// Teacher clicks "Generate Report" → immediate UI feedback → result arrives async

'use server'
export async function requestProgressReport(studentId: string, teacherId: string, conservatoriumId: string): Promise<string> {
  const jobId = `report-job-${Date.now()}`;

  // Write a pending job document
  await db.doc(`conservatoriums/${conservatoriumId}/aiJobs/${jobId}`).set({
    id: jobId,
    type: 'PROGRESS_REPORT',
    studentId,
    teacherId,
    status: 'PENDING',
    requestedAt: Timestamp.now(),
  });

  // Trigger via Pub/Sub (non-blocking)
  await pubsub.topic('ai-jobs').publishMessage({ data: Buffer.from(JSON.stringify({ jobId, conservatoriumId })) });

  return jobId; // Return immediately
}

// functions/src/ai/processAIJob.ts — runs asynchronously via Pub/Sub
export const processAIJob = onMessagePublished('ai-jobs', async (event) => {
  const { jobId, conservatoriumId } = JSON.parse(
    Buffer.from(event.data.message.data, 'base64').toString()
  );

  const jobRef = db.doc(`conservatoriums/${conservatoriumId}/aiJobs/${jobId}`);
  await jobRef.update({ status: 'PROCESSING' });

  try {
    const job = (await jobRef.get()).data();
    const result = await runProgressReportFlow(job.studentId, job.teacherId);

    await jobRef.update({ status: 'COMPLETE', result, completedAt: Timestamp.now() });
  } catch (error) {
    await jobRef.update({ status: 'FAILED', error: String(error) });
  }
});

// Client polls the job status via onSnapshot (real-time)
export function useAIJobStatus(jobId: string, conservatoriumId: string) {
  const [job, setJob] = useState<AIJob | null>(null);
  useEffect(() => {
    return onSnapshot(
      doc(db, `conservatoriums/${conservatoriumId}/aiJobs/${jobId}`),
      (snap) => setJob(snap.data() as AIJob)
    );
  }, [jobId]);
  return job;
}

// Pattern 2: Pre-compute teacher matches (cache for 6 hours)
// Run the Matchmaker for each new student profile as soon as they complete Step 4
// By the time they reach Step 5, results are already ready
export const precomputeTeacherMatches = onDocumentCreated(
  'conservatoriums/{cid}/enrollmentDrafts/{draftId}',
  async (event) => {
    if (event.data.data()?.step !== 4) return; // Only after schedule preferences
    await triggerMatchmakerFlow(event.data.data(), event.params.cid);
  }
);
```

---

### PP-5: Firestore Index Strategy

The booking calendar query pattern will require composite indexes. Missing indexes cause full collection scans:

```json
// firestore.indexes.json — Required indexes
{
  "indexes": [
    // Lesson slot queries by teacher + date range (teacher dashboard)
    {
      "collectionGroup": "lessonSlots",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "conservatoriumId", "order": "ASCENDING" },
        { "fieldPath": "teacherId", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    // Lesson slot queries by student + date range (student dashboard)
    {
      "collectionGroup": "lessonSlots",
      "fields": [
        { "fieldPath": "conservatoriumId", "order": "ASCENDING" },
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    // Available slots by teacher + status (booking calendar)
    {
      "collectionGroup": "lessonSlots",
      "fields": [
        { "fieldPath": "conservatoriumId", "order": "ASCENDING" },
        { "fieldPath": "teacherId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    // Practice logs by student + date (teacher pre-lesson view)
    {
      "collectionGroup": "practiceLogs",
      "fields": [
        { "fieldPath": "conservatoriumId", "order": "ASCENDING" },
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    // Makeup credits by student + status (booking flow)
    {
      "collectionGroup": "makeupCredits",
      "fields": [
        { "fieldPath": "conservatoriumId", "order": "ASCENDING" },
        { "fieldPath": "studentId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

### PP-6: Next.js Rendering Strategy Optimization

```typescript
// next.config.ts — Performance configuration
const nextConfig = {
  // Enable React Server Components where possible
  // Only pages with real-time data need Client Components

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },

  // Bundle analysis
  // npm install @next/bundle-analyzer
  ...(process.env.ANALYZE === 'true' ? require('@next/bundle-analyzer')() : {}),

  // Compress responses
  compress: true,

  // Headers for static assets
  async headers() {
    return [{
      source: '/(_next/static|fonts|images)/(.*)',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    }];
  },
};

// Page rendering strategy:
// /admin/* → Server Component + onSnapshot for live data (ISR is insufficient for real-time)
// /dashboard/schedule → Client Component (requires real-time lesson updates)
// /register → Server Component (static wizard, no real-time data)
// /dashboard/practice → Client Component (gamification requires client-side state)
// /admin/reports → Server Component with generateStaticParams + 1-hour ISR

// Route segment config for report pages:
// src/app/admin/reports/page.tsx
export const revalidate = 3600; // 1 hour ISR for report data
```

---

## 3. Scalability: Concurrent After-School Spike Model

**Scenario:** 500 concurrent users at 15:30 on a Thursday (peak after-school time)
- 200 parents checking lesson schedule (Firestore reads)
- 100 students logging practice (Firestore writes)
- 50 parents booking next week's lesson (Cloud Function calls)
- 50 teachers marking attendance (Cloud Function calls)
- 100 miscellaneous navigation

**Firestore capacity at this load:**
- Reads: ~2,000/minute (well within Firestore's 1M reads/day free tier, ~11,500/day for paid)
- Writes: ~500/minute (requires Firestore pricing tier; ~$0.06/100K writes)
- Cloud Function invocations: ~500/minute (runs on Cloud Run; auto-scales)

**Bottleneck:** Without the stats aggregation layer (SDD-P1, Section 3.2), admin dashboard queries would trigger collection scans under load. A single admin refreshing the dashboard at 15:30 could trigger 10–20 expensive queries simultaneously.

**Solution:** The `conservatoriumStats/live` document approach means all 10 admin dashboard metric cards resolve to a **single Firestore document read** instead of 10+ queries.

---

## 4. Summary Scorecard

| Performance Area | Current Risk | Fix Priority |
|-----------------|-------------|-------------|
| Monolithic context (25+ collection reads on mount) | 🔴 Will fail at scale | P0 — Before Firebase migration |
| No Firestore indexes | 🔴 Full collection scans | P0 — Before launch |
| Stats aggregations (admin dashboard) | 🔴 N+1 query problem | P0 (from P1 SDD) |
| AI blocking enrollment flow | 🟡 3–5 sec UX degradation | P1 |
| PDF score loading (unoptimized) | 🟡 Slow on mobile | P1 |
| Video storage (no transcoding) | 🟡 High Storage costs | P1 |
| No CDN caching strategy | 🟡 Every request hits origin | P1 |
| ISR for report pages | 🟢 Easy win | P2 |
| PWA + offline support | 🟡 Practice log adoption risk | P2 |
