import type { User, ScholarshipApplication, ComplianceLog } from '@/lib/types';

describe('S2 type extensions', () => {
  it('User accepts scholarshipCommittee flag', () => {
    const u: User = {
      id: 'u-1',
      name: 'Test',
      email: 'test@test.com',
      role: 'conservatorium_admin',
      conservatoriumId: 'cons-1',
      conservatoriumName: 'Test Cons',
      approved: true,
      createdAt: new Date().toISOString(),
      scholarshipCommittee: true,
    };
    expect(u.scholarshipCommittee).toBe(true);
  });

  it('ScholarshipApplication accepts new privacy fields', () => {
    const app: ScholarshipApplication = {
      id: 'app-1',
      studentId: 'stu-1',
      studentName: 'יעל',
      instrument: 'פסנתר',
      conservatoriumId: 'cons-1',
      academicYear: '2025-2026',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      priorityScore: 80,
      documents: ['https://storage.example.com/doc1.pdf'],
      aiScoredAt: new Date().toISOString(),
      committeeOverrideNote: 'Manual override: exceptional case',
    };
    expect(app.documents).toHaveLength(1);
    expect(app.committeeOverrideNote).toBeTruthy();
  });

  it('ComplianceLog accepts SENSITIVE_DATA_ACCESS action', () => {
    const log: ComplianceLog = {
      id: 'log-1',
      action: 'SENSITIVE_DATA_ACCESS',
      subjectId: 'app-1',
      reason: 'Committee member viewed scholarship documents',
      performedAt: new Date().toISOString(),
      performedBy: 'admin-1',
      conservatoriumId: 'cons-1',
    };
    expect(log.action).toBe('SENSITIVE_DATA_ACCESS');
  });

  it('AIScholarshipScore has required fields', () => {
    const score: import('@/lib/types').AIScholarshipScore = {
      score: 87,
      urgencyLevel: 'HIGH',
      reasoning: 'משפחה חד-הורית עם קשיים כלכליים חמורים.',
      recommendedAward: {
        discountPercent: 75,
        durationMonths: 12,
        confidence: 'HIGH',
      },
      flaggedForHumanReview: false,
    };
    expect(score.score).toBe(87);
  });
});
