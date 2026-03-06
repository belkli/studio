import { describe, expect, it } from 'vitest';
import { allocateRoomWithConflictResolution, resolveInstrumentId } from '@/lib/room-allocation';
import type { ConservatoriumInstrument, LessonSlot, Room } from '@/lib/types';

const conservatoriumInstruments: ConservatoriumInstrument[] = [
  {
    id: 'piano',
    conservatoriumId: 'cons-a',
    instrumentCatalogId: 'piano',
    names: { he: '?????', en: 'Piano', ru: '???????', ar: '?????' },
    isActive: true,
    teacherCount: 1,
    availableForRegistration: true,
    availableForRental: true,
  },
];

function makeRoom(id: string, conservatoriumId: string, equipmentId: string): Room {
  return {
    id,
    conservatoriumId,
    branchId: 'branch-1',
    name: id,
    capacity: 2,
    instrumentEquipment: [{ instrumentId: equipmentId, quantity: 1 }],
    blocks: [],
    isActive: true,
  };
}

function makeLesson(roomId: string, conservatoriumId: string): LessonSlot {
  return {
    id: 'lesson-1',
    conservatoriumId,
    teacherId: 't-1',
    studentId: 's-1',
    instrument: 'piano',
    startTime: '2026-03-10T10:00:00.000Z',
    durationMinutes: 45,
    type: 'RECURRING',
    bookingSource: 'ADMIN',
    roomId,
    isVirtual: false,
    isCreditConsumed: false,
    status: 'SCHEDULED',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };
}

describe('room-allocation', () => {
  it('normalizes instrument via localized names', () => {
    const resolved = resolveInstrumentId('?????', conservatoriumInstruments);
    expect(resolved).toBe('piano');
  });

  it('never allocates rooms from another conservatorium', () => {
    const rooms = [
      makeRoom('room-a-1', 'cons-a', 'piano'),
      makeRoom('room-b-1', 'cons-b', 'piano'),
    ];

    const existingLessons = [makeLesson('room-a-1', 'cons-a')];

    const result = allocateRoomWithConflictResolution({
      lesson: {
        instrument: 'piano',
        startTime: '2026-03-10T10:00:00.000Z',
        durationMinutes: 45,
        conservatoriumId: 'cons-a',
      },
      rooms,
      existingLessons,
      conservatoriumInstruments,
    });

    expect(result.action).toBe('no_room_available');
  });
});
