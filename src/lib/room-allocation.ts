import type { ConservatoriumInstrument, LessonSlot, Room } from '@/lib/types';

const REQUIRED_EQUIPMENT_IDS = new Set(['piano', 'drums', 'organ']);

const INSTRUMENT_ROOM_COMPATIBILITY: Record<string, { preferred: string[]; acceptable: string[]; incompatible: string[] }> = {
  piano: { preferred: ['piano'], acceptable: [], incompatible: ['drums', 'organ'] },
  violin: { preferred: [], acceptable: ['piano', 'cello', 'harp'], incompatible: ['drums'] },
  drums: { preferred: ['drums'], acceptable: [], incompatible: ['piano', 'violin', 'flute'] },
  voice: { preferred: ['piano'], acceptable: [], incompatible: ['drums'] },
  flute: { preferred: [], acceptable: ['piano'], incompatible: ['drums'] },
  cello: { preferred: [], acceptable: ['piano'], incompatible: ['drums'] },
  guitar: { preferred: [], acceptable: ['piano'], incompatible: ['drums'] },
  clarinet: { preferred: [], acceptable: ['piano'], incompatible: ['drums'] },
  saxophone: { preferred: [], acceptable: ['piano'], incompatible: ['drums'] },
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0591-\u05C7]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export function resolveInstrumentId(rawInstrument: string, conservatoriumInstruments: ConservatoriumInstrument[]): string {
  const normalized = normalize(rawInstrument);
  const byId = conservatoriumInstruments.find((item) => normalize(item.id) === normalized);
  if (byId) return byId.id;

  const byName = conservatoriumInstruments.find((item) => {
    const names = [item.names.he, item.names.en, item.names.ar || '', item.names.ru || '']
      .map((name) => normalize(name))
      .filter(Boolean);
    return names.some((name) => name === normalized || normalized.includes(name) || name.includes(normalized));
  });

  return byName?.id || rawInstrument.toLowerCase();
}

function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
}

function getLessonEnd(startTime: string, durationMinutes: number) {
  return new Date(new Date(startTime).getTime() + durationMinutes * 60_000).toISOString();
}

export function isRoomBlocked(room: Room, startTime: string, endTime: string): boolean {
  return (room.blocks || []).some((block) => overlaps(startTime, endTime, block.startDateTime, block.endDateTime));
}

export function scoreRoom(room: Room, instrumentId: string, studentCount = 1): number {
  const compat = INSTRUMENT_ROOM_COMPATIBILITY[instrumentId] || { preferred: [], acceptable: [], incompatible: [] };
  const roomInstruments = (room.instrumentEquipment || []).map((entry) => entry.instrumentId);

  let score = 100;

  if (roomInstruments.some((id) => compat.preferred.includes(id))) score += 50;
  if (roomInstruments.some((id) => compat.acceptable.includes(id))) score += 10;
  if (roomInstruments.some((id) => compat.incompatible.includes(id))) score -= 80;

  const roomHasRequiredEquipment = roomInstruments.some((id) => REQUIRED_EQUIPMENT_IDS.has(id));
  const lessonNeedsRoomEquipment = compat.preferred.length > 0;
  if (roomHasRequiredEquipment && !lessonNeedsRoomEquipment) score -= 30;

  score -= (room.capacity || 0) * 2;
  score -= Math.max(0, (studentCount || 1) - 1) * 3;

  return score;
}

function isLessonCancelled(lesson: LessonSlot) {
  return lesson.status.startsWith('CANCELLED') || lesson.status.startsWith('NO_SHOW');
}

function getConflictingLesson(lessons: LessonSlot[], roomId: string, startTime: string, endTime: string) {
  return lessons.find((lesson) => {
    if (isLessonCancelled(lesson)) return false;
    if (lesson.roomId !== roomId) return false;
    const lessonEnd = getLessonEnd(lesson.startTime, lesson.durationMinutes);
    return overlaps(startTime, endTime, lesson.startTime, lessonEnd);
  });
}

export type SmartAllocationResult =
  | { action: 'assigned'; roomId: string }
  | { action: 'reallocate_existing'; roomId: string; reallocatedLessonId: string; reallocatedRoomId: string }
  | { action: 'no_room_available' };

export function allocateRoomWithConflictResolution(input: {
  lesson: { instrument: string; startTime: string; durationMinutes: number; conservatoriumId: string; studentCount?: number };
  rooms: Room[];
  existingLessons: LessonSlot[];
  conservatoriumInstruments: ConservatoriumInstrument[];
}): SmartAllocationResult {
  const instrumentId = resolveInstrumentId(input.lesson.instrument, input.conservatoriumInstruments);
  const startTime = input.lesson.startTime;
  const endTime = getLessonEnd(startTime, input.lesson.durationMinutes);

  const candidateRooms = input.rooms
    .filter((room) => room.isActive)
    .filter((room) => !isRoomBlocked(room, startTime, endTime))
    .map((room) => ({ room, score: scoreRoom(room, instrumentId, input.lesson.studentCount || 1) }))
    .sort((a, b) => b.score - a.score);

  for (const candidate of candidateRooms) {
    const conflict = getConflictingLesson(input.existingLessons, candidate.room.id, startTime, endTime);

    if (!conflict) {
      return { action: 'assigned', roomId: candidate.room.id };
    }

    const conflictInstrumentId = resolveInstrumentId(conflict.instrument, input.conservatoriumInstruments);
    const conflictEndTime = getLessonEnd(conflict.startTime, conflict.durationMinutes);

    const alternatives = input.rooms
      .filter((room) => room.isActive)
      .filter((room) => room.id !== candidate.room.id)
      .filter((room) => !isRoomBlocked(room, conflict.startTime, conflictEndTime))
      .filter((room) => !getConflictingLesson(input.existingLessons.filter((item) => item.id !== conflict.id), room.id, conflict.startTime, conflictEndTime))
      .map((room) => ({ room, score: scoreRoom(room, conflictInstrumentId) }))
      .sort((a, b) => b.score - a.score);

    const bestAlternative = alternatives.find((item) => item.score > 0);
    if (bestAlternative) {
      return {
        action: 'reallocate_existing',
        roomId: candidate.room.id,
        reallocatedLessonId: conflict.id,
        reallocatedRoomId: bestAlternative.room.id,
      };
    }
  }

  return { action: 'no_room_available' };
}