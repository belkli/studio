# SDD-FIX-18: Public Site — Landing Page, About Us, Teacher Bios & Conservatory Discovery

**PDF Issues:** #29, #30, #31, #32  
**Priority:** P1

---

## 1. Overview

Four interlinked improvements to the public-facing site:
1. **About page** — translation issues, instrument filter source, teacher bio expansion, missing teachers.
2. **Landing page** — needs a more visually compelling redesign.
3. **Site-wide review** — architecture gaps blocking production readiness.
4. **Inspiration sources** — draw patterns from ICM, Raanana Music, MCPT, Makom Balev, Ramat Gan Music, TEO, Netanya Culture.

---

## 2. About Page Fixes (Issue #29)

### 2.1 Translation Issues

Audit all strings in `src/app/[locale]/about/page.tsx` and child components.

Instrument names in the filter dropdown are hardcoded in Hebrew. Fix:
```tsx
// WRONG — hardcoded:
<option value="פסנתר">פסנתר</option>

// CORRECT — from conservatorium instruments with locale:
{instruments.map(inst => (
  <option key={inst.id} value={inst.id}>
    {getInstrumentName(inst, locale)}
  </option>
))}
```

### 2.2 Instrument Filter Source

The instrument list in the About/Find-Conservatory filter must be sourced from the union of all active conservatoriums' instrument lists (see SDD-FIX-04):

```typescript
async function getAllPlatformInstruments(): Promise<ConservatoriumInstrument[]> {
  const allInstruments = await fetchAllConservatoriumInstruments();
  // Deduplicate by instrumentId (same piano across all conservatoriums = one entry)
  const unique = new Map<string, ConservatoriumInstrument>();
  allInstruments.forEach(inst => unique.set(inst.id, inst));
  return Array.from(unique.values()).sort((a, b) => 
    getInstrumentName(a, 'he').localeCompare(getInstrumentName(b, 'he'))
  );
}
```

### 2.3 Show All Teachers + Full Bio Expansion

**Problem:** The teacher grid on the About page only shows a subset (likely first N). Pagination or "Show All" is missing.

**Fix — Paginated Teacher Grid:**
```tsx
const TEACHERS_PER_PAGE = 12;
const [visibleCount, setVisibleCount] = useState(TEACHERS_PER_PAGE);

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
  {teachers.slice(0, visibleCount).map(teacher => (
    <TeacherCard key={teacher.id} teacher={teacher} onExpand={setSelectedTeacher} />
  ))}
</div>

{visibleCount < teachers.length && (
  <div className="flex justify-center mt-8">
    <Button variant="outline" onClick={() => setVisibleCount(v => v + TEACHERS_PER_PAGE)}>
      {t('About.loadMoreTeachers', { count: teachers.length - visibleCount })}
    </Button>
  </div>
)}
```

**Teacher Bio Expansion (like ICM):**
```tsx
// TeacherCard component — compact by default, expandable:
const TeacherCard = ({ teacher, onExpand }) => (
  <div
    className="group cursor-pointer rounded-xl overflow-hidden border hover:shadow-lg transition-shadow"
    onClick={() => onExpand(teacher)}
  >
    <div className="relative aspect-square">
      <img src={teacher.photoUrl ?? '/placeholder-teacher.jpg'} alt={teacher.name} className="object-cover w-full h-full" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <span className="text-white text-sm font-medium">{t('About.viewBio')}</span>
      </div>
    </div>
    <div className="p-3">
      <p className="font-semibold text-sm">{teacher.displayName}</p>
      <p className="text-xs text-muted-foreground">{getInstrumentName(teacher.primaryInstrument, locale)}</p>
    </div>
  </div>
);

// Full bio modal/sheet:
<Sheet open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
  <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
    <div className="space-y-6">
      <div className="flex gap-4 items-start">
        <img
          src={selectedTeacher?.photoUrl}
          className="w-24 h-24 rounded-full object-cover flex-shrink-0"
        />
        <div>
          <h2 className="text-xl font-bold">{selectedTeacher?.displayName}</h2>
          <p className="text-muted-foreground">
            {selectedTeacher?.instruments.map(i => getInstrumentName(i, locale)).join(', ')}
          </p>
          <p className="text-sm">{selectedTeacher?.conservatoriumName}</p>
        </div>
      </div>
      <div className="prose prose-sm max-w-none" dir={isRtl ? 'rtl' : 'ltr'}>
        <p>{selectedTeacher?.bio[locale] ?? selectedTeacher?.bio.he}</p>
      </div>
      {selectedTeacher?.availableForLessons && (
        <Button className="w-full" asChild>
          <Link href={`/register?teacher=${selectedTeacher?.id}`}>
            {t('About.bookWithTeacher')}
          </Link>
        </Button>
      )}
    </div>
  </SheetContent>
</Sheet>
```

---

## 3. Landing Page Redesign (Issue #30)

### 3.1 Design Philosophy

Inspired by ICM and Raanana Music: authoritative, warm, professional. Clean sections with clear CTAs.

### 3.2 Page Structure

```
┌────────────────────────────────────────┐
│  HERO — full-bleed video/image         │
│  "Music is not just skill — it's life" │
│  [Register Now] [Find Conservatory]    │
├────────────────────────────────────────┤
│  STATS BAR — 85 conservatories        │
│  450,000 lessons · 75% parent sat.    │
├────────────────────────────────────────┤
│  FIND YOUR CONSERVATORY               │
│  Search by city or instrument          │
│  [3 featured conservatory cards]       │
├────────────────────────────────────────┤
│  HOW IT WORKS — 3 steps               │
│  Search → Register → Learn             │
├────────────────────────────────────────┤
│  FEATURED TEACHERS                    │
│  4 rotating teacher cards w/ photo     │
├────────────────────────────────────────┤
│  UPCOMING EVENTS                      │
│  3 event cards from across platform    │
├────────────────────────────────────────┤
│  OPEN DAYS — next open days banner    │
├────────────────────────────────────────┤
│  TESTIMONIALS — parent/student quotes  │
├────────────────────────────────────────┤
│  DONATE CTA                           │
│  "Give every child the gift of music"  │
└────────────────────────────────────────┘
```

### 3.3 Hero Section

```tsx
// src/app/[locale]/(public)/page.tsx — Hero
<section className="relative min-h-[90vh] flex items-center overflow-hidden">
  {/* Background image/video */}
  <div className="absolute inset-0 z-0">
    <img
      src="/images/hero-music.jpg"
      alt=""
      className="object-cover w-full h-full"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
  </div>
  
  <div className="relative z-10 container mx-auto px-4 text-white text-center">
    <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
      {t('Landing.heroTitle')}
    </h1>
    <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
      {t('Landing.heroSubtitle')}
    </p>
    <div className="flex flex-wrap gap-4 justify-center">
      <Button size="lg" asChild>
        <Link href="/register">{t('Landing.registerCta')}</Link>
      </Button>
      <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20" asChild>
        <Link href="/about">{t('Landing.findConservatory')}</Link>
      </Button>
    </div>
  </div>
</section>
```

### 3.4 Stats Bar

```tsx
<section className="bg-primary text-primary-foreground py-8">
  <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
    {[
      { value: stats.conservatoriumCount, label: t('Landing.statConservatories') },
      { value: formatNumber(stats.totalLessons), label: t('Landing.statLessons') },
      { value: `${stats.parentSatisfaction}%`, label: t('Landing.statSatisfaction') },
      { value: `+${stats.studentCount.toLocaleString()}`, label: t('Landing.statStudents') },
    ].map(stat => (
      <div key={stat.label}>
        <div className="text-3xl font-bold">{stat.value}</div>
        <div className="text-sm opacity-80">{stat.label}</div>
      </div>
    ))}
  </div>
</section>
```

### 3.5 Find Conservatory (Inline Search)

```tsx
<section className="py-16 bg-muted/30">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-2">{t('Landing.findTitle')}</h2>
    <p className="text-muted-foreground text-center mb-8">{t('Landing.findSubtitle')}</p>
    
    {/* Inline search bar */}
    <div className="flex flex-wrap gap-3 max-w-3xl mx-auto mb-10 bg-background rounded-xl p-4 shadow-sm">
      <Input
        placeholder={t('Landing.searchPlaceholder')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="flex-1 min-w-48"
      />
      <CitySelect value={city} onChange={setCity} className="w-40" />
      <InstrumentSelect value={instrument} onChange={setInstrument} className="w-40" />
      <Button onClick={handleSearch}>
        <Search className="h-4 w-4 me-2" />
        {t('Common.search')}
      </Button>
    </div>
    
    {/* Featured conservatories */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {featuredConservatoriums.map(cons => (
        <ConservatoriumCard key={cons.id} conservatorium={cons} />
      ))}
    </div>
    
    <div className="text-center mt-8">
      <Button variant="outline" asChild>
        <Link href="/about">{t('Landing.viewAll', { count: totalConservatoriums })}</Link>
      </Button>
    </div>
  </div>
</section>
```

### 3.6 How It Works

```tsx
<section className="py-16">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-bold text-center mb-12">{t('Landing.howItWorksTitle')}</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { step: 1, icon: Search, title: t('Landing.step1Title'), desc: t('Landing.step1Desc') },
        { step: 2, icon: ClipboardList, title: t('Landing.step2Title'), desc: t('Landing.step2Desc') },
        { step: 3, icon: Music, title: t('Landing.step3Title'), desc: t('Landing.step3Desc') },
      ].map(({ step, icon: Icon, title, desc }) => (
        <div key={step} className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div className="text-4xl font-bold text-primary/30 mb-2">{step}</div>
          <h3 className="font-bold text-lg mb-2">{title}</h3>
          <p className="text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>
```

---

## 4. Teacher Profile Enhancement (Issue #29)

### 4.1 Teacher Data Model — Bio Extension

```typescript
interface Teacher {
  // ... existing fields ...
  bio: {
    he: string;
    en?: string;
    ru?: string;
    ar?: string;
  };
  videoUrl?: string;              // YouTube embed for teacher intro
  education?: string[];           // degrees, institutions
  performanceCredits?: string[];  // notable performances/orchestras
  teachingPhilosophy?: {
    he?: string;
    en?: string;
  };
  availableForNewStudents: boolean;
  lessonDurationsOffered: (30 | 45 | 60)[];
}
```

### 4.2 Teacher Profile Admin Edit

In the teacher's dashboard profile editor (`/dashboard/teacher/profile`):

```tsx
<Tabs defaultValue="basic">
  <TabsList>
    <TabsTrigger value="basic">{t('TeacherProfile.basicInfo')}</TabsTrigger>
    <TabsTrigger value="bio">{t('TeacherProfile.bio')}</TabsTrigger>
    <TabsTrigger value="education">{t('TeacherProfile.education')}</TabsTrigger>
  </TabsList>
  
  <TabsContent value="bio">
    <div className="space-y-4">
      <Label>{t('TeacherProfile.bioHe')}</Label>
      <Textarea rows={6} value={bio.he} onChange={...} dir="rtl" />
      
      <Label>{t('TeacherProfile.bioEn')}</Label>
      <Textarea rows={6} value={bio.en} onChange={...} dir="ltr" />
      
      <Label>{t('TeacherProfile.videoUrl')}</Label>
      <Input value={videoUrl} onChange={...} placeholder="https://youtube.com/..." />
      
      <Switch checked={availableForNewStudents} onCheckedChange={...} />
      <Label>{t('TeacherProfile.availableForNewStudents')}</Label>
    </div>
  </TabsContent>
</Tabs>
```

---

## 5. Site-Wide Production Readiness Review (Issue #31)

### 5.1 Critical Gaps Checklist

| Area | Gap | SDD Reference |
|------|-----|---------------|
| Auth | No OAuth | SDD-FIX-17 |
| Forms | Invisible in Forms section | SDD-FIX-13 |
| i18n | Gibberish from PowerShell | SDD-FIX-16 |
| Approvals | Bulk actions broken, i18n crash | SDD-FIX-05 |
| Registration | Missing instruments/packages config | SDD-FIX-04 |
| Events | Not editable, no ticket booking | SDD-FIX-06 |
| Schedule | No filters, hard to read | SDD-FIX-11 |
| Payroll | RTL broken, no CSV export | SDD-FIX-12 |
| Rooms | Free text instruments, dumb allocation | SDD-FIX-10 |
| Rentals | Signature on wrong device, no billing | SDD-FIX-09 |

### 5.2 Performance Targets

- Lighthouse performance score ≥ 80 on mobile
- First Contentful Paint < 2s
- All images use `next/image` with `sizes` and `priority` on hero
- API routes use ISR where data is semi-static (conservatorium list, teacher list)

### 5.3 SEO Essentials

```tsx
// src/app/[locale]/(public)/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: 'Harmonia — מוזיקה לכל ילד',
    description: 'רשת קונסרבטוריונים מוזיקליים מקצועיים ברחבי ישראל.',
    openGraph: {
      title: 'Harmonia',
      description: 'Professional music conservatories across Israel.',
      images: ['/images/og-harmonia.jpg'],
    },
    alternates: {
      canonical: 'https://harmonia.co.il',
      languages: {
        he: 'https://harmonia.co.il/he',
        en: 'https://harmonia.co.il/en',
      },
    },
  };
}
```

### 5.4 Payment Gateway Strategy (Issue #25 — Playing School)

**Phase 1 (Demo):** Admin selects payment method in Site Settings:
- `manual` — display bank transfer details / phone payment instructions
- `cardcom` — Israeli gateway (most common for non-profits)
- `tranzila` — alternative Israeli gateway
- `stripe` — international

```typescript
interface SitePaymentConfig {
  gateway: 'manual' | 'cardcom' | 'tranzila' | 'stripe';
  // Per-gateway credentials — stored encrypted in Firestore:
  cardcomTerminalId?: string;
  tranzilaSupplier?: string;
  stripePublishableKey?: string;
  manualPaymentInstructions?: { he: string; en: string };
}
```

**Phase 2 (Per-Conservatorium):** Each conservatorium registers its own gateway credentials in settings.

---

## 6. i18n Keys Required

```json
{
  "Landing": {
    "heroTitle": "כי מוזיקה היא לא רק להרשות לעצמם",
    "heroSubtitle": "כל הרגשות, קצת הנחמה, מאפשרת לנו ללחוץ מכסות בלהמשיך לגדול ולהתקדם",
    "registerCta": "הרשמה עכשיו",
    "findConservatory": "מצא קונסרבטוריון",
    "statConservatories": "קונסרבטוריונים",
    "statLessons": "שיעורים בשנה",
    "statSatisfaction": "שביעות רצון הורים",
    "statStudents": "תלמידים פעילים",
    "findTitle": "מצא את הקונסרבטוריון שלך",
    "findSubtitle": "רשת קונסרבטוריונים מוזיקליים מקצועיים — לכל גיל, לכל כלי",
    "searchPlaceholder": "חפש לפי עיר, שם...",
    "viewAll": "כל {{count}} הקונסרבטוריונים",
    "howItWorksTitle": "איך זה עובד?",
    "step1Title": "מצא קונסרבטוריון",
    "step1Desc": "חפש לפי עיר, כלי נגינה או מורה",
    "step2Title": "הירשם בקלות",
    "step2Desc": "הרשמה מהירה דרך האפליקציה",
    "step3Title": "התחל ללמוד",
    "step3Desc": "שיעורים בהתאמה אישית עם מורים מנוסים"
  },
  "About": {
    "viewBio": "ראה פרופיל מלא",
    "bookWithTeacher": "הירשם לשיעור עם מורה זה",
    "loadMoreTeachers": "הצג עוד {{count}} מורים"
  },
  "TeacherProfile": {
    "basicInfo": "פרטים בסיסיים",
    "bio": "ביוגרפיה",
    "education": "השכלה",
    "bioHe": "ביוגרפיה (עברית)",
    "bioEn": "Biography (English)",
    "videoUrl": "קישור וידאו",
    "availableForNewStudents": "פתוח לתלמידים חדשים"
  }
}
```

---

## 7. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | About page in English | All labels in English; instrument names translated |
| 2 | About page teacher grid | All teachers shown; "Load More" button appears when >12 |
| 3 | Click teacher card | Bio sheet expands with full bio, education, availability |
| 4 | Landing page loads | Hero, stats, how-it-works, featured teachers all visible |
| 5 | Landing — search by city | Conservatories filtered on About page |
| 6 | Mobile landing page | Score ≥ 80 Lighthouse, hero fits viewport |
| 7 | Teacher edits bio | Saved in Hebrew + English; appears on public profile |
| 8 | Admin sets payment gateway to "Cardcom" | Registration flow shows Cardcom payment step |
| 9 | Instrument filter on About page | Populated from conservatories' configured instruments, translated |
