import { describe, it, expect } from 'vitest';
import { autoCreatePlayingSchoolStudentAccount } from '@/lib/playing-school-utils';
import type { User } from '@/lib/types';

const mockParent: User = {
  id: 'parent-1',
  name: 'David Cohen',
  email: 'david@example.com',
  role: 'parent',
  conservatoriumId: 'cons-15',
  conservatoriumName: 'Hod HaSharon Music School',
  approved: true,
  createdAt: '2024-01-01',
};

const enrollmentData = {
  studentName: 'Tom Cohen',
  instrument: 'piano',
  schoolSymbol: 'SCH-001',
  schoolName: 'Tel Aviv Primary School',
  grade: '3',
  birthDate: '2016-05-15',
  programType: 'GROUP' as const,
};

describe('autoCreatePlayingSchoolStudentAccount', () => {
  it('returns a partial User object', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('object');
  });

  it('assigns role as "student"', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.role).toBe('student');
  });

  it('uses the enrollment student name', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.name).toBe('Tom Cohen');
  });

  it('generates an id with "ps-student-" prefix', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.id).toMatch(/^ps-student-\d+$/);
  });

  it('generates an internal email containing first and last name', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.email).toContain('tom');
    expect(result.email).toContain('cohen');
    expect(result.email).toContain('@playing-school.lyriosa.io');
  });

  it('sets conservatoriumId from parent', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.conservatoriumId).toBe('cons-15');
  });

  it('sets conservatoriumName from parent', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.conservatoriumName).toBe('Hod HaSharon Music School');
  });

  it('sets approved to true', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.approved).toBe(true);
  });

  it('sets accountType to PLAYING_SCHOOL', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.accountType).toBe('PLAYING_SCHOOL');
  });

  it('sets birthDate from enrollment data', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.birthDate).toBe('2016-05-15');
  });

  it('sets parentId to parent user id', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.parentId).toBe('parent-1');
  });

  it('sets schoolName and schoolSymbol from enrollment data', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.schoolName).toBe('Tel Aviv Primary School');
    expect(result.schoolSymbol).toBe('SCH-001');
  });

  it('populates playingSchoolInfo with correct fields', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.playingSchoolInfo?.instrument).toBe('piano');
    expect(result.playingSchoolInfo?.programType).toBe('GROUP');
    expect(result.playingSchoolInfo?.instrumentReceived).toBe(false);
    expect(result.playingSchoolInfo?.municipalSubsidyPercent).toBe(0);
    expect(result.playingSchoolInfo?.ministrySubsidyPercent).toBe(0);
    expect(result.playingSchoolInfo?.parentYearlyContribution).toBe(0);
  });

  it('adds instrument to instruments array', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.instruments).toHaveLength(1);
    expect(result.instruments?.[0].instrument).toBe('piano');
    expect(result.instruments?.[0].yearsOfStudy).toBe(0);
  });

  it('adds FIRST_PLAYING_SCHOOL_LESSON achievement', () => {
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, enrollmentData);
    expect(result.achievements).toHaveLength(1);
    expect(result.achievements?.[0].type).toBe('FIRST_PLAYING_SCHOOL_LESSON');
  });

  it('uses parent last name when student has only one name', () => {
    const singleNameEnrollment = { ...enrollmentData, studentName: 'Tom' };
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, singleNameEnrollment);
    // Last name falls back to parent's last name "Cohen"
    expect(result.email).toContain('cohen');
  });

  it('handles INDIVIDUAL program type', () => {
    const individualEnrollment = { ...enrollmentData, programType: 'INDIVIDUAL' as const };
    const result = autoCreatePlayingSchoolStudentAccount(mockParent, individualEnrollment);
    expect(result.playingSchoolInfo?.programType).toBe('INDIVIDUAL');
  });
});
