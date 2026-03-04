# SDD-FIX-06: Events Enhancement — Editing, Venue, AI Poster & Seat Booking

**PDF Issue:** #9  
**Priority:** P1  
**Status:** ✅ Basic event view exists — major feature gaps

---

## 1. Overview

The Events module needs substantial enhancement:
1. Event details are not editable.
2. No venue/location management.
3. No AI poster generation.
4. No seat booking (paid/free differentiation, seat map).

---

## 2. Event Data Model Extension

```typescript
interface Event {
  // Existing fields:
  id: string;
  conservatoriumId: string;
  title: { he: string; en: string; ru?: string; ar?: string };
  date: string;
  time: string;
  
  // New fields:
  description: { he: string; en: string; ru?: string; ar?: string };
  venue: EventVenue;
  posterUrl?: string;         // AI or manually uploaded
  isFree: boolean;
  ticketPrices?: TicketTier[];
  totalSeats?: number;
  seatMapUrl?: string;        // SVG seat map
  bookedSeats?: BookedSeat[];
  performers: EventPerformer[];
  program: PerformanceProgram[];  // existing
  tags: string[];
  publishedAt?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
}

interface EventVenue {
  name: { he: string; en: string };
  address: string;
  googleMapsUrl?: string;
  capacity: number;
  isOnline: boolean;
  streamUrl?: string;
}

interface TicketTier {
  id: string;
  name: { he: string; en: string };
  priceILS: number;
  availableCount: number;
  description?: string;
}

interface BookedSeat {
  userId: string;
  tierId: string;
  seatNumber?: string;
  bookingRef: string;
  paidAt?: string;
}

interface EventPerformer {
  userId?: string;          // if registered user
  displayName: string;
  instrument: string;
  role: 'soloist' | 'ensemble' | 'accompanist' | 'conductor';
}
```

---

## 3. Event Edit Form

**Route:** `/dashboard/events/[id]/edit`

Add an "Edit Event Details" button (pencil icon) to the event detail page. Opens a full edit form with tabs:

**Tab 1: Basic Details**
- Title (multilingual input)
- Date + Time picker
- Description (markdown editor, multilingual)
- Tags (multi-select)
- Status (draft/published)

**Tab 2: Venue**
```tsx
<div className="space-y-4">
  <FormField name="venue.name.he" label={t('Events.venueName')} />
  <FormField name="venue.address" label={t('Events.venueAddress')} />
  <FormField name="venue.googleMapsUrl" label={t('Events.googleMapsUrl')} type="url" />
  <FormField name="venue.capacity" label={t('Events.capacity')} type="number" />
  <FormField name="venue.isOnline" label={t('Events.isOnline')} type="toggle" />
  {venue.isOnline && (
    <FormField name="venue.streamUrl" label={t('Events.streamUrl')} type="url" />
  )}
</div>
```

**Tab 3: Tickets**
```tsx
<div className="space-y-4">
  <div className="flex items-center gap-3">
    <Switch checked={event.isFree} onCheckedChange={setIsFree} />
    <Label>{t('Events.isFreeEvent')}</Label>
  </div>
  
  {!event.isFree && (
    <div className="space-y-3">
      <Label>{t('Events.ticketTiers')}</Label>
      {ticketTiers.map((tier, i) => (
        <TicketTierRow key={i} tier={tier} onChange={...} onRemove={...} />
      ))}
      <Button variant="outline" size="sm" onClick={addTier}>
        {t('Events.addTier')}
      </Button>
    </div>
  )}
</div>
```

**Tab 4: AI Poster**
```tsx
<div className="space-y-4">
  {event.posterUrl && (
    <img src={event.posterUrl} alt="Current poster" className="rounded-lg max-h-64 object-contain" />
  )}
  
  <Button onClick={generateAiPoster} disabled={isGenerating}>
    {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
    {t('Events.generatePoster')}
  </Button>
  
  <p className="text-sm text-muted-foreground">{t('Events.posterHint')}</p>
  
  {/* Manual upload fallback */}
  <FileUpload
    accept="image/*"
    onUpload={(url) => setEvent(prev => ({ ...prev, posterUrl: url }))}
    label={t('Events.uploadPoster')}
  />
</div>
```

---

## 4. AI Poster Generation

**Genkit flow** (`src/ai/flows/generate-event-poster.ts`):

```typescript
import { generate } from '@genkit-ai/ai';
import { imagen } from '@genkit-ai/googleai';

export async function generateEventPoster(event: Event): Promise<string> {
  const prompt = buildPosterPrompt(event);
  
  const result = await generate({
    model: imagen('imagen-3.0-generate-001'),
    prompt,
    output: { format: 'media' },
    config: {
      aspectRatio: '2:3',   // portrait poster
      safetySettings: 'block_none',
    }
  });
  
  const imageUrl = await uploadToStorage(result.media.url, `events/${event.id}/poster.jpg`);
  return imageUrl;
}

function buildPosterPrompt(event: Event): string {
  return `
    Professional concert/recital event poster for a music conservatory.
    Event: "${event.title.en}"
    Date: ${event.date} at ${event.time}
    Venue: ${event.venue.name.en}
    Style: Elegant, classical music aesthetic. Hebrew text direction right-to-left.
    Color scheme: Deep purple/gold or navy/gold. No text — text will be overlaid separately.
    Clean background that allows text overlay. High contrast.
  `.trim();
}
```

**Note:** The generated image is a background; text overlay (event name, date, performers) is done in-browser using Canvas API or a React canvas component.

---

## 5. Seat Booking (Public-Facing)

**Route:** `/events/[id]/book`

The booking flow (3 steps):
1. **Select seats** — interactive seat map (SVG) or ticket tier quantity selector
2. **Attendee details** — name, email, phone
3. **Payment** — for paid events, redirect to payment gateway

```tsx
// Step 1 for events without seat map (just quantity):
{ticketTiers.map(tier => (
  <div key={tier.id} className="flex items-center justify-between p-4 border rounded-lg">
    <div>
      <p className="font-medium">{getTierName(tier, locale)}</p>
      <p className="text-sm text-muted-foreground">
        {tier.priceILS === 0 ? t('Events.free') : `₪${tier.priceILS}`}
      </p>
    </div>
    <QuantitySelector
      value={quantities[tier.id] ?? 0}
      max={tier.availableCount}
      onChange={(qty) => setQuantity(tier.id, qty)}
    />
  </div>
))}
```

---

## 6. Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin clicks "Edit Event" | Full edit form opens with all tabs |
| 2 | Admin fills venue with Google Maps URL | URL saved, displayed as clickable link on public event page |
| 3 | Admin clicks "Generate AI Poster" | Loading state → poster image appears after ~10s |
| 4 | Admin sets event as "Free" | Ticket tier section hidden |
| 5 | Admin sets event as "Paid" with 2 tiers | Booking page shows both tiers with prices |
| 6 | User books a free event | Confirmation email sent, seat count decremented |
| 7 | Event at capacity | "Sold Out" shown, booking disabled |
