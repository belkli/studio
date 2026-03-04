# SDD-FIX-10: Smart Room Assignment — Instrument Taxonomy & AI Allocation

**PDF Issue:** #13  
**Priority:** P1

---

## 1. Overview

The Branches > Rooms module has two problems:
1. Instrument field is free text — no normalization, causing matching failures.
2. No intelligent room allocation: a violin student could be placed in the drum room, wasting the piano room.

The goal is a **self-managing room system** that requires zero secretary intervention for routine scheduling.

---

## 2. Instrument Taxonomy (Replace Free Text)

### Problem
Room's `instruments` field is `string` (free text). "grand piano" ≠ "piano" ≠ "פסנתר".

### Fix

**Room data model:**
```typescript
interface Room {
  id: string;
  conservatoriumId: string;
  branchId: string;
  name: string;
  capacity: number;
  
  // NEW: structured instrument equipment
  instrumentEquipment: RoomInstrumentEquipment[];
  
  // NEW: blocking
  blocks: RoomBlock[];
  
  isActive: boolean;
}

interface RoomInstrumentEquipment {
  instrumentId: string;   // references ConservatoriumInstrument.id
  quantity: number;
  notes?: string;         // e.g. "Steinway grand", "upright only"
}

interface RoomBlock {
  id: string;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  blockedByUserId: string;
}
```

**Room edit UI:**
Replace the free-text instrument input with a structured equipment list:

```tsx
<div className="space-y-3">
  <Label>{t('Rooms.instrumentEquipment')}</Label>
  {equipment.map((equip, i) => (
    <div key={i} className="flex items-center gap-3">
      <InstrumentSelect
        conservatoriumId={conservatoriumId}
        value={equip.instrumentId}
        onChange={(id) => updateEquipment(i, 'instrumentId', id)}
      />
      <Input
        type="number"
        min={1}
        max={10}
        value={equip.quantity}
        onChange={(e) => updateEquipment(i, 'quantity', parseInt(e.target.value))}
        className="w-20"
      />
      <Button variant="ghost" size="icon" onClick={() => removeEquipment(i)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  ))}
  <Button variant="outline" size="sm" onClick={addEquipment}>
    {t('Rooms.addEquipment')}
  </Button>
</div>
```

---

## 3. Smart Room Allocation Algorithm

### 3.1 Instrument Compatibility Matrix

Each instrument has a **preferred room type** and **compatible room types**:

```typescript
const INSTRUMENT_ROOM_COMPATIBILITY: Record<string, {
  preferred: string[];   // instrumentIds that make a room ideal
  acceptable: string[];  // instrumentIds — room is OK
  incompatible: string[]; // instrumentIds — room is last resort
}> = {
  'piano': {
    preferred: ['piano'],
    acceptable: [],
    incompatible: ['drums', 'organ'],  // loud instruments
  },
  'violin': {
    preferred: [],           // no special equipment needed
    acceptable: ['piano', 'cello', 'harp'],
    incompatible: ['drums'],
  },
  'drums': {
    preferred: ['drums'],
    acceptable: [],
    incompatible: ['piano', 'violin', 'flute'],  // needs sound isolation
  },
  'voice': {
    preferred: ['piano'],
    acceptable: [],
    incompatible: ['drums'],
  },
  // ... etc
};
```

### 3.2 Allocation Priority Scoring

When assigning a room for a lesson (instrument X, time T):

```typescript
function scoreRoom(room: Room, instrumentId: string, time: TimeSlot): number {
  let score = 100;
  
  const compat = INSTRUMENT_ROOM_COMPATIBILITY[instrumentId];
  const roomInstruments = room.instrumentEquipment.map(e => e.instrumentId);
  
  // Equipment match bonuses
  if (roomInstruments.some(id => compat?.preferred.includes(id))) score += 50;
  if (roomInstruments.some(id => compat?.acceptable.includes(id))) score += 10;
  if (roomInstruments.some(id => compat?.incompatible.includes(id))) score -= 80;
  
  // Prefer rooms with REQUIRED equipment for other instruments
  // (save them for lessons that need them)
  const roomHasRequiredEquipment = roomInstruments.includes('piano') || roomInstruments.includes('drums');
  const lessonNeedsRoomEquipment = compat?.preferred.length > 0;
  
  if (roomHasRequiredEquipment && !lessonNeedsRoomEquipment) score -= 30;
  
  // Prefer smaller rooms for fewer students
  score -= room.capacity * 2;
  
  return score;
}

function allocateRoom(
  lesson: { instrument: string; teacherId: string; startTime: string; endTime: string },
  availableRooms: Room[]
): Room | null {
  const scored = availableRooms
    .filter(room => !isRoomBlocked(room, lesson.startTime, lesson.endTime))
    .map(room => ({ room, score: scoreRoom(room, lesson.instrument, lesson) }))
    .sort((a, b) => b.score - a.score);
  
  return scored[0]?.room ?? null;
}
```

### 3.3 Smart Re-allocation (Conflict Resolution)

When a new lesson needs the drums room but it's occupied by a violin student:

```typescript
async function resolveRoomConflict(
  newLesson: Lesson,
  conflictingLesson: Lesson,
  rooms: Room[]
): Promise<ReallocationResult> {
  // Can we move the conflicting lesson to another room?
  const alternativeForConflicting = rooms
    .filter(r => r.id !== conflictingLesson.roomId)
    .filter(r => !isRoomBlocked(r, conflictingLesson.startTime, conflictingLesson.endTime))
    .map(r => ({ room: r, score: scoreRoom(r, conflictingLesson.instrument, conflictingLesson) }))
    .sort((a,b) => b.score - a.score)[0];
  
  if (alternativeForConflicting && alternativeForConflicting.score > 0) {
    return {
      action: 'reallocate_existing',
      existingLessonNewRoom: alternativeForConflicting.room,
      newLessonRoom: conflictingLesson.room, // freed up
    };
  }
  
  // Can the new lesson use a suboptimal room?
  const suboptimalForNew = allocateRoom(newLesson, rooms);
  if (suboptimalForNew) {
    return { action: 'assign_suboptimal', newLessonRoom: suboptimalForNew };
  }
  
  return { action: 'no_room_available' };
}
```

### 3.4 Manual Room Blocking

```tsx
// In Room management page:
<Button variant="outline" onClick={() => setShowBlockDialog(true)}>
  {t('Rooms.blockRoom')}
</Button>

<Dialog open={showBlockDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('Rooms.blockRoomTitle')}</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <DateTimePicker label={t('Rooms.blockFrom')} value={blockStart} onChange={setBlockStart} />
      <DateTimePicker label={t('Rooms.blockUntil')} value={blockEnd} onChange={setBlockEnd} />
      <Input
        placeholder={t('Rooms.blockReason')}
        value={blockReason}
        onChange={(e) => setBlockReason(e.target.value)}
      />
    </div>
    <DialogFooter>
      <Button onClick={saveBlock}>{t('Common.save')}</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Acceptance Criteria

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Edit room → instrument field | Structured dropdown from conservatorium instruments list |
| 2 | Violin lesson scheduled | System prefers room WITHOUT piano (saves piano room for piano lessons) |
| 3 | Drums makeup lesson requested — drums room occupied by violin | System moves violin to any other room, gives drums room to drums lesson |
| 4 | No suitable room available | Admin notified: "No available room for [instrument] at [time]" |
| 5 | Admin blocks room for maintenance | Blocked slot appears in room calendar, no lessons scheduled |
| 6 | Room block expires | Room automatically becomes available again |
