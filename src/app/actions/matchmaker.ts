'use server';

import type { TeacherMatchResult, User } from '@/lib/types';
import { getDb } from '@/lib/db';

export async function findTeacherMatches(answers: {
  goal: string;
  style: string;
  personality: string;
  notes?: string;
  conservatoriumId?: string;
  locale: string;
}): Promise<TeacherMatchResult[]> {
  const db = await getDb();
  const allUsers = await db.users.list();
  const teachers = allUsers.filter(
    (u) => u.role === 'teacher' && u.availableForNewStudents !== false
  );

  const { goal, style, personality, conservatoriumId } = answers;

  const scored: TeacherMatchResult[] = teachers.map((teacher) => {
    let score = 50; // base score

    // Instrument match: check if the teacher's instruments overlap with goal keywords
    const instrumentNames = (teacher.instruments || []).map((i) =>
      i.instrument.toLowerCase()
    );

    // Goal scoring
    if (goal === 'professional' || goal === 'exam') {
      if (teacher.specialties?.includes('EXAM_PREP')) score += 15;
      if (teacher.specialties?.includes('COMPETITION')) score += 10;
      if (teacher.specialties?.includes('PERFORMANCE')) score += 10;
    } else if (goal === 'fun' || goal === 'hobby') {
      if (teacher.specialties?.includes('EARLY_CHILDHOOD')) score += 10;
      if (teacher.specialties?.includes('BEGINNER_ADULTS')) score += 10;
    }

    // Style scoring
    if (style === 'structured') {
      if (teacher.specialties?.includes('THEORY')) score += 8;
      if (teacher.specialties?.includes('EXAM_PREP')) score += 5;
    } else if (style === 'creative') {
      if (teacher.specialties?.includes('JAZZ')) score += 10;
      if (teacher.specialties?.includes('PERFORMANCE')) score += 5;
    }

    // Personality scoring
    if (personality === 'patient') {
      if (teacher.specialties?.includes('EARLY_CHILDHOOD')) score += 8;
      if (teacher.specialties?.includes('SPECIAL_NEEDS')) score += 8;
    } else if (personality === 'creative') {
      if (teacher.specialties?.includes('JAZZ')) score += 8;
      if (teacher.specialties?.includes('PERFORMANCE')) score += 5;
    }

    // Premium teachers get a small boost
    if (teacher.isPremiumTeacher) score += 5;

    // Conservatorium match gives a significant boost
    if (conservatoriumId && teacher.conservatoriumId === conservatoriumId) {
      score += 15;
    }

    // High rating boost
    if (teacher.teacherRatingAvg && teacher.teacherRatingAvg >= 4.5) {
      score += 8;
    }

    // Availability bonus: teachers with more slots are easier to schedule
    if (teacher.availability && teacher.availability.length >= 3) {
      score += 5;
    }

    // Cap score at 100
    score = Math.min(score, 100);

    const matchReason = buildMatchReason(teacher, goal, style, personality);

    const nextSlot = teacher.availability?.[0];

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      conservatoriumId: teacher.conservatoriumId,
      conservatoriumName: teacher.conservatoriumName,
      score,
      matchReason,
      instruments: instrumentNames,
      specialties: teacher.specialties || [],
      avatarUrl: teacher.avatarUrl,
      isPremiumTeacher: teacher.isPremiumTeacher,
      tags: buildTags(teacher, goal, personality),
      nextAvailableSlot: nextSlot
        ? { day: nextSlot.dayOfWeek, time: nextSlot.startTime }
        : undefined,
    };
  });

  // Sort by score descending, return top 5
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}

function buildMatchReason(
  teacher: User,
  goal: string,
  style: string,
  personality: string
): string {
  const specialties = teacher.specialties || [];

  if (personality === 'patient' && specialties.includes('EARLY_CHILDHOOD')) {
    return 'מורה סבלנית עם ניסיון בהדרכת מתחילים ומתקדמים';
  }
  if (
    style === 'structured' &&
    (specialties.includes('THEORY') || specialties.includes('EXAM_PREP'))
  ) {
    return 'גישה מובנית ומסודרת, מתאימה לתלמידים שמעדיפים סדר';
  }
  if (
    personality === 'creative' &&
    (specialties.includes('JAZZ') || specialties.includes('PERFORMANCE'))
  ) {
    return 'מורה יצירתי עם דגש על ביטוי אישי ואלתור';
  }
  if (goal === 'professional' || goal === 'exam') {
    return 'מורה מנוסה עם רקע מקצועי מוכח';
  }
  if (goal === 'fun') {
    return 'מורה עם גישה נעימה ויצירתית';
  }
  return 'מורה מנוסה עם רקע מוזיקלי רחב';
}

function buildTags(
  teacher: User,
  goal: string,
  personality: string
): string[] {
  const tags: string[] = [];
  const specialties = teacher.specialties || [];

  if (specialties.includes('JAZZ')) tags.push("ג'אז");
  if (specialties.includes('THEORY')) tags.push('תיאוריה');
  if (specialties.includes('EXAM_PREP')) tags.push('הכנה לבחינות');
  if (specialties.includes('PERFORMANCE')) tags.push('ביצוע');
  if (specialties.includes('EARLY_CHILDHOOD')) tags.push('גיל רך');
  if (specialties.includes('SPECIAL_NEEDS')) tags.push('צרכים מיוחדים');
  if (specialties.includes('ENSEMBLE')) tags.push('הרכבים');

  if (personality === 'patient') tags.push('גישה סבלנית');
  if (personality === 'creative') tags.push('יצירתי');
  if (goal === 'exam') tags.push('שיטתי');

  return tags;
}
