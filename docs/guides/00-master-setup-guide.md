# Harmonia -- Complete Setup Guide (For Dummies)

> **Version:** 2.0 | **Date:** 2026-03-14
> **Audience:** Non-technical founder / first-time deployer
> **Total time:** ~11 hours across 6 phases (can be spread over several days)
> **Companion guides:** [`01-security-setup-guide.md`](01-security-setup-guide.md) (full RLS SQL), [`03-onboarding-legal-guide.md`](03-onboarding-legal-guide.md) (email templates, scripts)

---

## Table of Contents

- [How to Use This Guide](#how-to-use-this-guide)
- [Phase 0: Prerequisites & Account Creation](#phase-0-prerequisites--account-creation) -- 30 min
- [Phase 1: Stage Environment Setup](#phase-1-stage-environment-setup) -- 2 hours
- [Phase 2: CI/CD Pipeline](#phase-2-cicd-pipeline) -- 1 hour
- [Phase 3: Recommended Tools](#phase-3-recommended-tools) -- 1 hour
- [Phase 4: Admin Onboarding](#phase-4-admin-onboarding) -- 2 hours
- [Phase 5: Production Environment](#phase-5-production-environment) -- 3 hours
- [Phase 6: Security Hardening](#phase-6-security-hardening) -- 2 hours
- [Appendix A: Environment Variables Reference](#appendix-a-environment-variables-reference)
- [Appendix B: Supabase RLS Policies (Full SQL)](#appendix-b-supabase-rls-policies-full-sql)
- [Appendix C: GitHub Actions Workflow (Full YAML)](#appendix-c-github-actions-workflow-full-yaml)
- [Appendix D: Admin Account Seed Script](#appendix-d-admin-account-seed-script)
- [Appendix E: Troubleshooting](#appendix-e-troubleshooting)
- [Appendix F: Free Tier Limits](#appendix-f-free-tier-limits)
- [Appendix G: Credential-Free Setup with Claude Code](#appendix-g-credential-free-setup-with-claude-code)

---

## How to Use This Guide

- Every `[ ]` checkbox = one action to complete
- Every `command` in a code block = copy-paste into your terminal
- Every link = click to open in your browser
- Time estimates next to each section header
- Difficulty: Easy | Medium | Hard

**Important:** This guide targets **Vercel + Supabase** (no Firebase). The existing codebase already supports `DB_BACKEND=supabase` and `AUTH_PROVIDER=supabase`. We are NOT using Firebase for deployment. See [`docs/AUTH_PROVIDERS.md`](../AUTH_PROVIDERS.md) for details on switching between Firebase and Supabase auth.

**Phase 1 = Demo/Stage only.** The site will be behind a gate -- only people with a link and password can see it. Everyone else sees a redirect.

### Related Project Documentation

This guide consolidates and references the following existing docs:

| Document | Path | What it covers |
|----------|------|----------------|
| Auth Providers | [`docs/AUTH_PROVIDERS.md`](../AUTH_PROVIDERS.md) | Switching between Firebase and Supabase auth, custom claims SQL |
| Deployment (Firebase) | [`docs/operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md) | Existing Firebase deployment guide (superseded for Vercel here) |
| Legal Readiness | [`docs/operations/LEGAL-READINESS.md`](../operations/LEGAL-READINESS.md) | PDPPA compliance, IS 5568, legal checklist (score: 85/100) |
| Demo Access | [`docs/product/DEMO-ACCESS.md`](../product/DEMO-ACCESS.md) | Token-based demo gate design, proxy.ts changes, 3 options compared |
| PRD | [`docs/product/PRD.md`](../product/PRD.md) | Production readiness score, P0/P1 blockers, persona feature gaps |
| User Guide | [`docs/product/User-Guide.md`](../product/User-Guide.md) | End-user guide for 8 personas |
| MSA Template | [`docs/contracts/MSA-TEMPLATE.md`](../contracts/MSA-TEMPLATE.md) | Master Services Agreement template for conservatoriums |
| Policies Analysis | [`docs/legal/conservatorium-policies-analysis.md`](../legal/conservatorium-policies-analysis.md) | Analysis of 13 real conservatorium PDF bylaws |
| Price Model | [`docs/legal/standardized-price-model.md`](../legal/standardized-price-model.md) | Standard pricing ranges from corpus analysis |
| Registration Agreement | [`docs/legal/standard-registration-agreement-draft.md`](../legal/standard-registration-agreement-draft.md) | Hebrew enrollment agreement template |
| Architecture | [`docs/architecture/`](../architecture/) | 8-file architecture docs (product context through execution status) |
| SDD: IAM | [`docs/sdd/features/SDD-01-Identity-and-Access.md`](../sdd/features/SDD-01-Identity-and-Access.md) | Identity & access management design |
| SDD: OAuth | [`docs/sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md`](../sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md) | OAuth social sign-in implementation details |
| SDD: Multi-Backend | [`docs/sdd/fixes/SDD-FIX-19-MultiBackend-Database.md`](../sdd/fixes/SDD-FIX-19-MultiBackend-Database.md) | Multi-backend DB adapter architecture |
| Auth Abstraction Plan | [`docs/plans/2026-03-09-auth-provider-abstraction.md`](../plans/2026-03-09-auth-provider-abstraction.md) | Auth provider abstraction implementation plan |

---

## Phase 0: Prerequisites & Account Creation -- 30 min -- Easy

### 0.1 What You Need Before Starting

- [ ] **A computer** with a web browser (Chrome, Firefox, or Edge recommended)
- [ ] **Node.js 20+** installed -- download from https://nodejs.org/en/download (pick the LTS version, click the big green button, run the installer)
  - Verify: open a terminal and type `node --version` -- you should see `v20.x.x` or higher
- [ ] **npm** (comes with Node.js) -- verify: `npm --version` -- should show `10.x.x` or higher
- [ ] **Git** installed -- download from https://git-scm.com/downloads
  - Verify: `git --version` -- should show `git version 2.x.x`
- [ ] **A GitHub account** -- if you do not have one, go to https://github.com/join and create one (free)
- [ ] **The Harmonia repository** cloned to your computer:
  ```bash
  git clone https://github.com/YOUR_USERNAME/studio.git
  cd studio
  npm install
  ```
  Expected output: a long list of packages being installed, ending with `added XXX packages`

### 0.2 Create a Supabase Account

- [ ] Step 1: Go to https://supabase.com
- [ ] Step 2: Click the green **"Start your project"** button in the top right
- [ ] Step 3: Click **"Continue with GitHub"** (recommended -- links to your GitHub account)
- [ ] Step 4: Authorize Supabase to access your GitHub account by clicking the green **"Authorize supabase"** button
- [ ] Step 5: You should now see the Supabase Dashboard with a page that says "Your projects" -- it will be empty. That is expected.

### 0.3 Create a Vercel Account

- [ ] Step 1: Go to https://vercel.com
- [ ] Step 2: Click **"Sign Up"** in the top right
- [ ] Step 3: Click **"Continue with GitHub"** (recommended)
- [ ] Step 4: Authorize Vercel to access your GitHub account
- [ ] Step 5: Choose the **"Hobby"** plan (free) -- click **"Continue"**
- [ ] Step 6: You should see the Vercel Dashboard with "Let's build something new" -- that is expected.

### 0.4 Verify Local Dev Works

Before deploying anything, confirm the app runs locally in mock mode:

- [ ] Step 1: Open a terminal in the `studio` directory
- [ ] Step 2: Run:
  ```bash
  npm run dev
  ```
- [ ] Step 3: Wait until you see `- Local: http://localhost:9002` in the output
- [ ] Step 4: Open http://localhost:9002 in your browser
- [ ] Step 5: You should see the Harmonia landing page in Hebrew with a hero section
- [ ] Step 6: Press `Ctrl+C` in the terminal to stop the server

If you see an error instead, check [Appendix E: Troubleshooting](#appendix-e-troubleshooting).

---

## Phase 1: Stage Environment Setup -- 2 hours -- Medium

### 1.1 Create Supabase Project (Stage)

- [ ] Step 1: Go to https://supabase.com/dashboard
- [ ] Step 2: Click the green **"New Project"** button
- [ ] Step 3: Fill in the form:
  - **Organization:** Select your default organization (or create one -- click "New Organization", name it "Harmonia")
  - **Project name:** `harmonia-stage`
  - **Database Password:** Generate a strong password -- click the **"Generate a password"** button. **SAVE THIS PASSWORD** somewhere safe (a password manager or a text file). You will need it later.
  - **Region:** Select **West Europe (Ireland) eu-west-1** -- closest to Israel while staying in the EU for PDPPA compliance (see [`docs/operations/LEGAL-READINESS.md`](../operations/LEGAL-READINESS.md) Section 1 for data residency requirements)
  - **Pricing Plan:** Free (sufficient for staging)
- [ ] Step 4: Click **"Create new project"**
- [ ] Step 5: Wait 1-2 minutes. The page will show "Setting up your project..." with a progress indicator. When it finishes, you will see the project dashboard.

### 1.2 Get Your Supabase Credentials

- [ ] Step 1: In the Supabase dashboard for `harmonia-stage`, click **"Project Settings"** (gear icon in the left sidebar, at the very bottom)
- [ ] Step 2: Click **"API"** in the left submenu under "Configuration"
- [ ] Step 3: You should see two sections: "Project URL" and "Project API keys"
- [ ] Step 4: Copy and save the following values:

| Value | Where to find it | Example |
|-------|------------------|---------|
| **Project URL** | Under "Project URL" -- a URL like `https://xxxx.supabase.co` | `https://abcdefgh.supabase.co` |
| **anon key** | Under "Project API keys" > `anon` `public` -- click the copy icon | `eyJhbGciOiJIUzI1NiIs...` |
| **service_role key** | Under "Project API keys" > `service_role` `secret` -- click the eye icon to reveal, then copy | `eyJhbGciOiJIUzI1NiIs...` |

**WARNING:** The `service_role` key has full admin access. Never expose it in client-side code or commit it to git.

### 1.3 Set Up Database Schema

The Harmonia Postgres schema lives in `scripts/db/schema.sql`. You need to run it against your Supabase database.

**Option A: Via Supabase SQL Editor (recommended for beginners)**

- [ ] Step 1: In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar (looks like a `>_` icon)
- [ ] Step 2: Click **"New query"** (top right)
- [ ] Step 3: Open the file `scripts/db/schema.sql` from your local Harmonia project in a text editor
- [ ] Step 4: Select ALL text (Ctrl+A), copy it (Ctrl+C)
- [ ] Step 5: Paste it into the SQL Editor in Supabase (Ctrl+V)
- [ ] Step 6: Click the green **"Run"** button (or press Ctrl+Enter)
- [ ] Step 7: You should see `Success. No rows returned` -- that means the tables were created

- [ ] Step 8: Repeat steps 2-7 for `scripts/db/seed.sql` (the seed data with 85 conservatoriums and test users)
- [ ] Step 9: Repeat steps 2-7 for `scripts/db/repertoire.seed.sql` (5,217 compositions)

**Option B: Via command line (if you have `psql` installed)**

```bash
# Get connection string from Supabase: Settings > Database > Connection string > URI
psql "postgresql://postgres.[PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" -f scripts/db/schema.sql
psql "postgresql://postgres.[PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" -f scripts/db/seed.sql
psql "postgresql://postgres.[PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" -f scripts/db/repertoire.seed.sql
```

### 1.4 Configure Supabase Auth

> **Reference:** [`docs/AUTH_PROVIDERS.md`](../AUTH_PROVIDERS.md) documents how the codebase switches between Firebase and Supabase auth. The custom claims SQL for setting roles via `app_metadata` is documented there. Also see [`docs/sdd/features/SDD-01-Identity-and-Access.md`](../sdd/features/SDD-01-Identity-and-Access.md) for the full IAM design.

- [ ] Step 1: In Supabase dashboard, click **"Authentication"** in the left sidebar
- [ ] Step 2: Click **"Providers"** in the submenu
- [ ] Step 3: Verify **Email** provider is enabled (it is by default)
- [ ] Step 4: Click on the **Email** provider to expand its settings:
  - **Enable email confirmations:** OFF (for staging; turn ON for production)
  - **Minimum password length:** 8
  - Click **"Save"**

### 1.5 Create Vercel Project

- [ ] Step 1: Go to https://vercel.com/dashboard
- [ ] Step 2: Click **"Add New..."** then **"Project"**
- [ ] Step 3: You should see "Import Git Repository". Find your `studio` repository and click **"Import"**
  - If you do not see it, click **"Configure GitHub App"** and grant Vercel access to the repository
- [ ] Step 4: On the "Configure Project" page:
  - **Project Name:** `harmonia-stage`
  - **Framework Preset:** Should auto-detect "Next.js" -- if not, select it from the dropdown
  - **Root Directory:** Leave as `.` (the default)
  - **Build Command:** Leave as default (`npm run build`)
  - **Output Directory:** Leave as default
- [ ] Step 5: **DO NOT click Deploy yet** -- first we need to add environment variables (next step)

### 1.6 Configure Environment Variables on Vercel

> **Reference:** The multi-backend database architecture is documented in [`docs/sdd/fixes/SDD-FIX-19-MultiBackend-Database.md`](../sdd/fixes/SDD-FIX-19-MultiBackend-Database.md). The `DB_BACKEND` and `AUTH_PROVIDER` env vars resolve adapters in `src/lib/db/index.ts` and `src/lib/auth/server-provider.ts` respectively.

Still on the Vercel "Configure Project" page (or go to Project Settings > Environment Variables):

- [ ] Step 1: Click **"Environment Variables"** to expand the section
- [ ] Step 2: Add each of the following variables one at a time (paste the name, paste the value, click "Add"):

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `DB_BACKEND` | `supabase` | Tells the app to use Supabase adapter |
| `AUTH_PROVIDER` | `supabase` | Tells auth to use Supabase instead of Firebase |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | From step 1.2 |
| `SUPABASE_SERVICE_KEY` | `eyJhbG...` (service_role key) | From step 1.2 -- the SECRET key |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Same URL, but public (client-side) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` (anon key) | From step 1.2 -- the PUBLIC key |
| `NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK` | `0` | Disable mock fallback in staging |
| `GEMINI_API_KEY` | (your Google AI key or `placeholder`) | Needed for AI flows; set placeholder if you do not have one yet |
| `GOOGLE_API_KEY` | (same as above or `placeholder`) | Used by Genkit |

- [ ] Step 3: For each variable, make sure **all 3 environments** are checked: Production, Preview, Development

### 1.7 Deploy First Version

- [ ] Step 1: Click the **"Deploy"** button on Vercel
- [ ] Step 2: Wait for the build to complete (3-5 minutes). You will see a build log.
  - Expected: Green checkmark with "Ready" status
  - If build fails, check the logs and see [Appendix E](#appendix-e-troubleshooting)
- [ ] Step 3: Click **"Visit"** to see your deployed site
- [ ] Step 4: You should see the Harmonia landing page at `https://harmonia-stage.vercel.app` (or similar URL)

### 1.8 Set Up Demo Gate (Access Protection)

> **Reference:** [`docs/product/DEMO-ACCESS.md`](../product/DEMO-ACCESS.md) contains the full design for the demo gate, comparing 3 options (Preview Channels, Vercel Protection, Custom Token Gate). Option C (custom token gate) is recommended and implemented via `DEMO_TOKENS` env var. The doc includes proxy.ts code changes, the demo gate page component, and per-conservatorium token tracking.

For Phase 1, we want the site behind a gate so only authorized people can see it. Vercel provides built-in password protection:

**Option A: Vercel Password Protection (requires Pro plan, $20/mo)**

- [ ] Step 1: Go to your Vercel project dashboard
- [ ] Step 2: Click **"Settings"** tab
- [ ] Step 3: Click **"Deployment Protection"** in the left menu
- [ ] Step 4: Under "Standard Protection", toggle **"Vercel Authentication"** to ON
- [ ] Step 5: Under "Protection Bypass", click **"Generate Bypass Link"**
- [ ] Step 6: Save this bypass link -- it is the link you share with authorized users

**Option B: Application-Level Demo Gate (free, recommended)**

The codebase supports a demo gate via the `DEMO_TOKENS` env var. This shows a password page before allowing access.

- [ ] Step 1: In Vercel Project Settings > Environment Variables, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DEMO_GATE_ENABLED` | `true` | Enables the gate |
| `DEMO_TOKENS` | `harmonia2026,reviewer-beta` | Comma-separated list of valid access tokens |

- [ ] Step 2: Redeploy: go to the "Deployments" tab, click the three-dot menu on the latest deployment, click **"Redeploy"**
- [ ] Step 3: Visit the site -- you should see a gate page asking for an access code
- [ ] Step 4: Enter `harmonia2026` -- you should be redirected to the landing page

Anyone without the code will not be able to access the application.

### 1.9 Create 85 Admin Accounts

Each of the 85 conservatoriums needs a pre-created admin account. We will use a script to create them in Supabase Auth.

See [Appendix D: Admin Account Seed Script](#appendix-d-admin-account-seed-script) for the full script.

- [ ] Step 1: Copy the script from Appendix D to a file named `scripts/seed-admins.mjs`
- [ ] Step 2: Set environment variables (do NOT commit these):
  ```bash
  export SUPABASE_URL="https://xxxx.supabase.co"
  export SUPABASE_SERVICE_KEY="eyJhbG..."
  ```
- [ ] Step 3: Run the script:
  ```bash
  node scripts/seed-admins.mjs
  ```
- [ ] Step 4: Expected output: 85 lines like `Created admin for cons-1: admin-cons-1@harmonia.co.il`
- [ ] Step 5: The script will generate a CSV file `admin-credentials.csv` with columns: `conservatorium_id, conservatorium_name, email, password`
- [ ] Step 6: **Secure this CSV file** -- it contains all admin passwords. Do NOT commit it to git.

### 1.10 Configure OAuth (Google/Microsoft)

> **Reference:** [`docs/sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md`](../sdd/fixes/SDD-FIX-17-OAuth-SocialSignIn.md) documents the OAuth social sign-in implementation. The codebase uses Supabase's redirect flow: Google maps to provider `'google'`, Microsoft maps to `'azure'` (see `src/lib/auth/supabase-provider.ts`).

**Google OAuth:**

- [ ] Step 1: Go to https://console.cloud.google.com
- [ ] Step 2: Create a new project or select an existing one
- [ ] Step 3: In the left sidebar, go to **APIs & Services** > **Credentials**
- [ ] Step 4: Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
- [ ] Step 5: If prompted to configure the consent screen:
  - User Type: **External**
  - App name: `Harmonia`
  - Support email: your email
  - Authorized domains: add `supabase.co`
  - Click **"Save and Continue"** through the remaining steps
- [ ] Step 6: Back on Credentials page, click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
  - Application type: **Web application**
  - Name: `Harmonia Stage`
  - Authorized redirect URIs: Add `https://xxxx.supabase.co/auth/v1/callback` (replace xxxx with your Supabase project ref)
  - Click **"Create"**
- [ ] Step 7: Copy the **Client ID** and **Client secret**
- [ ] Step 8: In Supabase Dashboard > Authentication > Providers:
  - Click **"Google"** to expand
  - Toggle it **ON**
  - Paste the Client ID and Client secret
  - Click **"Save"**

**Microsoft OAuth:**

- [ ] Step 1: Go to https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
- [ ] Step 2: Click **"+ New registration"**
- [ ] Step 3: Fill in:
  - Name: `Harmonia Stage`
  - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
  - Redirect URI: Web -- `https://xxxx.supabase.co/auth/v1/callback`
- [ ] Step 4: Click **"Register"**
- [ ] Step 5: Copy the **Application (client) ID** from the Overview page
- [ ] Step 6: Go to **Certificates & secrets** > **"+ New client secret"**
  - Description: `harmonia-stage`
  - Expires: 24 months
  - Click **"Add"**
  - Copy the **Value** (not the Secret ID)
- [ ] Step 7: In Supabase Dashboard > Authentication > Providers:
  - Click **"Azure (Microsoft)"** to expand
  - Toggle it **ON**
  - Paste the Client ID and Client secret
  - Click **"Save"**

### 1.11 Verify Everything Works

- [ ] Step 1: Visit your staging URL (e.g., `https://harmonia-stage.vercel.app`)
- [ ] Step 2: If demo gate is enabled, enter the access code
- [ ] Step 3: You should see the landing page with real conservatorium data (loaded from Supabase)
- [ ] Step 4: Click "Login" and try logging in with one of the admin accounts from the CSV
- [ ] Step 5: After login, you should see the admin dashboard
- [ ] Step 6: Verify the sidebar navigation works -- click through a few pages
- [ ] Step 7: Try the Hebrew/English language switch

Congratulations -- Stage environment is live!

---

## Phase 2: CI/CD Pipeline -- 1 hour -- Medium

> **Reference:** The existing `.github/workflows/ci.yml` (262 lines) targets Firebase Hosting with a 7-stage pipeline. This phase creates a parallel Vercel-focused workflow. See [`docs/operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md) Section 5 for the CI/CD pipeline design and [`docs/architecture/07-infrastructure.md`](../architecture/07-infrastructure.md) for infrastructure architecture.

### 2.1 GitHub Actions Workflow for Vercel

The existing `.github/workflows/ci.yml` targets Firebase. We need a Vercel-focused workflow.

- [ ] Step 1: Get your Vercel token:
  - Go to https://vercel.com/account/tokens
  - Click **"Create"**
  - Name: `github-actions`
  - Scope: Full Account
  - Click **"Create Token"**
  - Copy the token -- you will only see it once

- [ ] Step 2: Get your Vercel project and org IDs:
  - Go to your Vercel project settings
  - Scroll down -- you will see **"Project ID"** (a string like `prj_xxxx`)
  - Go to your Vercel team/account settings for **"Organization ID"** (or use `vercel link` CLI)

- [ ] Step 3: Add secrets to GitHub:
  - Go to your GitHub repository
  - Click **"Settings"** tab
  - Click **"Secrets and variables"** > **"Actions"** in the left sidebar
  - Click **"New repository secret"** for each:

| Secret Name | Value |
|-------------|-------|
| `VERCEL_TOKEN` | Your Vercel token from step 1 |
| `VERCEL_ORG_ID` | Your Vercel org ID from step 2 |
| `VERCEL_PROJECT_ID` | Your Vercel project ID from step 2 |

### 2.2 Create Vercel CI/CD Workflow

- [ ] Step 1: Create the file `.github/workflows/vercel-deploy.yml` (see [Appendix C](#appendix-c-github-actions-workflow-full-yaml) for the full file)

The workflow does:
1. **On every PR:** Lint + Typecheck + Unit tests -- must ALL pass
2. **On merge to main:** Deploy to staging (Vercel preview)
3. **On tag `v*`:** Deploy to production

### 2.3 Test Gate (Block Deploy on Test Failure)

The CI workflow includes a `test` job that must pass before the `deploy` job runs. This is enforced by the `needs: [lint, test]` dependency in the workflow.

- [ ] Step 1: Create a test PR to verify the pipeline:
  ```bash
  git checkout -b test-ci-pipeline
  echo "// test" >> src/lib/vat.ts
  git add src/lib/vat.ts
  git commit -m "test: verify CI pipeline"
  git push -u origin test-ci-pipeline
  ```
- [ ] Step 2: Go to your GitHub repository and you should see a yellow banner: "test-ci-pipeline had recent pushes"
- [ ] Step 3: Click **"Compare & pull request"**
- [ ] Step 4: Create the PR -- the CI checks should start running
- [ ] Step 5: Wait for all checks to pass (green checkmarks)
- [ ] Step 6: Close the PR without merging (this was just a test)

### 2.3 Preview Deployments

Vercel automatically creates preview deployments for every PR. No additional configuration needed.

- [ ] Step 1: Verify in Vercel Project Settings > Git:
  - **Preview Deployments:** Enabled (default)
  - **Production Branch:** `main`
- [ ] Step 2: Each PR will get a unique preview URL like `https://harmonia-stage-xxxx-your-team.vercel.app`

---

## Phase 3: Recommended Tools -- 1 hour -- Easy

> **Reference:** [`docs/product/PRD.md`](../product/PRD.md) identifies P0/P1 blockers for production readiness (baseline score: 35/100). Error monitoring (Sentry) and uptime monitoring are among the critical items. The PRD also lists Cardcom (payments), Twilio (SMS), and Cloud Functions as P1 items to add later.

### 3.1 Sentry (Error Monitoring)

**What it does:** Catches JavaScript errors in production and notifies you with full stack traces.

- [ ] Step 1: Go to https://sentry.io/signup/
- [ ] Step 2: Create an account (free tier: 5,000 errors/mo)
- [ ] Step 3: Create a project:
  - Platform: **Next.js**
  - Project name: `harmonia`
- [ ] Step 4: Install the SDK:
  ```bash
  npx @sentry/wizard@latest -i nextjs
  ```
  This will:
  - Install `@sentry/nextjs`
  - Create `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
  - Update `next.config.ts` with Sentry wrapper
- [ ] Step 5: Add `SENTRY_DSN` to Vercel environment variables (the wizard will show you the DSN)
- [ ] Step 6: Deploy and verify errors appear in Sentry dashboard

### 3.2 UptimeRobot (Uptime Monitoring)

**What it does:** Pings your site every 5 minutes and alerts you if it goes down.

- [ ] Step 1: Go to https://uptimerobot.com/ and create an account (free: 50 monitors)
- [ ] Step 2: Click **"+ Add New Monitor"**
- [ ] Step 3: Configure:
  - Monitor Type: **HTTP(S)**
  - Friendly Name: `Harmonia Stage`
  - URL: `https://harmonia-stage.vercel.app`
  - Monitoring Interval: **5 minutes**
- [ ] Step 4: Under Alert Contacts, add your email
- [ ] Step 5: Click **"Create Monitor"**
- [ ] Step 6: Repeat for production URL when ready

### 3.3 Resend (Transactional Email)

**What it does:** Sends transactional emails (welcome, password reset, notifications).

- [ ] Step 1: Go to https://resend.com and sign up (free: 100 emails/day)
- [ ] Step 2: Verify your email domain (or use their provided `onboarding@resend.dev` for testing)
- [ ] Step 3: Go to **API Keys** and create a new key
- [ ] Step 4: Add to Vercel env vars:

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | `re_xxxx...` |
| `RESEND_FROM_EMAIL` | `noreply@yourdomain.com` (or `onboarding@resend.dev` for testing) |

### 3.4 PostHog (Analytics)

**What it does:** Product analytics -- tracks user behavior, feature usage, funnels.

- [ ] Step 1: Go to https://posthog.com and sign up (free: 1M events/mo)
- [ ] Step 2: Create a project, select **EU region** for PDPPA compliance (see [`docs/operations/LEGAL-READINESS.md`](../operations/LEGAL-READINESS.md) for sub-processor register requirements)
- [ ] Step 3: Copy the **Project API Key** (public, safe for client)
- [ ] Step 4: Add to Vercel env vars:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_xxxx...` |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.posthog.com` |

### 3.5 Pinecone (Vector DB for AI Features)

**What it does:** Enables semantic search for the help assistant and composition suggestions.

- [ ] Step 1: Go to https://www.pinecone.io/ and sign up (free: 1 index, 100K vectors)
- [ ] Step 2: Create an index:
  - Name: `harmonia-help`
  - Dimensions: `768` (for Gemini embeddings)
  - Metric: **Cosine**
  - Region: **EU (aws-eu-west-1)**
- [ ] Step 3: Copy your **API Key** from the Pinecone dashboard
- [ ] Step 4: Add to Vercel env vars:

| Variable | Value |
|----------|-------|
| `PINECONE_API_KEY` | `xxxx...` |
| `PINECONE_INDEX_NAME` | `harmonia-help` |
| `PINECONE_ENVIRONMENT` | `aws-eu-west-1` |

### 3.6 Clerk vs Supabase Auth (Comparison)

| Feature | Supabase Auth | Clerk |
|---------|--------------|-------|
| **Pricing** | Free (50K MAU) | Free up to 10K MAU; $25/mo after |
| **Email/Password** | Yes | Yes |
| **Google OAuth** | Yes | Yes (easier setup) |
| **Microsoft OAuth** | Yes | Yes (easier setup) |
| **Magic Links** | Yes | Yes |
| **Phone OTP** | Yes | Yes |
| **Pre-built UI** | Basic | Beautiful, customizable |
| **Multi-tenant** | Manual (via app_metadata) | Built-in "Organizations" |
| **Session management** | JWT-based | Session tokens + JWTs |
| **Integration effort** | Already integrated in codebase | Would require rewrite of auth layer |
| **Hebrew/RTL** | No built-in UI | Partial (customizable) |

**Recommendation:** Stay with **Supabase Auth** for now. The codebase already has a full implementation (`src/lib/auth/supabase-provider.ts`). The auth provider abstraction (`src/lib/auth/server-provider.ts`) allows swapping providers via `AUTH_PROVIDER` env var -- see [`docs/plans/2026-03-09-auth-provider-abstraction.md`](../plans/2026-03-09-auth-provider-abstraction.md) for the design. Migrating to Clerk would require a new adapter implementation.

### 3.7 Tool Recommendation Matrix

| Tool | Priority | Free Tier | Effort | Recommendation |
|------|----------|-----------|--------|----------------|
| **Sentry** | P0 (Critical) | 5K errors/mo | 15 min | MUST HAVE -- install before any user sees the app |
| **UptimeRobot** | P0 (Critical) | 50 monitors | 5 min | MUST HAVE -- set up immediately |
| **Resend** | P1 (Important) | 100 emails/day | 30 min | SHOULD HAVE -- needed for password reset and notifications |
| **PostHog** | P2 (Nice) | 1M events/mo | 20 min | NICE TO HAVE -- add before admin onboarding |
| **Pinecone** | P3 (Future) | 100K vectors | 1 hour | LATER -- only needed when AI help assistant goes live |
| **Clerk** | P4 (Evaluate) | 10K MAU | 2+ days | NOT NOW -- only if Supabase Auth proves inadequate |

---

## Phase 4: Admin Onboarding -- 2 hours -- Easy

> **Reference:** The following docs are essential for admin onboarding:
> - [`docs/product/User-Guide.md`](../product/User-Guide.md) -- end-user guide covering all 8 personas (use as basis for admin quickstart PDF)
> - [`docs/contracts/MSA-TEMPLATE.md`](../contracts/MSA-TEMPLATE.md) -- Master Services Agreement template (send to conservatoriums for legal review)
> - [`docs/legal/standard-registration-agreement-draft.md`](../legal/standard-registration-agreement-draft.md) -- Hebrew enrollment agreement for students (conservatoriums customize via addendum)
> - [`docs/legal/standardized-price-model.md`](../legal/standardized-price-model.md) -- standard pricing ranges from analysis of 13 real conservatorium bylaws
> - [`docs/legal/conservatorium-policies-analysis.md`](../legal/conservatorium-policies-analysis.md) -- comparative analysis of real conservatorium PDF bylaws

### 4.1 Admin Account Strategy & Password Format

There are 85 conservatorium administrators listed in `docs/data/constadmin.json`. Each needs:
- A Supabase Auth account (email/password)
- A Harmonia user profile with role `conservatorium_admin` and the correct `conservatoriumId`
- A unique, memorable but secure password

**Password format:** `Cons{id}-{Location3Chars}-{random4hex}`

Examples:
- `Cons15-Hod-a7f2` (Hod HaSharon, ID 15)
- `Cons66-Kir-3e8b` (Kiryat Ono, ID 66)
- `Cons84-Tel-c5d1` (Tel Aviv ICM, ID 84)

This format is 16+ characters, contains uppercase/lowercase/digits/symbols, unique per conservatorium, and readable enough to type from an email.

The mapping is: `constadmin.json` ID `N` maps to Harmonia `conservatoriumId = cons-N`. The existing `src/lib/data.ts` uses the same scheme.

If you ran the seed script in Phase 1.9, you already have credentials. If not, run the script now (see [Appendix D](#appendix-d-admin-account-seed-script)).

**Security checklist for credentials:**

- [ ] Add credential output files to `.gitignore` immediately
- [ ] Store the credentials file in a password manager (1Password, Bitwarden) or encrypted vault
- [ ] Delete the local file after distributing credentials to admins
- [ ] Rotate all passwords after the demo period ends
- [ ] Never send credentials in the same channel as the login URL (split between email + SMS if possible)

### 4.2 Create Welcome Email (Hebrew RTL)

| Field | Value |
|---|---|
| **Subject (Hebrew)** | ברוכים הבאים להרמוניה -- גישה לסביבת הדמו |
| **Subject (English)** | Welcome to Harmonia -- Demo Environment Access |
| **From** | Harmonia Team `<noreply@harmonia.co.il>` |
| **Reply-To** | `support@harmonia.co.il` |

- [ ] Step 1: Save the HTML email template as `docs/guides/welcome-email-template.html`
  - The template uses RTL layout (`dir="rtl" lang="he"`), Harmonia's indigo branding
  - Placeholders: `{{ADMIN_NAME}}`, `{{ADMIN_EMAIL}}`, `{{PASSWORD}}`, `{{LOGIN_URL}}`
  - Key sections: indigo gradient header, LTR credentials box, CTA button, feature highlights, amber demo disclaimer, footer
  - See `docs/guides/03-onboarding-legal-guide.md` Section 2.2 for the full HTML template
- [ ] Step 2: Run `DRY_RUN=true npx tsx scripts/send-welcome-emails.ts` to preview all 85 emails
- [ ] Step 3: Verify RTL renders correctly in Gmail, Outlook, and Apple Mail
- [ ] Step 4: Send a test email to yourself first
- [ ] Step 5: Get approval from project lead before sending to all 85 admins

**Email sending options:**
- **Resend** (recommended -- see Phase 3.3): API-based, 100 emails/day free tier
- **SendGrid:** Alternative with higher free tier
- **Gmail mail merge:** For manual sending in batches

### 4.3 Create PDF Presentation with Screenshots

Create a 6-page PDF (use Canva, Google Slides, or Figma) to attach to the welcome email:

| Page | Title | Content |
|------|-------|---------|
| 1 | ברוכים הבאים להרמוניה | Logo + hero screenshot + "מערכת ניהול דיגיטלית שתחליף ניהול בגיליונות, WhatsApp, ונייר" |
| 2 | כניסה למערכת | Screenshot of login page with fields highlighted + language switch note |
| 3 | לוח הבקרה שלך | Dashboard screenshot with callouts: A. תלמידים B. שיעורים C. אישורים D. חשבוניות |
| 4 | יכולות עיקריות | 4 cards: students/teachers, scheduling, billing/VAT, repertoire (5,000+ compositions) |
| 5 | מה הלאה? | Timeline: Phase 1 (demo now) -> Phase 2 (feedback 2-4 weeks) -> Phase 3 (real data) -> Phase 4 (go-live) |
| 6 | צור קשר | Email, phone, hours (Sun-Thu 09:00-17:00), in-app help, feedback form |

- [ ] Take actual screenshots from the staging environment (logged in as admin)
- [ ] Use RTL layout for all slides
- [ ] Export as PDF (A4 landscape): `docs/guides/harmonia-admin-intro-he.pdf`
- [ ] Create English version: `docs/guides/harmonia-admin-intro-en.pdf`
- [ ] Review with project lead before distribution

### 4.4 Send Onboarding Emails

- [ ] Step 1: Run `DRY_RUN=true npx tsx scripts/send-welcome-emails.ts` to preview
- [ ] Step 2: Send a test email to yourself first
- [ ] Step 3: Run the script without DRY_RUN to send all 85 emails
- [ ] Step 4: Attach the PDF quickstart guide to each email (or host on a public URL)
- [ ] Step 5: Track delivery in a spreadsheet

### 4.5 Legal Review of Demo Data

> **Reference:** See [`docs/legal/conservatorium-policies-analysis.md`](../legal/conservatorium-policies-analysis.md) for findings from 13 real conservatorium PDF bylaws. All lack DSAR mechanisms and proper PDPPA compliance. The [`docs/operations/LEGAL-READINESS.md`](../operations/LEGAL-READINESS.md) tracks the overall legal readiness score (currently 85/100).

**4.5.1 Synthetic Data Verification**

Before any admin touches the demo, verify that NO real PII is present:

- [ ] **Student names** -- confirm all names in `src/lib/data.ts` are fictional (they are: e.g. "David HaMelech", "Miriam Cohen")
- [ ] **Parent names** -- confirm all parent names are fictional
- [ ] **ID numbers** -- confirm no real Israeli ID numbers (Teudat Zehut) appear anywhere in mock data
- [ ] **Email addresses** -- confirm all test emails use `@example.com` or `@harmonia.local` (non-deliverable)
- [ ] **Phone numbers** -- confirm all phone numbers are fictional (`050-000-XXXX` pattern)
- [ ] **Teacher names** -- the 484 directory teachers use real names scraped from conservatorium public websites. This is acceptable for the private demo (shown only to that conservatorium's admin to demonstrate "this is how YOUR school would look"). Teachers will register themselves in production -- scraped data is NEVER published to the internet.
- [ ] **Teacher photos** -- some are hotlinked from external URLs (alumahod.com, teo.org.il). These are for demo visualization only. In production, teachers upload their own photos.
- [ ] **Admin data** -- `constadmin.json` contains real manager names, emails, and phone numbers; verify each admin can only see their OWN conservatorium's data
- [ ] **Right to removal** -- any teacher or admin who objects to being in the demo can request removal. Add contact email to demo disclaimer.
- [ ] **Privacy policy** (`/privacy`) is up to date with sub-processors table
- [ ] **Terms of service** (`/terms`) page exists

**4.5.2 Demo Disclaimer Banner**

Add a persistent banner to the staging environment:

- [ ] Set `NEXT_PUBLIC_IS_DEMO=true` in staging Vercel environment variables
- [ ] Add demo banner component to root layout (amber banner, cannot be dismissed):

```tsx
{process.env.NEXT_PUBLIC_IS_DEMO === 'true' && (
  <div className="fixed top-0 inset-x-0 z-[9999] bg-amber-500 text-amber-950
                  text-center text-sm font-medium py-1.5 px-4">
    סביבת הדגמה -- המידע מבוסס על מקורות ציבוריים ונועד להדגמה בלבד. לבקשת הסרה: demo@harmonia.co.il
    &nbsp;|&nbsp;
    Demo environment -- data sourced from public websites for demonstration only. Removal requests: demo@harmonia.co.il
  </div>
)}
```

- [ ] Verify banner is visible on all pages (dashboard, settings, public pages)
- [ ] Verify banner does NOT appear in production

**4.5.3 Privacy Notice for Demo Testers**

Admins must acknowledge before using the demo. Key points:

1. Demo contains synthetic data only -- no real student/teacher/parent PII
2. Usage analytics (pages, clicks) collected anonymously for platform improvement
3. Do NOT enter real PII (ID numbers, credit cards, medical info) into the demo
4. Demo may reset periodically -- all changes may be lost
5. Privacy questions: `privacy@harmonia.co.il`

- [ ] Add privacy notice to demo gate page
- [ ] Add consent checkboxes: TOU acceptance, usage analytics, feedback collection
- [ ] Store consent records in database (reuse existing `ConsentRecord` type)

**4.5.4 Demo Data Retention**

| Item | Retention | Action |
|------|-----------|--------|
| Demo user accounts | Until demo period ends (max 90 days) | Delete all Supabase Auth accounts |
| Usage analytics | 90 days | Auto-expire in analytics platform |
| Feedback submissions | Indefinite (consented) | Retain for product improvement |
| Demo access cookies | 30 days (auto-expire) | Cookie `maxAge` handles this |
| Staging database | Reset between demo rounds | Run `npm run db:reset` |

**4.5.5 Legal Compliance Cross-Reference**

Current score from `docs/operations/LEGAL-READINESS.md`: **85/100**

| Area | Demo Impact | Action for Demo |
|------|-------------|-----------------|
| PDPPA | Demo uses synthetic data -- lower risk | Add demo disclaimer |
| Consumer Protection | No real transactions in demo | N/A for demo |
| Accessibility (IS 5568) | Same code as production | Ensure accessibility panel works |
| Contractual | Demo TOU suffices | Draft lightweight TOU |
| IP | Same compositions library | Metadata only -- no risk |
| Digital Signatures | Demo signatures are tests | Add "demo" watermark to signed PDFs |
| Data Residency | Supabase EU region (eu-west-1) | Document staging data location |

**4.5.6 Pre-Launch Legal Checklist (Demo vs Production)**

**Must complete before demo launch:**

- [ ] Verify NO real student PII in demo data
- [ ] Add demo disclaimer banner to staging
- [ ] Draft demo Terms of Use
- [ ] Generate and distribute admin credentials securely
- [ ] Test demo gate with 3 pilot admins

**Must complete before production launch:**

- [ ] Register database with Israeli Registrar of Databases (ILITA)
- [ ] Appoint Data Security Officer (DPO)
- [ ] Complete security risk assessment
- [ ] Have MSA template ([`docs/contracts/MSA-TEMPLATE.md`](../contracts/MSA-TEMPLATE.md)) reviewed by Israeli lawyer
- [ ] Draft production Terms of Service
- [ ] Have Privacy Policy reviewed by privacy lawyer
- [ ] Create DPA template for conservatoriums
- [ ] Commission WCAG 2.1 AA accessibility audit (IS 5568)
- [ ] Sign DPAs with sub-processors (Supabase, Vercel, Sentry, etc.)
- [ ] Deploy Supabase RLS policies in production (see Phase 6)
- [ ] Confirm Supabase data residency (eu-west-1)
- [ ] Obtain professional liability (E&O) and cyber liability insurance
- [ ] Set up Google OAuth consent screen verification (2-6 weeks lead time)

---

## Phase 5: Production Environment -- 3 hours -- Hard

> **Reference:** [`docs/operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md) contains the existing deployment guide (Firebase-focused, 549 lines). This phase adapts it for Vercel + Supabase. See [`docs/architecture/07-infrastructure.md`](../architecture/07-infrastructure.md) for infrastructure architecture and [`docs/architecture/08-execution-status.md`](../architecture/08-execution-status.md) for current execution status.

### 5.1 Create Production Supabase Project

- [ ] Step 1: Go to https://supabase.com/dashboard
- [ ] Step 2: Click **"New Project"**
- [ ] Step 3: Fill in:
  - **Project name:** `harmonia-prod`
  - **Database Password:** Generate a NEW strong password (different from staging). **SAVE IT.**
  - **Region:** Same as staging (**West Europe / eu-west-1**)
  - **Pricing Plan:** Free to start; upgrade to Pro ($25/mo) when you have paying customers
- [ ] Step 4: Click **"Create new project"**
- [ ] Step 5: Run the schema migration (same as Phase 1.3 but against the production database)
- [ ] Step 6: Run the seed data (only conservatorium data -- NOT test students/teachers)

### 5.2 Create Production Vercel Project

- [ ] Step 1: In Vercel dashboard, click **"Add New..."** > **"Project"**
- [ ] Step 2: Import the same GitHub repository
- [ ] Step 3: Name it `harmonia-prod`
- [ ] Step 4: Add ALL environment variables (see [Appendix A](#appendix-a-environment-variables-reference)) pointing to the PRODUCTION Supabase project
- [ ] Step 5: Deploy

### 5.3 Domain Setup (When Acquired)

When you have a domain (e.g., `harmonia.co.il`):

- [ ] Step 1: In Vercel Project (prod) > Settings > Domains
- [ ] Step 2: Click **"Add"** and enter your domain
- [ ] Step 3: Vercel will show DNS records to configure:
  - **A Record:** `76.76.21.21` (for root domain)
  - **CNAME Record:** `cname.vercel-dns.com` (for `www` subdomain)
- [ ] Step 4: Go to your domain registrar and add these DNS records
- [ ] Step 5: Wait for DNS propagation (can take up to 48 hours, usually 10-30 minutes)
- [ ] Step 6: Vercel will auto-provision an SSL certificate

### 5.4 Production RLS Policies

> **Reference:** [`docs/architecture/06-security.md`](../architecture/06-security.md) documents the security architecture including RLS policy design, role-based access control, and the service_role bypass pattern used by Server Actions.

RLS policies are now embedded in `scripts/db/schema.sql` and applied automatically when you run the schema. **No separate RLS migration step is needed.** To verify, run: `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;` — result must be empty.

- [ ] Step 1: Confirm `scripts/db/schema.sql` was applied (it includes all RLS helper functions, `ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, and all policies)
- [ ] Step 2: Verify in Supabase Dashboard > Authentication > Policies that all tables show policies
- [ ] Step 3: Run the verification query above in Supabase SQL Editor — result must be empty

### 5.5 Production Auth Configuration

- [ ] Step 1: In production Supabase > Authentication > Settings:
  - **Enable email confirmations:** ON
  - **Enable double confirm email changes:** ON
  - **Minimum password length:** 10
- [ ] Step 2: Configure Google and Microsoft OAuth (same steps as 1.10, but with production redirect URLs)
- [ ] Step 3: Set up email templates:
  - Authentication > Email Templates
  - Customize the confirm email, reset password, and magic link templates with Harmonia branding

### 5.6 Production CI/CD

The GitHub Actions workflow from Phase 2 handles production deploys via git tags:

- [ ] Step 1: Add production secrets to GitHub:

| Secret Name | Value |
|-------------|-------|
| `VERCEL_TOKEN_PROD` | (can reuse same token or create a new one) |
| `VERCEL_ORG_ID_PROD` | Your Vercel org ID |
| `VERCEL_PROJECT_ID_PROD` | The production project ID |

- [ ] Step 2: To deploy to production:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```
- [ ] Step 3: The workflow will run all tests, build, and deploy to production

### 5.7 Monitoring & Alerting

- [ ] Step 1: Add production URL to UptimeRobot (same as Phase 3.2)
- [ ] Step 2: Set up Sentry for the production environment:
  - Create a new Sentry environment called `production`
  - Set alert rules: email on every new error, Slack on error spike
- [ ] Step 3: Vercel has built-in analytics:
  - Go to Vercel Project > Analytics tab
  - Enable **Web Vitals** monitoring (free)
  - Enable **Speed Insights** (free on Hobby plan)

### 5.8 Backup & Recovery

**Supabase Pro plan ($25/mo) includes:**
- Daily automated backups
- Point-in-time recovery (PITR) up to 7 days

**For Free tier:**
- [ ] Step 1: Set up a manual backup script:
  ```bash
  # Run weekly via cron or manually
  pg_dump "postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" > backup-$(date +%Y%m%d).sql
  ```
- [ ] Step 2: Store backups securely (encrypted, offsite)

---

## Phase 6: Security Hardening -- 2 hours -- Hard

> **Reference:** The following docs contain critical security requirements:
> - [`docs/architecture/06-security.md`](../architecture/06-security.md) -- security architecture (RLS, auth, headers, proxy)
> - [`docs/operations/LEGAL-READINESS.md`](../operations/LEGAL-READINESS.md) -- PDPPA compliance checklist, IS 5568 accessibility, legal pre-launch items
> - [`docs/product/PRD.md`](../product/PRD.md) -- P0 blockers: Zod schemas, PDPPA, build error suppression; P1: Cardcom, Twilio, accessibility, digital signatures
> - [`docs/guides/01-security-setup-guide.md`](01-security-setup-guide.md) -- FULL security guide (2,061 lines) with table-by-table RLS SQL, 109 verification steps, and findings cross-reference

### 6.1 RLS Policies Overview

When `DB_BACKEND=supabase`, **all tables must have Row Level Security enabled**. The service role key (used by Server Actions) bypasses RLS, but any direct client-side Supabase queries do not. RLS is defense-in-depth.

RLS is now applied automatically by `schema.sql`. The helper functions (`harmonia_role()`, `harmonia_conservatorium_id()`, `is_site_admin()`, `is_conservatorium_admin()`) are defined in schema.sql. No manual step needed.

**Key policies summary:**

| Table | Who can read | Who can write |
|-------|-------------|---------------|
| `conservatoriums` | Public (landing page) | Own conservatorium admin, site_admin insert/delete |
| `users` | Own row; parent->child; teacher->assigned students; admin->conservatorium | Admins only; users update own profile (no role escalation) |
| `student_profiles` | Own; parent; assigned teacher; admin | Admins only |
| `teacher_profiles` | Own; public (if `available_for_new_students`); admin | Own; admin |
| `lessons` | Teacher; student; parent->child; admin | Teacher update own; admin insert/update; site_admin delete |
| `invoices` | Payer; parent->child invoices; admin | Admin only; site_admin delete |
| `consent_records` | Own; parent->child; site_admin | Insert own only; NO update/delete (immutable audit trail) |
| `compliance_logs` | Site_admin only | Insert (authenticated); NO update/delete (append-only) |
| `repertoire_library` | Public (approved); ministry/admin (all) | Ministry director + site_admin |
| `payroll_snapshots` | Own teacher; admin | Admin only; site_admin delete |

**Helper functions** (must be created FIRST before any policies):

```sql
-- Create these helpers first -- all RLS policies depend on them
CREATE OR REPLACE FUNCTION harmonia_role() RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'role', auth.jwt()->>'role');
$$;

CREATE OR REPLACE FUNCTION harmonia_conservatorium_id() RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(auth.jwt()->'app_metadata'->>'conservatoriumId', auth.jwt()->>'conservatoriumId');
$$;

CREATE OR REPLACE FUNCTION is_site_admin() RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT harmonia_role() IN ('SITE_ADMIN', 'site_admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION is_conservatorium_admin() RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT harmonia_role() IN (
    'CONSERVATORIUM_ADMIN', 'conservatorium_admin',
    'DELEGATED_ADMIN', 'delegated_admin',
    'SITE_ADMIN', 'site_admin', 'superadmin'
  );
$$;
```

- [ ] No manual step needed — RLS is applied automatically when `scripts/db/schema.sql` is run
- [ ] Verify with: `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;` — result should be **empty**

### 6.2 Parent-Child Data Isolation

Parent-child links: `student_profiles.parent_id -> users.id`. Isolation is enforced at THREE layers:

| Layer | Mechanism | File |
|-------|-----------|------|
| **Database (RLS)** | Every SELECT policy includes `parent_id = auth.uid()` check | Appendix B |
| **Server Actions** | `requireRole()` + explicit ownership checks | `src/lib/auth-utils.ts` |
| **Client UI** | `useAuth()` filters by current user relationships | `src/providers/use-auth.tsx` |

- [ ] Verify: A parent can ONLY see data for students where `student_profiles.parent_id = parent.uid`
- [ ] Verify: A parent CANNOT see another parent's children by guessing student IDs
- [ ] Verify: A teacher can ONLY see students assigned via `teacher_assignments`
- [ ] Verify: A teacher from cons-15 CANNOT see students from cons-66
- [ ] Verify: `conservatorium_admin` can see ALL users in their conservatorium but NONE in others
- [ ] Verify: Under-13 students have no login credentials; the parent is the authenticated actor

### 6.3 API Security

**Server Action auth audit** -- all actions must use `withAuth()` or `requireRole()`:

- [ ] Audit every file in `src/app/actions/` and confirm auth wrapping:

| Action File | Auth Method |
|-------------|-------------|
| `consent.ts` | `requireRole()` / `withAuth()` + ownership check |
| `dsar.ts` | `withAuth()` |
| `billing.ts` | `withAuth()` |
| `translate.ts` | Verify role check |
| `signatures.ts` | `requireRole(signing roles)` |
| All others | `withAuth()` or `requireRole()` |

- [ ] Verify no Server Action constructs SQL from user input (all use adapter methods)
- [ ] Verify no secrets in client bundles: `grep -r "SUPABASE_SERVICE_KEY" .next/static/` returns nothing
- [ ] Verify only `NEXT_PUBLIC_*` vars are accessible from client code
- [ ] Verify security headers in `next.config.ts`: HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Permissions-Policy
- [ ] Verify rate limiting on login endpoint (10 req/15 min)
- [ ] Verify `/api/bootstrap` returns 404/403 when `NODE_ENV=production`

### 6.4 Auth Security

- [ ] Enable Supabase "Leaked Password Protection" (Auth > Settings)
- [ ] Minimum password length: 8 (staging), 10 (production)
- [ ] Verify `__session` cookie attributes:

| Attribute | Required | Why |
|-----------|----------|-----|
| `HttpOnly` | `true` | Prevents XSS access |
| `Secure` | `true` | HTTPS only |
| `SameSite` | `lax` (upgrade to `strict` for production) | CSRF protection |
| `Path` | `/` | Available on all routes |
| `maxAge` | `1209600` (14 days) | Session expiry |

- [ ] Verify logout calls `revokeUserSessions(uid)` and clears cookie
- [ ] Verify OAuth redirect URIs are locked to your domains only
- [ ] **CRITICAL**: Dev bypass safety -- add startup assertion:

```typescript
if (process.env.NODE_ENV === 'production') {
  const hasAuth = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    || process.env.SUPABASE_SERVICE_KEY;
  if (!hasAuth) {
    throw new Error('FATAL: Production requires auth credentials.');
  }
}
```

### 6.5 Data Encryption & Input Validation

- [ ] Supabase encrypts data at rest (AES-256) -- verify in Dashboard > Settings > Encryption
- [ ] All connections use TLS 1.2+ with HSTS
- [ ] Consider column-level encryption for `users.national_id` using `pgcrypto`
- [ ] Verify no secrets committed to git: `git log --all --oneline -p | grep -i "eyJhbG"` returns nothing
- [ ] Verify every Server Action uses Zod (no `z.any()`): `grep -r "z\.any()" src/app/actions/` returns nothing
- [ ] Search for XSS risk: `grep -r "dangerously" src/` returns nothing or all uses are sanitized
- [ ] Verify all user-generated text (lesson notes, announcements) renders as plain text, not HTML

### 6.6 PDPPA Compliance

> **Reference:** [`docs/operations/LEGAL-READINESS.md`](../operations/LEGAL-READINESS.md) contains the full PDPPA compliance checklist (score: 85/100). Any new tools (Sentry, PostHog, Pinecone, Resend) must be added to the sub-processor register on `/privacy`.

- [ ] **Consent collection:** `consent-checkboxes.tsx` + `saveConsentRecord` -- 5 separate types (DATA_PROCESSING, TERMS, MARKETING, VIDEO_RECORDING, PHOTOS)
- [ ] **Cookie banner:** `cookie-banner.tsx` -- functional
- [ ] **DSAR:** export + delete + withdraw in `/dashboard/settings` for ALL roles
- [ ] **Data residency:** Supabase EU region (eu-west-1)
- [ ] **Sub-processors:** Updated on `/privacy` page (add Vercel, Sentry, PostHog, Resend to existing list)
- [ ] **Parental consent:** Separate flow for under-13 students; `isMinorConsent: true` in consent record
- [ ] **Consent records immutable:** No UPDATE/DELETE RLS policies; revocation via service role only
- [ ] **Register with ILITA:** https://www.gov.il/he/departments/ilita -- legal requirement before processing Israeli PII
- [ ] **Audit logging:** ComplianceLog entries for CONSENT_GIVEN, DATA_EXPORTED, PII_DELETED, CONSENT_REVOKED, SIGNATURE_CREATED
- [ ] **Data retention:** User profiles 3yr after deactivation, financial records 7yr, practice videos 1yr, consent/compliance logs indefinite

### 6.7 Pre-Launch Security Checklist

**BLOCKERS -- must pass before any real user data:**

- [ ] **SEC-BLK-01** RLS policies deployed in production. Cross-tenant access tests pass.
- [ ] **SEC-BLK-02** DSAR Export produces actual downloadable file (not just toast).
- [ ] **SEC-BLK-03** DSAR Deletion writes `DELETION_REQUEST` ComplianceLog.
- [ ] **SEC-BLK-04** `saveConsentRecord` rejects foreign `userId` unless valid parent flow.
- [ ] **SEC-BLK-05** `__session` cookie is `HttpOnly` + `Secure` in production.
- [ ] **SEC-BLK-06** Dev bypass CANNOT activate in production.
- [ ] **SEC-BLK-07** All `z.any()` Zod schemas replaced with proper validators.
- [ ] **SEC-BLK-08** No server secrets in client bundles.
- [ ] **SEC-BLK-09** Israeli ID numbers in seed data are fictional.

**HIGH -- must pass before public beta:**

- [ ] **SEC-HIGH-01** Cross-tenant isolation: cons-15 admin CANNOT access cons-66 data.
- [ ] **SEC-HIGH-02** XSS test passes for all user-generated fields.
- [ ] **SEC-HIGH-03** Rate limiting uses distributed store (not in-process memory).
- [ ] **SEC-HIGH-04** ComplianceLog entries written for ALL DSAR operations.
- [ ] **SEC-HIGH-05** All Server Action ownership checks in place.

**MEDIUM -- must pass before GA:**

- [ ] **SEC-MED-01** `CARDCOM_WEBHOOK_SECRET` set; HMAC validation active.
- [ ] **SEC-MED-02** `ipAddress` in ConsentRecord from server-side header, not client.
- [ ] **SEC-MED-03** ILITA database registration submitted.
- [ ] **SEC-MED-04** Data Security Officer appointed.
- [ ] **SEC-MED-05** OAuth redirect URIs locked to production + staging only (no localhost).

**MONITORING -- post-launch:**

- [ ] **SEC-MON-01** Breach notification procedure documented (72-hour deadline).
- [ ] **SEC-MON-02** Independent pentest within 90 days of launch.
- [ ] **SEC-MON-03** Dependency scanning (npm audit/Snyk) in CI.
- [ ] **SEC-MON-04** Security alerts: failed login spikes, cross-tenant attempts, unusual exports.

### 6.8 Penetration Testing Checklist

> **Reference:** The e2e security test suite (`e2e/security/security.spec.ts`) covers role escalation, IDOR, and DSAR scoping -- 51 tests passing.

- [ ] Run OWASP ZAP scan against staging URL
- [ ] Test for SQL injection in search fields
- [ ] Test for XSS in user-generated content (names, notes)
- [ ] Test for IDOR (access another user's data by changing IDs)
- [ ] Test for broken auth (access dashboard without session cookie)
- [ ] Verify rate limiting on login endpoint
- [ ] Verify CORS headers only allow your domains
- [ ] Test with Hebrew/Arabic input in all form fields
- [ ] Verify file upload restrictions (type, size)
- [ ] Test webhook HMAC validation (send request with wrong signature)

---

## Appendix A: Environment Variables Reference

### Required for All Environments

| Variable | Type | Description |
|----------|------|-------------|
| `DB_BACKEND` | Config | `supabase` |
| `AUTH_PROVIDER` | Config | `supabase` |
| `SUPABASE_URL` | Secret | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Secret | Supabase service role key (never expose to client) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Same as `SUPABASE_URL` (safe for client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon/public key |
| `GEMINI_API_KEY` | Secret | Google Gemini API key for AI flows |
| `GOOGLE_API_KEY` | Secret | Google API key (Genkit, CSE) |

### Optional / Per-Environment

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `DEMO_GATE_ENABLED` | Config | Enable demo access gate | `false` |
| `DEMO_TOKENS` | Secret | Comma-separated valid demo tokens | (none) |
| `NEXT_PUBLIC_ALLOW_BOOTSTRAP_MOCK_FALLBACK` | Config | Enable client mock fallback | `0` |
| `SENTRY_DSN` | Secret | Sentry error tracking DSN | (none) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | PostHog analytics key | (none) |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | PostHog host URL | (none) |
| `RESEND_API_KEY` | Secret | Resend email API key | (none) |
| `RESEND_FROM_EMAIL` | Config | Sender email address | (none) |
| `PINECONE_API_KEY` | Secret | Pinecone vector DB key | (none) |
| `PINECONE_INDEX_NAME` | Config | Pinecone index name | (none) |

### Variables NOT Needed (Firebase-specific, replaced by Supabase)

| Variable | Status |
|----------|--------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | NOT NEEDED -- using Supabase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | NOT NEEDED |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | NOT NEEDED |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | NOT NEEDED |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | NOT NEEDED |
| `CARDCOM_*` | Phase 4 -- add when payment gateway is ready |
| `TWILIO_*` | Phase 4 -- add when SMS is ready |
| `SENDGRID_API_KEY` | Phase 4 -- add when email service is ready (or use Resend instead) |

---

## Appendix B: Supabase RLS Policies (Full SQL)

> **Note:** As of 2026-03-14, RLS policies are embedded directly in `scripts/db/schema.sql`. Appendix B below is retained for reference and to document the policy design decisions.

> **IMPORTANT:** The complete, production-ready RLS SQL covering **27 tables** with fine-grained per-role policies is in [`docs/guides/01-security-setup-guide.md`](01-security-setup-guide.md) Section 1 (Steps 1-35). That guide includes parent-child isolation, teacher-student assignment scoping, immutable consent records, and append-only compliance logs.
>
> The SQL below is a **simplified starter** for staging. For production, use the full version from the security guide.

**Prerequisites:** Run the helper functions from Phase 6.1 first.

```sql
-- ============================================================
-- Harmonia -- Row Level Security Policies for Supabase
-- STAGING STARTER -- for production use 01-security-setup-guide.md
-- Run AFTER schema.sql, seed.sql, AND helper functions
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE conservatoriums ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conservatorium_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE repertoire_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CONSERVATORIUMS: public read, admin write
-- ============================================================
CREATE POLICY "conservatoriums_select_public" ON conservatoriums
  FOR SELECT USING (true);

CREATE POLICY "conservatoriums_update_own_admin" ON conservatoriums
  FOR UPDATE USING (
    is_site_admin() OR (is_conservatorium_admin() AND id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "conservatoriums_insert_site_admin" ON conservatoriums
  FOR INSERT WITH CHECK (is_site_admin());

CREATE POLICY "conservatoriums_delete_site_admin" ON conservatoriums
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- USERS: own row + parent->child + teacher->students + admin
-- ============================================================
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_parent_children" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = users.id AND sp.parent_id = auth.uid())
  );

CREATE POLICY "users_select_teacher_students" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.student_id = users.id AND ta.teacher_id = auth.uid() AND ta.is_active = true)
  );

CREATE POLICY "users_select_conservatorium_admin" ON users
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT u.role FROM users u WHERE u.id = auth.uid()));

CREATE POLICY "users_insert_admin" ON users
  FOR INSERT WITH CHECK (is_conservatorium_admin());

CREATE POLICY "users_delete_site_admin" ON users
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- LESSONS: teacher + student + parent + admin
-- ============================================================
CREATE POLICY "lessons_select_teacher" ON lessons
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "lessons_select_student" ON lessons
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "lessons_select_parent" ON lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = lessons.student_id AND sp.parent_id = auth.uid())
  );

CREATE POLICY "lessons_select_admin" ON lessons
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "lessons_update_teacher" ON lessons
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "lessons_insert_admin" ON lessons
  FOR INSERT WITH CHECK (is_conservatorium_admin());

CREATE POLICY "lessons_delete_site_admin" ON lessons
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- REPERTOIRE LIBRARY: public read (approved), ministry write
-- ============================================================
CREATE POLICY "repertoire_select_public" ON repertoire_library
  FOR SELECT USING (approved = true OR is_site_admin() OR harmonia_role() = 'ministry_director');

CREATE POLICY "repertoire_insert_ministry" ON repertoire_library
  FOR INSERT WITH CHECK (harmonia_role() IN ('ministry_director', 'MINISTRY_DIRECTOR') OR is_site_admin());

CREATE POLICY "repertoire_update_ministry" ON repertoire_library
  FOR UPDATE USING (harmonia_role() IN ('ministry_director', 'MINISTRY_DIRECTOR') OR is_site_admin());

CREATE POLICY "repertoire_delete_site_admin" ON repertoire_library
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- INVOICES: payer + parent + admin
-- ============================================================
CREATE POLICY "invoices_select_payer" ON invoices
  FOR SELECT USING (payer_id = auth.uid());

CREATE POLICY "invoices_select_parent" ON invoices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.parent_id = auth.uid() AND sp.user_id = invoices.payer_id)
  );

CREATE POLICY "invoices_select_admin" ON invoices
  FOR SELECT USING (
    is_conservatorium_admin() AND (is_site_admin() OR conservatorium_id::text = harmonia_conservatorium_id())
  );

CREATE POLICY "invoices_insert_admin" ON invoices
  FOR INSERT WITH CHECK (is_conservatorium_admin());

CREATE POLICY "invoices_delete_site_admin" ON invoices
  FOR DELETE USING (is_site_admin());

-- ============================================================
-- For ALL remaining tables (student_profiles, teacher_profiles,
-- teacher_assignments, branches, rooms, events, forms,
-- announcements, lesson_packages, scholarship_applications,
-- instrument_rentals, donations, payroll, consent_records,
-- compliance_logs), see the FULL RLS SQL in:
--   docs/guides/01-security-setup-guide.md Sections 1.4-1.26
-- ============================================================
```

**Verification query** (run after applying policies):

```sql
-- Should return EMPTY result -- all tables must have RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;
```

---

## Appendix C: GitHub Actions Workflow (Full YAML)

> **Reference:** The existing `.github/workflows/ci.yml` (262 lines) contains the Firebase-focused CI/CD pipeline. The workflow below is a Vercel-specific variant that preserves the same lint -> test -> build -> deploy stages. See [`docs/operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md) Section 5 for the pipeline design.

File: `.github/workflows/vercel-deploy.yml`

```yaml
name: CI/CD (Vercel)

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

env:
  NODE_VERSION: '20'

jobs:
  # ---- Stage 1: Lint + Type Check ----
  lint:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run lint -- --max-warnings 780
      - run: npm run typecheck
      - run: npm run i18n:audit

  # ---- Stage 2: Unit Tests ----
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run test -- --run --reporter=verbose

  # ---- Stage 3: Build ----
  build:
    name: Next.js Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          DB_BACKEND: mock

  # ---- Stage 4a: Deploy Preview (PRs) ----
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx vercel pull --yes --environment=preview --token=$VERCEL_TOKEN
      - run: npx vercel build --token=$VERCEL_TOKEN
      - run: npx vercel deploy --prebuilt --token=$VERCEL_TOKEN

  # ---- Stage 4b: Deploy Staging (main branch) ----
  deploy-staging:
    name: Deploy Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: staging
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx vercel pull --yes --environment=production --token=$VERCEL_TOKEN
      - run: npx vercel build --prod --token=$VERCEL_TOKEN
      - run: npx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN

  # ---- Stage 4c: Deploy Production (tags v*) ----
  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production
    env:
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN_PROD }}
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID_PROD }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID_PROD }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm
      - run: npm ci
      - run: npx vercel pull --yes --environment=production --token=$VERCEL_TOKEN
      - run: npx vercel build --prod --token=$VERCEL_TOKEN
      - run: npx vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
```

---

## Appendix D: Admin Account Seed Script

File: `scripts/seed-admins.mjs`

```javascript
/**
 * Creates 85 conservatorium admin accounts in Supabase Auth.
 *
 * Usage:
 *   export SUPABASE_URL="https://xxxx.supabase.co"
 *   export SUPABASE_SERVICE_KEY="eyJhbG..."
 *   node scripts/seed-admins.mjs
 *
 * Output: admin-credentials.csv with columns:
 *   conservatorium_id, conservatorium_name, email, password
 */

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { writeFileSync, readFileSync } from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePassword() {
  // 12 chars: mix of letters, numbers, symbols
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  const bytes = randomBytes(12);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

async function main() {
  // Fetch conservatorium list from database
  const { data: conservatoriums, error } = await supabase
    .from('conservatoriums')
    .select('id, name')
    .order('id');

  if (error) {
    console.error('Failed to fetch conservatoriums:', error.message);
    process.exit(1);
  }

  const rows = ['conservatorium_id,conservatorium_name,email,password'];

  for (const cons of conservatoriums) {
    const email = `admin-${cons.id}@harmonia.co.il`;
    const password = generatePassword();
    const name = typeof cons.name === 'object' ? (cons.name.he || cons.name.en || cons.id) : cons.name;

    // Create user in Supabase Auth
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email verification
      app_metadata: {
        role: 'CONSERVATORIUM_ADMIN',
        conservatoriumId: cons.id,
        approved: true,
      },
    });

    if (createError) {
      console.error(`Failed to create admin for ${cons.id}: ${createError.message}`);
      continue;
    }

    // Also update the users table to link to conservatorium
    await supabase
      .from('users')
      .upsert({
        id: user.user.id,
        email,
        first_name: 'Admin',
        last_name: name,
        role: 'CONSERVATORIUM_ADMIN',
        conservatorium_id: cons.id,
        is_active: true,
      });

    const safeName = name.replace(/,/g, ' ');
    rows.push(`${cons.id},${safeName},${email},${password}`);
    console.log(`Created admin for ${cons.id}: ${email}`);
  }

  writeFileSync('admin-credentials.csv', rows.join('\n'), 'utf-8');
  console.log(`\nDone! ${conservatoriums.length} admins created.`);
  console.log('Credentials saved to admin-credentials.csv');
  console.log('WARNING: Keep this file secure. Do NOT commit it to git.');
}

main().catch(console.error);
```

---

## Appendix E: Troubleshooting

### E.1 "npm run dev" fails with module not found

```
Error: Cannot find module 'next'
```

**Fix:** Run `npm install` first:
```bash
npm install
```

### E.2 Build fails on Vercel with "Type error"

```
Type error: Property 'xxx' does not exist on type 'yyy'
```

**Fix:** The build runs `tsc --noEmit` during `next build`. Fix the TypeScript error locally first:
```bash
npm run typecheck
```

### E.3 Supabase connection fails (ECONNREFUSED)

```
[db/supabase] users fetch failed (0): fetch failed
```

**Fix:** Check that:
1. `SUPABASE_URL` is correct (no trailing slash)
2. `SUPABASE_SERVICE_KEY` is the `service_role` key, not the `anon` key
3. The Supabase project is not paused (free tier pauses after 7 days of inactivity)
   - Go to Supabase dashboard and click "Restore" if paused

### E.4 "DEMO_GATE_ENABLED but no DEMO_TOKENS"

The demo gate page shows but no token works.

**Fix:** Make sure `DEMO_TOKENS` is set and contains at least one token. Tokens are comma-separated, no spaces:
```
DEMO_TOKENS=token1,token2,token3
```

### E.5 OAuth redirect fails with "redirect_uri_mismatch"

**Fix:** The redirect URI in Google/Microsoft console must EXACTLY match:
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```
Check for:
- Trailing slashes (there should be none)
- HTTP vs HTTPS (must be HTTPS)
- Typos in the project ref

### E.6 Vercel deploy fails with "Error: No Output Directory"

**Fix:** In Vercel Project Settings > General:
- Framework Preset: **Next.js**
- Build Command: `npm run build`
- Output Directory: (leave blank -- Next.js auto-detects)

### E.7 Hebrew text displays as boxes or question marks

**Fix:** The app uses the Rubik font via `next/font`. If it is not loading:
1. Check that the Vercel deployment has internet access (it does by default)
2. Check the browser console for font loading errors
3. Clear browser cache

### E.8 "Supabase project is paused"

Free tier Supabase projects pause after 7 days of inactivity.

**Fix:**
1. Go to https://supabase.com/dashboard
2. Click on the paused project
3. Click **"Restore project"**
4. Wait 1-2 minutes for it to come back online

**Prevention:** Upgrade to Pro ($25/mo) for production -- no auto-pausing.

### E.9 GitHub Actions workflow not triggering

**Fix:** Check that:
1. The workflow file is in `.github/workflows/` (note the period before `github`)
2. The file has a `.yml` extension
3. The branch/tag triggers match your push
4. GitHub Actions is enabled for your repository (Settings > Actions > General)

### E.10 "Error: Missing required environment variable: SUPABASE_URL"

The app cannot find Supabase credentials at runtime.

**Fix:** In Vercel Project Settings > Environment Variables:
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` exist
2. Verify they are enabled for the correct environment (Production/Preview/Development)
3. Redeploy after adding variables (changes do not apply to existing deployments)

---

## Appendix F: Free Tier Limits

| Service | Free Tier Includes | Enough for Stage? | Enough for Prod? |
|---------|-------------------|-------------------|-------------------|
| **Supabase** | 500MB DB, 1GB file storage, 50K MAU, 2 projects, edge functions | Yes | Depends on scale -- Pro ($25/mo) recommended |
| **Vercel** | 100GB bandwidth/mo, serverless functions, preview deploys, 1 team member | Yes | May need Pro ($20/mo) for team features and bandwidth |
| **Sentry** | 5,000 errors/mo, 1 team member, 30-day retention | Yes | Yes for early stage |
| **UptimeRobot** | 50 monitors, 5-min interval | Yes | Yes |
| **Resend** | 100 emails/day, 1 domain | Yes | No -- need paid plan ($20/mo) for volume |
| **PostHog** | 1M events/mo, unlimited team, EU hosting | Yes | Yes for early stage |
| **Pinecone** | 1 index, 100K vectors, 1 project | Yes | Likely yes (help articles fit in 100K) |
| **GitHub** | Unlimited public repos, 2,000 CI/CD minutes/mo | Yes | Yes |

**Cost Summary:**

| Phase | Monthly Cost |
|-------|-------------|
| **Stage only** (free tiers) | $0/mo |
| **Stage + Production** (Supabase Pro + Vercel Hobby) | ~$25/mo |
| **Full production** (Supabase Pro + Vercel Pro + Sentry + Resend) | ~$90/mo |
| **Scale** (50+ conservatoriums active) | ~$200-400/mo |

**Warning about Supabase free tier:** Projects pause after 7 days of inactivity. This is fine for a demo you visit weekly, but NOT for a production system. Upgrade to Pro before onboarding real users.

---

## Appendix G: Credential-Free Setup with Claude Code

**Question:** "Can Claude Code perform setup without me providing credentials?"

**Answer:** YES. Claude Code can run commands that use credentials stored in environment variables without ever seeing the actual values. Here is how.

### G.1 The Pattern: Masked Environment Variables

The user sets secrets in their terminal session. Claude Code runs commands that reference the variables.

**Step 1 -- User sets secrets (Claude cannot see these):**

```bash
# These commands prompt for input without echoing to screen
read -sp "Enter Supabase URL: " SUPABASE_URL && echo && export SUPABASE_URL
read -sp "Enter Supabase Service Key: " SUPABASE_SERVICE_KEY && echo && export SUPABASE_SERVICE_KEY
read -sp "Enter Vercel Token: " VERCEL_TOKEN && echo && export VERCEL_TOKEN
```

**Step 2 -- Claude runs commands that USE the vars without seeing values:**

```bash
# Claude can run this -- it uses $SUPABASE_URL but Claude never sees the value
psql "$SUPABASE_URL" -f scripts/db/schema.sql

# Claude can push to Vercel without seeing the token
npx vercel deploy --token "$VERCEL_TOKEN"

# Claude can add env vars to Vercel without seeing them
echo "$SUPABASE_URL" | npx vercel env add SUPABASE_URL production
echo "$SUPABASE_SERVICE_KEY" | npx vercel env add SUPABASE_SERVICE_KEY production
```

### G.2 What Claude CAN Do

| Task | How |
|------|-----|
| Run database migrations | `psql "$DATABASE_URL" -f scripts/db/schema.sql` (includes RLS — no separate step needed) |
| Seed the database | `psql "$DATABASE_URL" -f scripts/db/seed.sql` (run after schema.sql) |
| Deploy to Vercel | `npx vercel deploy --token "$VERCEL_TOKEN"` |
| Add env vars to Vercel | `echo "$VAR_VALUE" \| npx vercel env add VAR_NAME production` |
| Create admin accounts | `SUPABASE_URL="$SUPABASE_URL" SUPABASE_SERVICE_KEY="$SUPABASE_SERVICE_KEY" node scripts/seed-admins.mjs` |
| Run tests against staging | `SUPABASE_URL="$SUPABASE_URL" npm run test` |
| Check deployment status | `npx vercel ls --token "$VERCEL_TOKEN"` |

### G.3 What Claude CANNOT Do (User Must Do Manually)

| Task | Why |
|------|-----|
| Create Supabase account | Requires browser interaction with email verification |
| Create Vercel account | Requires browser interaction with email verification |
| Set up OAuth in Google/Microsoft console | Requires browser interaction in third-party portals |
| Generate and copy API keys | Keys are displayed in browser UIs |
| Configure DNS records | Must be done at your domain registrar |

### G.4 Full Credential-Free Workflow Example

```bash
# 1. User sets all secrets (one time, at start of session)
read -sp "Supabase URL: " SUPABASE_URL && echo && export SUPABASE_URL
read -sp "Supabase Service Key: " SUPABASE_SERVICE_KEY && echo && export SUPABASE_SERVICE_KEY
read -sp "Supabase DB URL (postgres://...): " DATABASE_URL && echo && export DATABASE_URL
read -sp "Vercel Token: " VERCEL_TOKEN && echo && export VERCEL_TOKEN
read -sp "Vercel Org ID: " VERCEL_ORG_ID && echo && export VERCEL_ORG_ID
read -sp "Vercel Project ID: " VERCEL_PROJECT_ID && echo && export VERCEL_PROJECT_ID

# 2. Claude can now execute all setup commands:

# Run migrations
psql "$DATABASE_URL" -f scripts/db/schema.sql
psql "$DATABASE_URL" -f scripts/db/seed.sql

# Add env vars to Vercel
for VAR in DB_BACKEND AUTH_PROVIDER SUPABASE_URL SUPABASE_SERVICE_KEY; do
  echo "${!VAR}" | npx vercel env add "$VAR" production --token "$VERCEL_TOKEN"
done

# Deploy
npx vercel deploy --prod --token "$VERCEL_TOKEN"

# Create admin accounts
node scripts/seed-admins.mjs

# Verify deployment
curl -s "$(npx vercel ls --token "$VERCEL_TOKEN" | head -1)" | head -20
```

### G.5 Security Guarantees

- **Environment variables in `read -sp`** are never echoed to the terminal
- **Claude Code** sees the command text (e.g., `psql "$DATABASE_URL"`) but not the resolved value
- **Shell history** does not record the secret values (they were entered via `read`, not typed as arguments)
- **Git** will not contain secrets (the variables are only in the shell session, not in files)

This pattern lets Claude Code perform 90%+ of the setup work while the user retains full control of all credentials.

---

## Quick Reference: Key URLs

| Resource | URL |
|----------|-----|
| Supabase Dashboard | https://supabase.com/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |
| GitHub Repository | https://github.com/YOUR_USERNAME/studio |
| Google Cloud Console | https://console.cloud.google.com |
| Azure App Registrations | https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps |
| Sentry | https://sentry.io |
| UptimeRobot | https://uptimerobot.com |
| Resend | https://resend.com |
| PostHog | https://posthog.com |
| ILITA (Israeli Privacy Authority) | https://www.gov.il/he/departments/ilita |

---

## Quick Reference: Key Commands

```bash
# Local development
npm run dev                    # Start dev server on port 9002
npm run build                  # Production build
npm run test -- --run          # Run all unit tests
npm run lint                   # ESLint check
npm run typecheck              # TypeScript check
npm run e2e                    # Playwright e2e tests
npm run i18n:audit             # Check translation completeness

# Database (local Postgres)
npm run db:start               # Start Postgres via Docker
npm run db:migrate             # Run schema.sql
npm run db:seed                # Run seed.sql
npm run db:reset               # Drop and recreate

# Deployment
npx vercel deploy              # Deploy preview
npx vercel deploy --prod       # Deploy production
git tag v1.0.0 && git push origin v1.0.0  # Trigger production CI/CD
```

---

*This guide was authored on 2026-03-14. If Supabase, Vercel, or any other service changes their UI, the screenshots and button labels may differ slightly. The underlying steps remain the same.*

*For the full project documentation index, see [`docs/architecture/README.md`](../architecture/README.md).*
