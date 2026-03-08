'use server';

import type { TeacherMatchResult } from '@/lib/types';

export async function findTeacherMatches(answers: {
  goal: string;
  style: string;
  personality: string;
  notes?: string;
  conservatoriumId?: string;
  locale: string;
}): Promise<TeacherMatchResult[]> {
  // Mock implementation: return 3 hardcoded results based on answer scoring
  // In production: query DB for teachers, score them, or call Gemini API

  const { goal, style, personality } = answers;

  // Simple scoring heuristic
  const results: TeacherMatchResult[] = [
    {
      teacherId: 'teacher-user-1',
      teacherName: 'מרים כהן',
      conservatoriumId: 'cons-15',
      conservatoriumName: 'קונסרבטוריון הוד השרון',
      score: goal === 'professional' ? 95 : goal === 'exam' ? 88 : 82,
      matchReason: personality === 'patient'
        ? 'מורה סבלנית עם ניסיון בהדרכת מתחילים ומתקדמים'
        : style === 'structured'
        ? 'גישה מובנית ומסודרת, מתאימה לתלמידים שמעדיפים סדר'
        : 'מורה יצירתית עם גמישות בשיטות הוראה',
      instruments: ['פסנתר', 'תיאוריה'],
      specialties: [],
      isPremiumTeacher: true,
      tags: personality === 'patient' ? ['גישה סבלנית', 'מתחילים ומתקדמים'] : ['מובנה', 'שיטתי'],
      nextAvailableSlot: { day: 'SUN', time: '14:00' },
    },
    {
      teacherId: 'teacher-user-2',
      teacherName: 'דוד המלך',
      conservatoriumId: 'cons-15',
      conservatoriumName: 'קונסרבטוריון הוד השרון',
      score: goal === 'fun' ? 90 : 75,
      matchReason: personality === 'creative'
        ? 'מורה יצירתי עם דגש על ביטוי אישי ואלתור'
        : 'מורה מנוסה עם רקע מוזיקלי רחב',
      instruments: ['גיטרה', 'בס'],
      specialties: [],
      isPremiumTeacher: true,
      tags: ['יצירתי', "ג'אז", 'אלתור'],
      nextAvailableSlot: { day: 'TUE', time: '16:00' },
    },
    {
      teacherId: 'dir-teacher-001',
      teacherName: 'רונית לוי',
      conservatoriumId: 'cons-15',
      conservatoriumName: 'קונסרבטוריון הוד השרון',
      score: 70,
      matchReason: 'מורה מומחית לכינור עם ניסיון רב שנים',
      instruments: ['כינור'],
      specialties: [],
      tags: ['קלאסי', 'כינור'],
      nextAvailableSlot: { day: 'WED', time: '15:00' },
    },
  ];

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}
