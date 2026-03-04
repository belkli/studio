# SDD-FIX-08: Open Day & Performances — Management, Kanban Redesign & Location Filter

**PDF Issues:** #10, #11, #27  
**Priority:** P1

---

## 1. Open Day Management (Issue #10)

### Problem
The admin Open Day page only displays registered visitors — no ability to edit, manage, or assign teachers to sessions.

### Enhanced Admin Open Day Features

**Data model addition:**
```typescript
interface OpenDaySession {
  id: string;
  openDayId: string;
  time: string;           // "HH:MM"
  instrument: string;
  teacherId: string;
  roomId?: string;
  maxAttendees: number;
  registrations: OpenDayRegistration[];
}

interface OpenDayRegistration {
  id: string;
  visitorName: string;
  visitorPhone: string;
  childName: string;
  childAge: number;
  instrument: string;
  sessionId?: string;     // assigned session
  status: 'pending' | 'confirmed' | 'attended' | 'no_show';
  notes?: string;
}
```

**Admin UI enhancements:**

```tsx
// Tab 1: Sessions Management
<div className="space-y-4">
  <div className="flex justify-between">
    <h3>{t('OpenDay.sessions')}</h3>
    <Button onClick={addSession}>{t('OpenDay.addSession')}</Button>
  </div>
  
  {sessions.map(session => (
    <OpenDaySessionCard
      key={session.id}
      session={session}
      onEdit={editSession}
      onAssignTeacher={assignTeacher}
      registrations={registrations.filter(r => r.sessionId === session.id)}
    />
  ))}
</div>

// Tab 2: Registrations
<DataTable
  columns={[
    { key: 'childName', label: t('OpenDay.childName') },
    { key: 'instrument', label: t('OpenDay.instrument') },
    { key: 'status', label: t('OpenDay.status') },
    { key: 'session', label: t('OpenDay.assignedSession') },
    { key: 'actions', label: '', render: (reg) => (
      <div className="flex gap-2">
        <SessionAssignButton registration={reg} sessions={sessions} />
        <StatusUpdateButton registration={reg} />
        <NotesButton registration={reg} />
      </div>
    )}
  ]}
  data={registrations}
/>
```

### Public Open Day Page (Issue #27) — City/Distance Filter

```tsx
// src/app/[locale]/open-day/page.tsx
<div className="flex flex-wrap gap-3 mb-8">
  <CitySelect value={city} onChange={setCity} />
  <DistanceSelect
    value={distance}
    onChange={setDistance}
    userLocation={userLocation}
  />
  <InstrumentSelect value={instrument} onChange={setInstrument} />
  <DateRangePicker value={dateRange} onChange={setDateRange} />
</div>
```

---

## 2. Performances Kanban Redesign (Issue #11)

### Problem
The Performances kanban board is hard to read with horizontal scroll across 4 columns. On narrow screens it's unusable.

### Redesign: Tabbed List View as Default + Optional Kanban

**New layout:**
```tsx
// src/app/[locale]/dashboard/performances/page.tsx

<div className="space-y-4">
  {/* View toggle */}
  <div className="flex items-center justify-between">
    <h1>{t('Performances.title')}</h1>
    <div className="flex gap-2">
      <Button
        variant={view === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setView('list')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={view === 'kanban' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setView('kanban')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  </div>
  
  {view === 'list' ? (
    <PerformanceListView performances={performances} />
  ) : (
    <PerformanceKanbanView performances={performances} />
  )}
</div>
```

**List View** (default):
```tsx
const PerformanceListView = ({ performances }) => (
  <Tabs defaultValue="new">
    <TabsList>
      <TabsTrigger value="new">{t('Performances.statusNew')}</TabsTrigger>
      <TabsTrigger value="manager_review">{t('Performances.statusManagerReview')}</TabsTrigger>
      <TabsTrigger value="music_review">{t('Performances.statusMusicReview')}</TabsTrigger>
      <TabsTrigger value="price_offered">{t('Performances.statusPriceOffered')}</TabsTrigger>
    </TabsList>
    
    {['new', 'manager_review', 'music_review', 'price_offered'].map(status => (
      <TabsContent key={status} value={status}>
        <PerformanceTable
          performances={performances.filter(p => p.status === status)}
          onStatusChange={updateStatus}
        />
      </TabsContent>
    ))}
  </Tabs>
);
```

**Kanban View** (improved): 
- Limit column width to `min(280px, 100vw - 32px)`
- Use `overflow-x: auto` on the container with snap scrolling
- Each card is compact: title + date + contact name only, expandable on click
- Column headers show item count badge

```tsx
const PerformanceKanbanView = ({ performances }) => (
  <div
    className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
    style={{ scrollbarWidth: 'thin' }}
  >
    {PERFORMANCE_COLUMNS.map(col => (
      <div
        key={col.id}
        className="flex-shrink-0 w-72 snap-start"
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur pb-2 mb-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{t(`Performances.status_${col.id}`)}</h3>
            <Badge variant="secondary">
              {performances.filter(p => p.status === col.id).length}
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          {performances
            .filter(p => p.status === col.id)
            .map(perf => <PerformanceCard key={perf.id} performance={perf} compact />)}
        </div>
      </div>
    ))}
  </div>
);
```

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Admin opens Open Day management | Two tabs: Sessions + Registrations |
| 2 | Admin adds session with teacher | Session saved with teacher name displayed |
| 3 | Admin assigns registration to session | Registration shows session info |
| 4 | Public Open Day page | City/distance/instrument/date filters visible and functional |
| 5 | Performances page loads | Default: tabbed list view, easily readable |
| 6 | Switch to Kanban | 4 columns with horizontal snap scroll, column counts shown |
| 7 | Kanban on mobile | Single column visible with swipe to next |
