'use client';

import { useMemo } from 'react';
import { useAuth } from './use-auth';

/**
 * Hook to manage and filter 'Playing School' enrollments for a parent or family.
 */
export function usePlayingSchoolEnrollments() {
    const { user, users } = useAuth();

    const enrollments = useMemo(() => {
        if (!user) return [];

        // If user is a parent, get their children's PS info
        if (user.role === 'parent' && user.childIds) {
            return users
                .filter(u => user.childIds?.includes(u.id) && u.playingSchoolInfo)
                .map(child => ({
                    child,
                    psInfo: child.playingSchoolInfo!
                }));
        }

        // If user is a student, get their own PS info
        if (user.role === 'student' && user.playingSchoolInfo) {
            return [{
                child: user,
                psInfo: user.playingSchoolInfo
            }];
        }

        return [];
    }, [user, users]);

    return {
        enrollments,
        hasEnrollments: enrollments.length > 0
    };
}
