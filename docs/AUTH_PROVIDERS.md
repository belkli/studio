# Auth Provider Configuration

Switch the auth provider via the `AUTH_PROVIDER` environment variable.

## Firebase (default)

```env
AUTH_PROVIDER=firebase

# Firebase Admin (server-side)
FIREBASE_SERVICE_ACCOUNT_KEY=<base64-encoded service account JSON>

# Firebase Client (browser)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## Supabase

```env
AUTH_PROVIDER=supabase

# Supabase Admin (server-side)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=<service_role key>

# Supabase Browser (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Local dev (no auth)

Leave all auth env vars unset. The app will use the dev bypass (site_admin role injected automatically).

## Custom Claims (Supabase)

For Supabase, user roles are stored in `app_metadata`:
```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "teacher", "conservatoriumId": "cons-1", "approved": true}'::jsonb
WHERE id = '<user-uuid>';
```

Or via the Cloud Function equivalent -- a Supabase Edge Function triggered by `auth.users` changes.
