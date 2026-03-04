import {
  GoogleAuthProvider,
  OAuthProvider,
  fetchSignInMethodsForEmail,
  signInWithPopup,
} from 'firebase/auth';
import { getClientAuth } from '@/lib/firebase-client';

export type OAuthProviderName = 'google' | 'microsoft';

export interface OAuthProfile {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  provider: OAuthProviderName;
  providerUserId: string;
}

export type OAuthSignInResult =
  | { type: 'success'; profile: OAuthProfile }
  | { type: 'conflict'; existingMethods: string[]; email: string };

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('openid');
microsoftProvider.addScope('profile');
microsoftProvider.addScope('email');

function createMockProfile(provider: OAuthProviderName, fallbackEmail: string): OAuthProfile {
  const [firstName = '', ...rest] = fallbackEmail.split('@')[0].split(/[._\-\s]+/);
  return {
    email: fallbackEmail,
    firstName,
    lastName: rest.join(' '),
    provider,
    providerUserId: `mock-${provider}-${fallbackEmail.toLowerCase()}`,
  };
}

async function signInWithProvider(
  provider: GoogleAuthProvider | OAuthProvider,
  providerName: OAuthProviderName,
  fallbackEmail?: string
): Promise<OAuthSignInResult> {
  const auth = getClientAuth();

  if (!auth) {
    if (!fallbackEmail) {
      throw new Error('OAuth is not configured and no fallback email was provided.');
    }

    return { type: 'success', profile: createMockProfile(providerName, fallbackEmail) };
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    if (!firebaseUser.email) {
      throw new Error('OAuth provider did not return an email.');
    }

    const parts = (firebaseUser.displayName || '').trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');

    return {
      type: 'success',
      profile: {
        email: firebaseUser.email,
        firstName,
        lastName,
        avatarUrl: firebaseUser.photoURL || undefined,
        provider: providerName,
        providerUserId: firebaseUser.uid,
      },
    };
  } catch (error: any) {
    if (auth && error?.code === 'auth/account-exists-with-different-credential') {
      const conflictEmail = error.customData?.email as string | undefined;
      if (conflictEmail) {
        const methods = await fetchSignInMethodsForEmail(auth, conflictEmail);
        return { type: 'conflict', existingMethods: methods, email: conflictEmail };
      }
    }
    throw error;
  }
}

export function signInWithGoogle(options?: { fallbackEmail?: string }) {
  return signInWithProvider(googleProvider, 'google', options?.fallbackEmail);
}

export function signInWithMicrosoft(options?: { fallbackEmail?: string }) {
  return signInWithProvider(microsoftProvider, 'microsoft', options?.fallbackEmail);
}
