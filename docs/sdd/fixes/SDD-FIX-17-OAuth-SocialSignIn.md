# SDD-FIX-17: OAuth & Social Sign-In — Google, Microsoft & Registration Flow

**PDF Issue:** #23  
**Priority:** P1

---

## 1. Overview

The login page currently shows "Google (Soon)" and "Microsoft (Soon)" buttons that are disabled. This SDD defines the full OAuth integration strategy, including:

1. How Google & Microsoft OAuth works alongside the existing email/password flow.
2. Whether users must pre-register manually before signing in with OAuth.
3. How the registration wizard integrates with OAuth (pre-filling fields from provider profile).
4. Role-assignment flow for OAuth users.

---

## 2. Design Decision: OAuth-First vs. Manual-First

### Chosen Approach: **Progressive Registration**

OAuth users do **not** need to manually register first. The flow is:

```
User clicks "Sign in with Google/Microsoft"
         ↓
OAuth provider authenticates → returns profile (email, name, photo)
         ↓
System checks: does a Lyriosa account exist for this email?
  ├── YES → Log in directly, existing session restored
  └── NO  → "Complete your registration" wizard (pre-filled from OAuth)
              ↓
           User selects: registering child / self (13+) / playing school
              ↓
           Wizard continues (instrument, teacher match, package)
              ↓
           Account created + linked to OAuth provider
```

### Key Rules

| Rule | Detail |
|------|--------|
| Email as identity anchor | Same email = same account. If a user registered with email/password, they can later add Google OAuth to the same account. |
| No duplicate accounts | If `google_oauth_email === existing_user_email`, merge — don't create duplicate. |
| Role not assigned by OAuth | OAuth login grants access; roles (STUDENT, TEACHER, PARENT) are assigned during wizard or by admin. |
| Admin accounts | Admins cannot self-register via OAuth. They must be invited/created by SITE_ADMIN. OAuth can be used to *log in* to an existing admin account, but not to create one. |

---

## 3. Data Model — OAuth Provider Links

```typescript
interface UserOAuthProvider {
  userId: string;
  provider: 'google' | 'microsoft';
  providerUserId: string;       // sub / oid from provider
  providerEmail: string;
  linkedAt: string;
  lastUsedAt: string;
}

// Extension to existing User model:
interface User {
  // ... existing fields ...
  oauthProviders?: UserOAuthProvider[];
  registrationSource: 'email' | 'google' | 'microsoft' | 'admin_created';
  avatarUrl?: string;           // from OAuth provider if not manually set
}
```

---

## 4. Firebase Auth Configuration

The project already uses Firebase Auth. Google and Microsoft providers are built-in.

### 4.1 Enable Providers in Firebase Console

```
Firebase Console → Authentication → Sign-in method:
  ✅ Google — enable, add Web Client ID from Google Cloud Console
  ✅ Microsoft — enable, add Application (client) ID + Client Secret from Azure AD
```

### 4.2 Firebase Auth Integration Code

```typescript
// src/lib/auth/oauth.ts
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  linkWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('openid');
microsoftProvider.addScope('profile');
microsoftProvider.addScope('email');

export async function signInWithGoogle(): Promise<OAuthResult> {
  return signInWithOAuth(googleProvider, 'google');
}

export async function signInWithMicrosoft(): Promise<OAuthResult> {
  return signInWithOAuth(microsoftProvider, 'microsoft');
}

async function signInWithOAuth(
  provider: GoogleAuthProvider | OAuthProvider,
  providerName: 'google' | 'microsoft'
): Promise<OAuthResult> {
  try {
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Check if Lyriosa user profile exists for this email
    const harmoniaUser = await getUserByEmail(firebaseUser.email!);

    if (harmoniaUser) {
      // Existing user — link provider if not already linked
      await ensureProviderLinked(harmoniaUser.id, firebaseUser, providerName);
      return { type: 'existing', user: harmoniaUser };
    } else {
      // New user — return profile data for registration wizard
      return {
        type: 'new',
        profile: {
          email: firebaseUser.email!,
          firstName: firebaseUser.displayName?.split(' ')[0] ?? '',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') ?? '',
          avatarUrl: firebaseUser.photoURL ?? undefined,
          provider: providerName,
          providerUserId: firebaseUser.uid,
        },
      };
    }
  } catch (error: any) {
    // Handle account-exists-with-different-credential
    if (error.code === 'auth/account-exists-with-different-credential') {
      const email = error.customData?.email;
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return {
        type: 'conflict',
        existingMethods: methods,
        email,
      };
    }
    throw error;
  }
}

type OAuthResult =
  | { type: 'existing'; user: LyriosaUser }
  | { type: 'new'; profile: OAuthProfile }
  | { type: 'conflict'; existingMethods: string[]; email: string };

interface OAuthProfile {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  provider: 'google' | 'microsoft';
  providerUserId: string;
}
```

---

## 5. Login Page — Enable OAuth Buttons

### Location
`src/app/[locale]/(auth)/login/page.tsx` or `LoginForm.tsx`

```tsx
// Replace disabled buttons with active ones:
<div className="grid grid-cols-2 gap-3">
  <Button
    variant="outline"
    onClick={handleGoogleSignIn}
    disabled={isLoading}
    className="flex items-center gap-2"
  >
    <GoogleIcon className="h-4 w-4" />
    Google
  </Button>
  <Button
    variant="outline"
    onClick={handleMicrosoftSignIn}
    disabled={isLoading}
    className="flex items-center gap-2"
  >
    <MicrosoftIcon className="h-4 w-4" />
    Microsoft
  </Button>
</div>

// Handler:
const handleGoogleSignIn = async () => {
  setIsLoading(true);
  try {
    const result = await signInWithGoogle();
    
    if (result.type === 'existing') {
      router.push('/dashboard');
    } else if (result.type === 'new') {
      // Redirect to registration wizard with pre-filled data:
      sessionStorage.setItem('oauth_prefill', JSON.stringify(result.profile));
      router.push('/register?source=oauth');
    } else if (result.type === 'conflict') {
      toast({
        title: t('Auth.accountExistsTitle'),
        description: t('Auth.accountExistsDesc', { methods: result.existingMethods.join(', ') }),
        variant: 'destructive',
      });
    }
  } catch (e) {
    toast({ description: t('Common.errorOccurred'), variant: 'destructive' });
  } finally {
    setIsLoading(false);
  }
};
```

---

## 6. Registration Wizard — OAuth Pre-fill

When the wizard detects `?source=oauth`, read `oauth_prefill` from `sessionStorage` and pre-populate personal details:

```tsx
// src/app/[locale]/register/page.tsx
useEffect(() => {
  if (searchParams.get('source') === 'oauth') {
    const prefill = sessionStorage.getItem('oauth_prefill');
    if (prefill) {
      const profile = JSON.parse(prefill) as OAuthProfile;
      form.setValue('firstName', profile.firstName);
      form.setValue('lastName', profile.lastName);
      form.setValue('email', profile.email);
      // Email field is read-only when coming from OAuth
      setEmailReadOnly(true);
      setOauthProvider(profile.provider);
    }
  }
}, []);
```

In the **Personal Details** step:
- Email field is read-only (greyed out, tooltip: "Email provided by your Google/Microsoft account").
- Password step is **skipped** entirely for OAuth registrations.
- Avatar is pre-populated from provider but user can replace it.

```tsx
// Skip password step for OAuth registrations:
const steps = oauthProvider
  ? ['type', 'personal', 'musical', 'availability', 'teacher', 'package', 'summary']
  : ['type', 'personal', 'password', 'musical', 'availability', 'teacher', 'package', 'summary'];
```

---

## 7. Account Linking (Existing Email Users Adding OAuth)

Users who registered with email/password can link their Google/Microsoft account from their profile settings:

```tsx
// src/app/[locale]/dashboard/settings/account/page.tsx
<div className="space-y-4">
  <h3>{t('Settings.linkedAccounts')}</h3>
  
  {(['google', 'microsoft'] as const).map(provider => {
    const linked = user.oauthProviders?.find(p => p.provider === provider);
    return (
      <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          {provider === 'google' ? <GoogleIcon /> : <MicrosoftIcon />}
          <div>
            <p className="font-medium">{provider === 'google' ? 'Google' : 'Microsoft'}</p>
            {linked && (
              <p className="text-sm text-muted-foreground">{linked.providerEmail}</p>
            )}
          </div>
        </div>
        {linked ? (
          <Button variant="outline" size="sm" onClick={() => unlinkProvider(provider)}>
            {t('Settings.unlink')}
          </Button>
        ) : (
          <Button size="sm" onClick={() => linkProvider(provider)}>
            {t('Settings.link')}
          </Button>
        )}
      </div>
    );
  })}
</div>
```

---

## 8. Environment Variables Required

```bash
# .env.local additions:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_client_id
MICROSOFT_CLIENT_ID=your_azure_app_client_id
MICROSOFT_CLIENT_SECRET=your_azure_client_secret
MICROSOFT_TENANT_ID=common   # 'common' for any Microsoft account
```

---

## 9. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | User clicks "Sign in with Google" | Google OAuth popup appears |
| 2 | New user signs in with Google | Redirected to registration wizard with name/email pre-filled |
| 3 | Existing user signs in with Google (same email) | Logged in directly, no wizard |
| 4 | OAuth new user completes wizard | Account created, OAuth provider linked |
| 5 | Email/password user links Google from settings | Google icon shows linked email |
| 6 | Same email exists with password (conflict) | Toast: "Account exists, sign in with password" |
| 7 | OAuth registration skips password step | No password field shown in wizard |
| 8 | Admin account — sign in with Google | Works if admin email matches OAuth email, no new account created |
| 9 | Microsoft sign-in flow | Same as Google — identical behavior |
