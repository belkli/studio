import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Load the generated teachers JSON once for the whole suite
// ---------------------------------------------------------------------------

const JSON_PATH = path.join(process.cwd(), 'scripts', 'teachers', 'generated-teachers.json');

interface I18nStrings {
  he: string;
  en: string;
  ar: string;
  ru: string;
}

interface AvailabilitySlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface GeneratedTeacher {
  seq: number;
  dirId: string;
  uuid: string;
  consId: string;
  consN: number;
  consName: string;
  aUuid: string;
  email: string;
  firstNameHe: string;
  lastNameHe: string;
  firstNames: I18nStrings;
  lastNames: I18nStrings;
  bioHe: string;
  bio: I18nStrings;
  instrumentsHe: string[];
  instruments: Record<string, string[]>;
  availability: AvailabilitySlot[];
}

const teachers: GeneratedTeacher[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

const EXPECTED_CONS_IDS = new Set([
  'cons-2', 'cons-7', 'cons-9', 'cons-10', 'cons-11',
  'cons-13', 'cons-14', 'cons-16', 'cons-17', 'cons-18',
]);

const LOCALES: (keyof I18nStrings)[] = ['he', 'en', 'ar', 'ru'];

describe('generated-teachers.json', () => {
  it('contains exactly 277 teachers', () => {
    expect(teachers).toHaveLength(277);
  });

  it('every teacher has all required top-level fields', () => {
    const requiredFields: (keyof GeneratedTeacher)[] = [
      'dirId', 'uuid', 'consId', 'consN', 'consName',
      'aUuid', 'firstNameHe', 'lastNameHe', 'firstNames', 'lastNames',
      'bio', 'instruments', 'availability',
    ];

    for (const teacher of teachers) {
      for (const field of requiredFields) {
        expect(teacher, `teacher ${teacher.dirId} missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('firstNames has all 4 locales as string values (he is always non-empty)', () => {
    for (const teacher of teachers) {
      for (const locale of LOCALES) {
        const value = teacher.firstNames[locale];
        expect(typeof value, `${teacher.dirId}: firstNames.${locale} missing`).toBe('string');
      }
      // Hebrew first name is always required
      expect(
        teacher.firstNames.he.trim().length > 0,
        `${teacher.dirId}: firstNames.he must not be empty`
      ).toBe(true);
    }
  });

  it('lastNames has all 4 locales as string values (some teachers are single-name, so empty is allowed)', () => {
    for (const teacher of teachers) {
      for (const locale of LOCALES) {
        const value = teacher.lastNames[locale];
        // The field must exist and be a string, but may be empty for single-name teachers
        expect(typeof value, `${teacher.dirId}: lastNames.${locale} missing`).toBe('string');
      }
    }
  });

  it('bio has all 4 locales as string values (empty bios are allowed for some teachers)', () => {
    for (const teacher of teachers) {
      for (const locale of LOCALES) {
        const value = teacher.bio[locale];
        // Field must exist and be a string; empty is permitted for teachers without a bio
        expect(typeof value, `${teacher.dirId}: bio.${locale} missing`).toBe('string');
      }
    }
  });

  it('majority of teachers (>= 95%) have a non-empty Hebrew bio', () => {
    const withBio = teachers.filter((t) => t.bio.he.trim().length > 0);
    expect(withBio.length / teachers.length).toBeGreaterThanOrEqual(0.95);
  });

  it('majority of teachers (>= 99%) have a non-empty Hebrew last name', () => {
    const withLastName = teachers.filter((t) => t.lastNames.he.trim().length > 0);
    expect(withLastName.length / teachers.length).toBeGreaterThanOrEqual(0.99);
  });

  it('instruments has at least 1 Hebrew instrument per teacher', () => {
    for (const teacher of teachers) {
      const heInstruments = teacher.instruments?.he;
      expect(
        Array.isArray(heInstruments) && heInstruments.length >= 1,
        `${teacher.dirId}: instruments.he is missing or empty`
      ).toBe(true);
    }
  });

  it('availability has at least 1 slot per teacher', () => {
    for (const teacher of teachers) {
      expect(
        Array.isArray(teacher.availability) && teacher.availability.length >= 1,
        `${teacher.dirId}: availability is empty or missing`
      ).toBe(true);
    }
  });

  it('each availability slot has dayOfWeek, startTime, endTime', () => {
    for (const teacher of teachers) {
      for (const slot of teacher.availability) {
        expect(slot, `${teacher.dirId} slot missing dayOfWeek`).toHaveProperty('dayOfWeek');
        expect(slot, `${teacher.dirId} slot missing startTime`).toHaveProperty('startTime');
        expect(slot, `${teacher.dirId} slot missing endTime`).toHaveProperty('endTime');
      }
    }
  });

  it('dirId values are unique (no duplicates)', () => {
    const dirIds = teachers.map((t) => t.dirId);
    const unique = new Set(dirIds);
    expect(unique.size).toBe(teachers.length);
  });

  it('uuid values are unique (no duplicates)', () => {
    const uuids = teachers.map((t) => t.uuid);
    const unique = new Set(uuids);
    expect(unique.size).toBe(teachers.length);
  });

  it('minimum seq (dirId number) starts at 208', () => {
    const seqs = teachers.map((t) => t.seq);
    expect(Math.min(...seqs)).toBe(208);
  });

  it('all uuid values match pattern c1000000-0000-0000-0000-0000000NNNNN (12-digit padded)', () => {
    const pattern = /^c1000000-0000-0000-0000-\d{12}$/;
    for (const teacher of teachers) {
      expect(
        pattern.test(teacher.uuid),
        `${teacher.dirId}: uuid "${teacher.uuid}" does not match expected pattern`
      ).toBe(true);
    }
  });

  it('all consId values belong to the expected set of 10 conservatoriums', () => {
    for (const teacher of teachers) {
      expect(
        EXPECTED_CONS_IDS.has(teacher.consId),
        `${teacher.dirId}: unexpected consId "${teacher.consId}"`
      ).toBe(true);
    }
  });
});
