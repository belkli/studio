# SDD-FIX-07: Scholarship & Donations — Action Buttons & Extended Causes

**PDF Issues:** #8, #28  
**Priority:** P1

---

## 1. Scholarship Action Buttons Fix (Issue #8)

### Problem
Buttons in the scholarship management screen (approve, reject, mark as paid) do not trigger any action.

### Root Cause
Locate `src/app/[locale]/dashboard/scholarships/page.tsx` or similar.

```typescript
// Bug: onClick handlers are likely undefined or call async without await
<Button onClick={handleApprove}>Approve</Button>

// Fix:
const handleApprove = async (applicationId: string) => {
  setProcessingId(applicationId);
  try {
    await updateScholarshipStatus(applicationId, 'approved');
    toast({ description: t('Scholarships.approvedSuccess') });
    refreshData();
  } catch (e) {
    toast({ description: t('Common.errorOccurred'), variant: 'destructive' });
  } finally {
    setProcessingId(null);
  }
};

// Button with loading state:
<Button
  onClick={() => handleApprove(app.id)}
  disabled={processingId === app.id}
>
  {processingId === app.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
  {t('Scholarships.approve')}
</Button>
```

---

## 2. Extended Donation Categories (Issue #28)

### 2.1 Donation Cause Model

```typescript
interface DonationCause {
  id: string;
  conservatoriumId: string;
  names: { he: string; en: string; ru?: string; ar?: string };
  descriptions: { he: string; en: string };
  category: 'financial_aid' | 'excellence' | 'equipment' | 'events' | 'general';
  priority: number;            // Lower = higher priority display
  isActive: boolean;
  targetAmountILS?: number;
  raisedAmountILS: number;
  imageUrl?: string;
}
```

### 2.2 Default Causes (seed data)

```json
[
  {
    "id": "cause-financial-aid",
    "category": "financial_aid",
    "priority": 1,
    "names": { "he": "סיוע לילדים ממשפחות מוחלשות", "en": "Financial Aid for Disadvantaged Families" },
    "descriptions": { "he": "מתן שוויון הזדמנויות לכל ילד לקבל חינוך מוזיקלי.", "en": "Equal music education for every child regardless of financial background." }
  },
  {
    "id": "cause-excellence",
    "category": "excellence",
    "priority": 2,
    "names": { "he": "מלגות מצוינות", "en": "Excellence Scholarships" },
    "descriptions": { "he": "תמיכה בתלמידים מחוננים לפיתוח הכישרון שלהם.", "en": "Support gifted students in developing their talent." }
  },
  {
    "id": "cause-equipment",
    "category": "equipment",
    "priority": 3,
    "names": { "he": "ציוד מוזיקלי לתלמידים", "en": "Musical Equipment for Students" },
    "descriptions": { "he": "רכישת כלים מוזיקליים להשאלה לתלמידים.", "en": "Purchase instruments for student loans." }
  },
  {
    "id": "cause-events",
    "category": "events",
    "priority": 4,
    "names": { "he": "תחרויות ופסטיבלים", "en": "Competitions & Festivals" },
    "descriptions": { "he": "מימון השתתפות תלמידים בתחרויות ופסטיבלים ארציים ובינלאומיים.", "en": "Fund student participation in national and international competitions." }
  }
]
```

### 2.3 Donation Page UI Update

```tsx
// src/app/[locale]/donate/page.tsx
<div className="space-y-6">
  <h2 className="text-xl font-semibold">{t('Donate.chooseCause')}</h2>
  <p className="text-muted-foreground">{t('Donate.chooseCauseHint')}</p>
  
  {/* Cause cards sorted by priority */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {causes.sort((a,b) => a.priority - b.priority).map(cause => (
      <CauseCard
        key={cause.id}
        cause={cause}
        selected={selectedCauseId === cause.id}
        onSelect={() => setSelectedCauseId(cause.id)}
        showProgress={!!cause.targetAmountILS}
      />
    ))}
    
    {/* General / donor's choice */}
    <CauseCard
      id="general"
      name={t('Donate.generalFund')}
      description={t('Donate.generalFundDesc')}
      selected={selectedCauseId === 'general'}
      onSelect={() => setSelectedCauseId('general')}
    />
  </div>
</div>
```

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin clicks "Approve" on scholarship | Status updates, success toast shown |
| 2 | Donate page loads | 4 cause cards + General option displayed |
| 3 | Donor selects "Equipment" cause | Donation tagged to that cause in data |
| 4 | Admin adds custom cause via settings | Appears on public donation page |
