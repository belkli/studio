import type { User, PlayingSchoolInfo, AccountType } from './types';
import { ACHIEVEMENT_DEFINITIONS } from './types';

/**
 * Automatically creates a student account based on a Playing School enrollment.
 * This is used when a parent registers a child for the school program.
 */
export function autoCreatePlayingSchoolStudentAccount(
    parentUser: User,
    enrollmentData: {
        studentName: string;
        instrument: string;
        schoolSymbol: string;
        schoolName: string;
        grade: string;
        birthDate: string;
        programType: 'GROUP' | 'INDIVIDUAL';
    }
): Partial<User> {
    const firstName = enrollmentData.studentName.split(' ')[0];
    const lastName = enrollmentData.studentName.split(' ').slice(1).join(' ') || parentUser.name.split(' ').slice(1).join(' ');

    return {
        id: `ps-student-${Date.now()}`,
        name: enrollmentData.studentName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@playing-school.harmonia.io`, // Auto-generated internal email
        role: 'student',
        conservatoriumId: parentUser.conservatoriumId,
        conservatoriumName: parentUser.conservatoriumName,
        approved: true, // School program accounts are pre-approved
        accountType: 'PLAYING_SCHOOL',
        birthDate: enrollmentData.birthDate,
        grade: 'TBD', // Coordinator will assign Hebrew grade 
        schoolName: enrollmentData.schoolName,
        schoolSymbol: enrollmentData.schoolSymbol,
        parentId: parentUser.id,
        playingSchoolInfo: {
            schoolName: enrollmentData.schoolName,
            schoolSymbol: enrollmentData.schoolSymbol,
            instrument: enrollmentData.instrument,
            programType: enrollmentData.programType,
            instrumentReceived: false,
            municipalSubsidyPercent: 0,
            ministrySubsidyPercent: 0,
            parentYearlyContribution: 0,
        },
        instruments: [
            {
                instrument: enrollmentData.instrument,
                teacherName: 'TBD', // To be assigned by school coordinator
                yearsOfStudy: 0
            }
        ],
        achievements: [
            {
                id: `ach-ps-init-${Date.now()}`,
                ...ACHIEVEMENT_DEFINITIONS.FIRST_PLAYING_SCHOOL_LESSON,
                achievedAt: new Date().toISOString()
            }
        ]
    };
}
