# Infrastructure Report — Harmonia Production Readiness

## 1. Firebase Project Region Recommendation

### Analysis: `europe-west1` (Belgium) vs `me-central1` (Doha, Qatar)

| Factor | europe-west1 (Belgium) | me-central1 (Doha) |
|--------|----------------------|---------------------|
| Latency to Israel | ~40-60ms | ~20-35ms |
| Firestore availability | GA, all features | GA, limited extensions |
| Cloud Functions Gen2 | Full support | Full support |
| Firebase Extensions | All available | Limited catalog |
| Firebase App Hosting | Supported | Not yet supported |
| Pricing tier | Standard | Standard |
| GDPR adjacency | EU jurisdiction | Non-EU |
| Service maturity | Longest-running region | Newer region |

### Recommendation: `europe-west1`

**Rationale:**
1. **Firebase App Hosting support** — `me-central1` does not yet support Firebase App Hosting, which is the project's primary deployment target. This is a hard blocker.
2. **PDPPA compliance** — The Israeli Protection of Privacy Law (PDPPA) does not mandate data residency within Israel or the Middle East. It requires "adequate protection" of personal data. The EU's data protection framework (GDPR) is recognized as providing adequate protection, making `europe-west1` fully compliant.
3. **Service completeness** — `europe-west1` has the full Firebase service catalog including all Extensions (e.g., Trigger Email with SendGrid), App Check, and the Firebase Emulator Suite import/export.
4. **Proven reliability** — Belgium is Google Cloud's most mature European region with the highest SLA track record.
5. **Latency trade-off** — The ~20ms additional latency vs `me-central1` is negligible for a server-rendered Next.js application where the dominant latency factor is Firestore reads (which happen server-side within the same region).

**Action:** Set the Firebase project location to `europe-west1` during `firebase init`. This is immutable once set.

---

## 2. Zero-Downtime Deployment Strategy

Zero-downtime deploys are a hard requirement for conservatorium tenants who may be mid-lesson, mid-payment, or mid-registration.

### Strategy: Firebase App Hosting Rolling Deploys + Preview Channels

```
PR Created
  └── CI builds → Firebase Hosting Preview Channel (pr-{number}.harmonia-dev.web.app)
       └── Expires after 7 days
       └── Reviewer tests the preview URL

PR Merged to main
  └── CI builds → Deploy to Staging (harmonia-staging.web.app)
       └── Firestore rules + indexes deployed to staging project
       └── Smoke tests run against staging

Git Tag v1.x.x
  └── CI builds → Deploy to Production (harmonia.web.app)
       └── Firebase App Hosting performs rolling replacement:
           1. New revision is built and started
           2. Health check passes (HTTP 200 on /)
           3. Traffic is shifted to new revision
           4. Old revision is drained (existing requests complete)
           5. Old revision is terminated
       └── Firestore rules + indexes deployed atomically
```

### Key Properties

- **No maintenance window required.** Firebase App Hosting uses Cloud Run under the hood, which performs blue-green traffic migration.
- **minInstances: 1** ensures at least one warm instance is always running. New instances spin up before old ones are terminated.
- **Firestore rules deploy atomically.** There is no window where old rules and new code coexist — rules take effect across all clients simultaneously.
- **Rollback:** If a production deploy causes issues, push a revert commit and tag it. The previous build can also be manually promoted via `firebase hosting:clone`.

### Preview Channel Lifecycle

| Event | Channel | TTL |
|-------|---------|-----|
| PR opened/updated | `pr-{number}` | 7 days |
| PR closed | Channel auto-expires | - |
| Merge to main | `live` on staging project | Permanent |
| Tag `v*` | `live` on production project | Permanent |

---

## 3. Cost Estimation (Firebase Pricing for Israeli SaaS)

### Assumptions

- 5 conservatoriums in Year 1, growing to 20 in Year 2
- ~200 active users per conservatorium (students + parents + teachers + admin)
- ~1,000 total active users in Year 1, ~4,000 in Year 2
- Average session: 10 Firestore reads, 3 writes, 2 Cloud Function invocations
- 3 sessions per user per week

### Monthly Cost Estimate — Year 1 (Blaze Plan)

| Service | Usage | Est. Cost/Month |
|---------|-------|-----------------|
| **Firebase App Hosting** (Cloud Run) | 1 instance always-on (2 vCPU, 1 GiB) + burst to 3 | $25-40 |
| **Firestore** | ~600K reads, ~180K writes, 5GB storage | $2-5 (free tier covers most) |
| **Cloud Functions** | ~12K invocations/week | Free tier (2M/month) |
| **Cloud Storage** | 50GB (practice videos, PDFs, signatures) | $1-3 |
| **Firebase Auth** | 1,000 MAU | Free (10K MAU included) |
| **SendGrid** (via Extension) | ~2,000 emails/month | Free tier (100/day) |
| **Twilio** | ~500 SMS/month (Israel) | $25-40 (ILS 0.28/SMS) |
| **Cardcom** | Transaction fees | Pass-through to conservatorium |
| **Google AI (Gemini)** | ~200 Genkit calls/month | $5-15 |
| **Total** | | **$60-110/month** |

### Year 2 Scaling Notes

- Firestore costs scale linearly with reads/writes. At 4,000 users: ~$15-25/month.
- Cloud Functions remain in free tier unless heavy background processing is added.
- Cloud Storage is the biggest variable — video uploads could push to 500GB ($25/month).
- App Hosting auto-scales; maxInstances: 10 caps burst cost.

---

## 4. Monitoring and Alerting Recommendations

### 4.1 Built-in Firebase Monitoring

| Tool | What It Monitors | Setup |
|------|-----------------|-------|
| **Firebase Console > App Hosting** | Instance count, request latency, error rate | Automatic |
| **Firebase Console > Firestore Usage** | Read/write/delete counts, storage size | Automatic |
| **Firebase Performance Monitoring** | Web vitals (LCP, INP, CLS), custom traces | Add SDK to `_app.tsx` |
| **Firebase Crashlytics** | JavaScript errors in production | Add SDK + `reportError()` |

### 4.2 Google Cloud Monitoring (Recommended Alerts)

| Alert | Condition | Severity |
|-------|-----------|----------|
| App Hosting error rate > 5% | `cloud_run_revision/request_count{response_code_class="5xx"}` | Critical |
| App Hosting latency P95 > 3s | `cloud_run_revision/request_latencies` | Warning |
| Firestore daily reads > 500K | `firestore.googleapis.com/document/read_count` | Warning (cost) |
| Cloud Function error rate > 1% | `cloudfunctions.googleapis.com/function/execution_count{status="error"}` | Critical |
| Auth: unusual sign-in spike | `identitytoolkit.googleapis.com/api/request_count` | Warning (abuse) |
| Storage > 100GB | `storage.googleapis.com/storage/total_bytes` | Warning (cost) |

### 4.3 Uptime Checks

Create a Google Cloud Uptime Check for:
- `https://harmonia.web.app/` (production) — 1-minute interval
- `https://harmonia-staging.web.app/` (staging) — 5-minute interval

Notification channels: Email to ops team + Slack/Teams webhook.

---

## 5. Backup Strategy for Firestore Data

### 5.1 Automated Daily Exports

Use **Firestore Scheduled Exports** via Cloud Scheduler + Cloud Function:

```
Schedule: Every day at 02:00 UTC (04:00 Israel time)
Target: Cloud Function `scheduledFirestoreBackup`
Action: admin.firestore().exportDocuments(bucket)
Bucket: gs://harmonia-production-backups/firestore/{date}
Retention: 30 daily + 12 monthly + 7 yearly
```

### 5.2 Point-in-Time Recovery (PITR)

Enable **Firestore Point-in-Time Recovery** on the production project:
- Provides 7-day recovery window
- No additional configuration needed — enable in Firebase Console
- Recovery granularity: 1-minute intervals

### 5.3 Cross-Region Backup

Export Firestore data to a **multi-region Cloud Storage bucket** (`eu`) for disaster recovery:
- Primary data: `europe-west1` (Firestore)
- Backup: `eu` multi-region bucket (includes `europe-west1` + `europe-west4`)
- This provides geographic redundancy within the EU for PDPPA compliance

### 5.4 Backup Testing

- Monthly: Restore a backup to a separate Firestore database and verify data integrity
- Document the restore procedure in a runbook

---

## 6. Environment Variable Management Guide

### 6.1 Secret Storage by Environment

| Environment | Secret Storage | Access Method |
|-------------|---------------|---------------|
| **Local Dev** | `.env.local` (gitignored) | `process.env` via Next.js |
| **CI/CD** | GitHub Actions Secrets | `${{ secrets.NAME }}` |
| **Staging** | Google Secret Manager (staging project) | `apphosting.yaml` secret refs |
| **Production** | Google Secret Manager (production project) | `apphosting.yaml` secret refs |

### 6.2 Setting Up Google Secret Manager

For each secret listed in `apphosting.yaml`:

```bash
# Set the project
gcloud config set project harmonia-production

# Create each secret
gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create CARDCOM_TERMINAL_NUMBER --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create CARDCOM_API_NAME --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create CARDCOM_API_PASSWORD --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create CARDCOM_WEBHOOK_SECRET --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create TWILIO_ACCOUNT_SID --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create TWILIO_AUTH_TOKEN --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create SENDGRID_API_KEY --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create GOOGLE_API_KEY --replication-policy="user-managed" --locations="europe-west1"
gcloud secrets create RECAPTCHA_SITE_KEY --replication-policy="user-managed" --locations="europe-west1"

# Add secret values
echo -n "your-secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Grant App Hosting service account access
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:firebase-app-hosting-compute@harmonia-production.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 6.3 Replication Policy

All secrets use `user-managed` replication with location `europe-west1` to ensure secret data stays within the EU (PDPPA compliance). Do NOT use `automatic` replication, which may store secret versions in non-EU regions.

### 6.4 Secret Rotation Schedule

| Secret | Rotation Frequency | Notes |
|--------|--------------------|-------|
| FIREBASE_SERVICE_ACCOUNT_KEY | 90 days | Generate new key in Firebase Console |
| CARDCOM_API_PASSWORD | 180 days | Coordinate with Cardcom support |
| CARDCOM_WEBHOOK_SECRET | 180 days | Update in Cardcom dashboard simultaneously |
| TWILIO_AUTH_TOKEN | 90 days | Rotate in Twilio Console |
| SENDGRID_API_KEY | 90 days | Create new key, revoke old |
| GOOGLE_API_KEY | 180 days | Restrict to Gemini API only |
| RECAPTCHA_SITE_KEY | Rarely | Only on suspected compromise |

### 6.5 Required GitHub Actions Secrets

Set these in GitHub repo Settings > Secrets and variables > Actions:

| Secret | Purpose |
|--------|---------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON for dev project (preview deploys) |
| `FIREBASE_PROJECT_ID_DEV` | Dev Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_STAGING` | Service account JSON for staging project |
| `FIREBASE_PROJECT_ID_STAGING` | Staging Firebase project ID |
| `FIREBASE_SERVICE_ACCOUNT_PRODUCTION` | Service account JSON for production project |
| `FIREBASE_PROJECT_ID_PRODUCTION` | Production Firebase project ID |

---

## 7. Architecture Decision Records

### ADR-INFRA-001: Firebase App Hosting over Cloud Run Direct

**Decision:** Use Firebase App Hosting (which wraps Cloud Run) rather than deploying to Cloud Run directly.

**Rationale:** Firebase App Hosting provides automatic HTTPS, CDN, preview channels, and native Next.js support without requiring a Dockerfile or custom Cloud Run configuration. The trade-off is less control over Cloud Run settings, but the defaults are suitable for Harmonia's workload.

### ADR-INFRA-002: Three Separate Firebase Projects

**Decision:** Use three separate Firebase projects (dev, staging, production) rather than a single project with multiple environments.

**Rationale:** Firestore security rules, Auth configuration, and billing are per-project. Separate projects provide hard isolation between environments, preventing staging test data from appearing in production and ensuring billing is tracked independently.

### ADR-INFRA-003: minInstances: 1 for Production

**Decision:** Keep at least one warm instance running at all times in production.

**Rationale:** Conservatorium staff may access the system at any time (lesson scheduling, parent communications). A cold start of 3-5 seconds is unacceptable for an SLA-bound multi-tenant SaaS. The cost of one always-on instance (~$25/month) is justified by the user experience guarantee. Staging uses minInstances: 0 to save costs.
