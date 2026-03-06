'use server';

/**
 * @fileoverview Signed URL Server Actions for Firebase Storage PII content.
 *
 * PDPPA Compliance: Student recordings, feedback, and invoices are PII of minors.
 * Firebase Storage Rules cannot call Firestore exists() to verify parent-child
 * relationships. Therefore, parent access to their children's content MUST go
 * through these Server Actions, which:
 *   1. Verify authentication via session cookie (verifyAuth)
 *   2. Enforce role-based access (requireRole)
 *   3. Verify parent-child relationship via parentOf/{parentId}_{studentId}
 *   4. Generate short-lived signed URLs (15 min TTL)
 *
 * This is the authoritative access pattern for all PII storage paths.
 * See storage.rules for the corresponding rule comments.
 */

import { requireRole, verifyAuth } from '@/lib/auth-utils';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase-admin';
import type { UserRole } from '@/lib/types';

const SIGNED_URL_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Verify that a parent has access to a specific student's data
 * by checking the parentOf/{parentId}_{studentId} document.
 */
async function verifyParentChildLink(parentId: string, studentId: string): Promise<void> {
  const db = getAdminFirestore();
  if (!db) throw new Error('Firestore not configured');

  const linkDoc = await db.doc(`parentOf/${parentId}_${studentId}`).get();
  if (!linkDoc.exists) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Generate a signed URL for a Firebase Storage object.
 * Uses the Firebase Admin Storage SDK to create a time-limited download URL.
 */
async function generateSignedUrl(storagePath: string): Promise<string> {
  const storage = getAdminStorage();
  if (!storage) throw new Error('Storage not configured');

  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + SIGNED_URL_TTL_MS,
  });

  return url;
}

/**
 * Determine if the caller can access a student's content.
 * Returns the verified claims. Throws on unauthorized access.
 */
async function authorizeStudentContentAccess(
  conservatoriumId: string,
  studentId: string,
  allowedDirectRoles: UserRole[],
): Promise<void> {
  const claims = await verifyAuth();

  if (!claims.approved) {
    throw new Error('ACCOUNT_NOT_APPROVED');
  }

  // Site admin can access everything
  if (claims.role === 'site_admin') return;

  // Must belong to the same conservatorium
  if (claims.conservatoriumId !== conservatoriumId) {
    throw new Error('TENANT_MISMATCH');
  }

  // Direct access roles (admin, teacher, the student themselves)
  if (allowedDirectRoles.includes(claims.role)) return;
  if (claims.role === 'student' && claims.uid === studentId) return;

  // Parent access: verify parent-child relationship
  if (claims.role === 'parent') {
    await verifyParentChildLink(claims.uid, studentId);
    return;
  }

  throw new Error('FORBIDDEN');
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Get a signed URL for a student's practice video.
 * Parents can only access their own children's videos (verified via parentOf).
 */
export async function getSignedPracticeVideoUrl(input: {
  conservatoriumId: string;
  studentId: string;
  filename: string;
}): Promise<{ url: string; expiresIn: number }> {
  await authorizeStudentContentAccess(
    input.conservatoriumId,
    input.studentId,
    ['conservatorium_admin', 'delegated_admin', 'teacher'],
  );

  const storagePath = `conservatoriums/${input.conservatoriumId}/practiceVideos/${input.studentId}/${input.filename}`;
  const url = await generateSignedUrl(storagePath);

  return { url, expiresIn: SIGNED_URL_TTL_MS };
}

/**
 * Get a signed URL for teacher feedback audio/video for a student.
 * Parents can only access their own children's feedback (verified via parentOf).
 */
export async function getSignedFeedbackUrl(input: {
  conservatoriumId: string;
  studentId: string;
  logId: string;
  filename: string;
}): Promise<{ url: string; expiresIn: number }> {
  await authorizeStudentContentAccess(
    input.conservatoriumId,
    input.studentId,
    ['conservatorium_admin', 'delegated_admin', 'teacher'],
  );

  const storagePath = `conservatoriums/${input.conservatoriumId}/feedback/${input.studentId}/${input.logId}/${input.filename}`;
  const url = await generateSignedUrl(storagePath);

  return { url, expiresIn: SIGNED_URL_TTL_MS };
}

/**
 * Get a signed URL for an invoice PDF.
 * Parents and students can access invoices where they are the payer.
 * Admin can access any invoice in their conservatorium.
 */
export async function getSignedInvoiceUrl(input: {
  conservatoriumId: string;
  invoiceId: string;
  filename: string;
}): Promise<{ url: string; expiresIn: number }> {
  const claims = await requireRole(
    ['conservatorium_admin', 'delegated_admin', 'parent', 'student', 'site_admin'],
    input.conservatoriumId,
  );

  // For non-admin roles, verify the caller is the payer on this invoice
  if (claims.role === 'parent' || claims.role === 'student') {
    const db = getAdminFirestore();
    if (!db) throw new Error('Firestore not configured');

    const invoiceDoc = await db
      .doc(`conservatoriums/${input.conservatoriumId}/invoices/${input.invoiceId}`)
      .get();

    if (!invoiceDoc.exists) throw new Error('NOT_FOUND');

    const invoiceData = invoiceDoc.data();
    const payerId = invoiceData?.payerId;

    // Parent: either they are the payer, or their child is
    if (claims.role === 'parent') {
      if (payerId !== claims.uid) {
        await verifyParentChildLink(claims.uid, payerId);
      }
    } else if (claims.role === 'student' && payerId !== claims.uid) {
      throw new Error('FORBIDDEN');
    }
  }

  const storagePath = `conservatoriums/${input.conservatoriumId}/invoices/${input.invoiceId}/${input.filename}`;
  const url = await generateSignedUrl(storagePath);

  return { url, expiresIn: SIGNED_URL_TTL_MS };
}

/**
 * Get a signed URL for a form submission PDF (ministry forms).
 * Only admin and ministry directors can access these.
 */
export async function getSignedFormSubmissionUrl(input: {
  conservatoriumId: string;
  formId: string;
  filename: string;
}): Promise<{ url: string; expiresIn: number }> {
  await requireRole(
    ['conservatorium_admin', 'delegated_admin', 'ministry_director', 'site_admin'],
    input.conservatoriumId,
  );

  const storagePath = `conservatoriums/${input.conservatoriumId}/formSubmissions/${input.formId}/${input.filename}`;
  const url = await generateSignedUrl(storagePath);

  return { url, expiresIn: SIGNED_URL_TTL_MS };
}

/**
 * Get a signed URL for a digital signature image.
 * Only admin, site admin, and ministry directors can access raw signatures.
 */
export async function getSignedSignatureUrl(input: {
  conservatoriumId: string;
  auditRecordId: string;
  filename: string;
}): Promise<{ url: string; expiresIn: number }> {
  await requireRole(
    ['conservatorium_admin', 'site_admin', 'ministry_director'],
    input.conservatoriumId,
  );

  const storagePath = `conservatoriums/${input.conservatoriumId}/signatures/${input.auditRecordId}/${input.filename}`;
  const url = await generateSignedUrl(storagePath);

  return { url, expiresIn: SIGNED_URL_TTL_MS };
}
