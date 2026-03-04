# SDD-FIX-15: Conservatorium Profile — RTL, Opening Hours, Maps & "What's New"

**PDF Issues:** #20, #21  
**Priority:** P1

---

## 1. "What's New" Section (Issue #20)

### Problem
The "What's New" (מה חדש) section is not working — unclear what it's supposed to show.

### Design Decision
"What's New" = a feed of recent activity relevant to the logged-in user:
- New announcements
- Upcoming events
- New master classes available
- Changes to their schedule
- Payment reminders
- New forms to fill

### Implementation

```tsx
// src/app/[locale]/dashboard/page.tsx (or a dedicated widget)
<WhatsNewFeed userId={authUser.id} role={authUser.role} />
```

```typescript
// src/hooks/useWhatsNew.ts
function useWhatsNew(userId: string, role: UserRole) {
  const items: WhatsNewItem[] = [
    ...getRecentAnnouncements(userId),
    ...getUpcomingEvents(userId),
    ...getPendingForms(userId),
    ...getScheduleChanges(userId),
    ...getPaymentReminders(userId),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 10); // Show latest 10 items
  
  return items;
}

interface WhatsNewItem {
  id: string;
  type: 'announcement' | 'event' | 'form' | 'schedule_change' | 'payment' | 'master_class';
  title: string;
  description: string;
  createdAt: string;
  link?: string;
  isRead: boolean;
}
```

---

## 2. Conservatorium Profile — RTL & Translation Fixes (Issue #21)

### 2.1 RTL Issues

Apply standard RTL fixes throughout `src/app/[locale]/dashboard/settings/conservatorium/profile/page.tsx`:
- Page title: `text-start`
- Tab list: `dir={isRtl ? 'rtl' : 'ltr'}`
- All form labels: `text-start`
- Remove any `text-left` or `text-right` hardcoded classes

### 2.2 Middle Screen Scroll Fix

The profile page has an annoying middle-scroll behavior (likely a nested div with fixed height + overflow-y):
```tsx
// Find and fix the scroll container:
// WRONG:
<div className="h-[600px] overflow-y-auto">

// FIX: let the page scroll naturally
<div className="min-h-0 flex-1">
```

### 2.3 Opening Hours — Structured Input

Replace free-text opening hours with a structured editor:

```typescript
interface OpeningHours {
  [day: string]: {  // 'sunday' | 'monday' | etc.
    isOpen: boolean;
    openTime: string;   // "HH:MM"
    closeTime: string;  // "HH:MM"
  };
}
```

```tsx
<div className="space-y-3">
  <Label>{t('Profile.openingHours')}</Label>
  {DAYS_OF_WEEK.map(day => (
    <div key={day} className="flex items-center gap-4">
      <span className="w-24 text-sm">{t(`Days.${day}`)}</span>
      <Switch
        checked={hours[day]?.isOpen ?? false}
        onCheckedChange={(open) => setDayOpen(day, open)}
      />
      {hours[day]?.isOpen && (
        <>
          <TimePicker
            value={hours[day].openTime}
            onChange={(t) => setDayTime(day, 'openTime', t)}
          />
          <span>—</span>
          <TimePicker
            value={hours[day].closeTime}
            onChange={(t) => setDayTime(day, 'closeTime', t)}
          />
        </>
      )}
    </div>
  ))}
</div>
```

Hebrew display of hours (auto-generated from structured data):
```typescript
function formatOpeningHours(hours: OpeningHours, locale: string): string {
  const openDays = Object.entries(hours)
    .filter(([_, h]) => h.isOpen)
    .map(([day, h]) => `${t(`Days.${day}`)}: ${h.openTime}–${h.closeTime}`);
  return openDays.join(', ');
}
```

### 2.4 Location with Google Maps

Replace plain text address with Google Maps integration:

```typescript
interface ConservatoriumAddress {
  streetAddress: string;
  city: string;
  postalCode?: string;
  googlePlaceId?: string;    // from Google Places API
  coordinates?: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;    // direct maps link
}
```

```tsx
// Address field with Places Autocomplete:
<GooglePlacesAutocomplete
  value={address.streetAddress}
  onSelect={(place) => {
    setAddress({
      streetAddress: place.formatted_address,
      city: extractCity(place),
      googlePlaceId: place.place_id,
      coordinates: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
      googleMapsUrl: `https://maps.google.com/?cid=${place.place_id}`,
    });
  }}
/>
```

**Note:** Requires Google Maps JavaScript API key in `.env.local`:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
```

### 2.5 Instruments — Auto-populate from Teachers

The conservatorium profile's "available instruments" should be automatically derived from the teacher roster. No manual entry needed.

```typescript
// Derived field — computed at read time:
async function getConservatoriumInstruments(conservatoriumId: string): Promise<string[]> {
  const teachers = await getTeachersByConservatorium(conservatoriumId);
  const instruments = new Set<string>();
  teachers.forEach(t => t.instruments?.forEach(i => instruments.add(i)));
  return Array.from(instruments).sort();
}
```

Display in profile (read-only, auto-generated):
```tsx
<div className="space-y-2">
  <Label>{t('Profile.instruments')}</Label>
  <p className="text-sm text-muted-foreground">{t('Profile.instrumentsAutoHint')}</p>
  <div className="flex flex-wrap gap-2">
    {derivedInstruments.map(inst => (
      <Badge key={inst} variant="secondary">{getInstrumentName(inst, locale)}</Badge>
    ))}
  </div>
</div>
```

### 2.6 Contact Information Translation

Ensure Privacy Statement Contact and Accessibility Statement Contact field labels are translated in all locales. Add to messages:
```json
{
  "Profile": {
    "privacyContact": "איש קשר לפרטיות",
    "accessibilityContact": "איש קשר לנגישות",
    "contactName": "שם איש קשר",
    "contactEmail": "אימייל",
    "contactPhone": "טלפון"
  }
}
```

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Dashboard loads → What's New | Feed shows recent announcements, events, pending forms |
| 2 | Conservatorium profile opens in Hebrew | All labels right-aligned, no left-biased elements |
| 3 | Scroll through profile page | Page scrolls naturally without inner scroll trap |
| 4 | Opening hours section | Day-by-day toggle + time pickers, not free text |
| 5 | Address field | Google Places autocomplete suggests addresses |
| 6 | Profile instruments section | Auto-populated from active teachers, no manual entry |
| 7 | Privacy contact fields | Rendered in Hebrew when locale=he |
