/**
 * @fileoverview Firebase client-side auth provider (browser safe).
 * Only imports firebase/auth and firebase-client — never firebase-admin.
 */
import type { IClientAuthProvider, OAuthResult } from './provider';

export class FirebaseClientAuthProvider implements IClientAuthProvider {
  async signInWithEmailPassword(email: string, password: string): Promise<string> {
    const { getClientAuth } = await import('@/lib/firebase-client');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const auth = getClientAuth();
    if (!auth) throw new Error('Firebase client not configured');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user.getIdToken();
  }

  async signInWithOAuth(provider: 'google' | 'microsoft', fallbackEmail?: string): Promise<OAuthResult> {
    const { signInWithGoogle, signInWithMicrosoft } = await import('./oauth');
    return provider === 'google'
      ? signInWithGoogle({ fallbackEmail })
      : signInWithMicrosoft({ fallbackEmail });
  }

  async signOut(): Promise<void> {
    const { getClientAuth } = await import('@/lib/firebase-client');
    const auth = getClientAuth();
    if (!auth) return;
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
  }
}
