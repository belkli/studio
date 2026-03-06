/**
 * @fileoverview Firebase Admin SDK initialization for server-side operations.
 * Used by middleware and Server Actions for session cookie verification,
 * Custom Claims management, and Firestore/Storage admin operations.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY environment variable containing
 * the JSON service account key (base64-encoded or raw JSON string).
 */
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

let adminApp: App | null = null;

function getAdminApp(): App | null {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.warn(
      '[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY is not set. ' +
      'Admin SDK features (session cookies, Custom Claims, Firestore admin) are disabled. ' +
      'This is expected in local development without Firebase credentials.'
    );
    return null;
  }

  try {
    // Support both base64-encoded and raw JSON service account keys
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(serviceAccountKey);
    } catch {
      // Try base64 decode
      const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
      parsed = JSON.parse(decoded);
    }

    adminApp = initializeApp({
      credential: cert(parsed as Parameters<typeof cert>[0]),
      projectId: parsed.project_id as string | undefined,
    });

    return adminApp;
  } catch (error) {
    console.error('[firebase-admin] Failed to initialize Admin SDK:', error);
    return null;
  }
}

/**
 * Firebase Admin Auth instance.
 * Returns null when FIREBASE_SERVICE_ACCOUNT_KEY is not configured.
 */
export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

/**
 * Firebase Admin Firestore instance.
 * Returns null when FIREBASE_SERVICE_ACCOUNT_KEY is not configured.
 */
export function getAdminFirestore(): Firestore | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

/**
 * Firebase Admin Storage instance.
 * Returns null when FIREBASE_SERVICE_ACCOUNT_KEY is not configured.
 */
export function getAdminStorage(): Storage | null {
  const app = getAdminApp();
  return app ? getStorage(app) : null;
}

// Convenience aliases matching the naming convention in the architecture docs
export const adminAuth = getAdminAuth;
export const adminFirestore = getAdminFirestore;
export const adminStorage = getAdminStorage;
