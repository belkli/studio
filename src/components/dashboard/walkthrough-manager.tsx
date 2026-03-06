'use client';

import { useEffect, useMemo } from 'react';
import { driver, type DriveStep } from 'driver.js';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/types';
import { useTranslations } from 'next-intl';

export function useWalkthrough() {
    const { user, markWalkthroughAsSeen } = useAuth();
    const t = useTranslations('Walkthrough');

    const stepsConfig = useMemo(() => {
        const studentSteps: DriveStep[] = [
            { element: '#nav-profile', popover: { title: t('studentProfileTitle'), description: t('studentProfileDesc'), side: 'left', align: 'start' } },
            { element: '#nav-schedule', popover: { title: t('scheduleTitle'), description: t('scheduleDesc'), side: 'left', align: 'start' } },
            { element: '#nav-available-now', popover: { title: t('availableNowTitle'), description: t('availableNowDesc'), side: 'left', align: 'start' } },
            { popover: { title: t('premiumTeacherTitle'), description: t('premiumTeacherDesc'), side: 'top' } },
            { element: '#nav-practice', popover: { title: t('practiceTitle'), description: t('practiceDesc'), side: 'left', align: 'start' } },
            { element: '#nav-forms', popover: { title: t('formsTitle'), description: t('formsDesc'), side: 'left', align: 'start' } },
            { element: '#nav-messages', popover: { title: t('messagesTitle'), description: t('messagesDesc'), side: 'left', align: 'start' } },
            { element: '#help-button', popover: { title: t('needHelpTitle'), description: t('studentHelpDesc'), side: 'top', align: 'start' } },
        ];

        const parentSteps: DriveStep[] = [
            { element: '#nav-family-hub', popover: { title: t('familyHubTitle'), description: t('familyHubDesc'), side: 'left', align: 'start' } },
            { element: '#child-card-0', popover: { title: t('childCardTitle'), description: t('childCardDesc'), side: 'bottom', align: 'start' } },
            { element: '#nav-billing', popover: { title: t('billingTitle'), description: t('billingDesc'), side: 'left', align: 'start' } },
            { element: '#nav-notifications', popover: { title: t('notificationsTitle'), description: t('notificationsDesc'), side: 'left', align: 'start' } },
            { popover: { title: t('weeklySummaryTitle'), description: t('weeklySummaryDesc'), side: 'top' } },
            { element: '#help-button', popover: { title: t('needHelpTitle'), description: t('parentHelpDesc'), side: 'top', align: 'start' } },
        ];

        const teacherSteps: DriveStep[] = [
            { element: '#nav-dashboard-teacher', popover: { title: t('dashboardTitle'), description: t('teacherDashboardDesc'), side: 'left', align: 'start' } },
            { element: '#today-lessons-card', popover: { title: t('todayLessonsTitle'), description: t('todayLessonsDesc'), side: 'bottom', align: 'start' } },
            { element: '#nav-availability', popover: { title: t('availabilityTitle'), description: t('availabilityDesc'), side: 'left', align: 'start' } },
            { element: '#student-roster-card', popover: { title: t('studentRosterTitle'), description: t('studentRosterDesc'), side: 'bottom', align: 'start' } },
            { element: '#nav-approvals', popover: { title: t('approvalsQueueTitle'), description: t('teacherApprovalsDesc'), side: 'left', align: 'start' } },
            { element: '#sick-leave-button', popover: { title: t('sickLeaveTitle'), description: t('sickLeaveDesc'), side: 'top', align: 'end' } },
            { element: '#help-button', popover: { title: t('needHelpTitle'), description: t('teacherHelpDesc'), side: 'top', align: 'start' } },
        ];

        const adminSteps: DriveStep[] = [
            { element: '#nav-dashboard-admin', popover: { title: t('adminDashboardTitle'), description: t('adminDashboardDesc'), side: 'left', align: 'start' } },
            { element: '#key-metrics-bar', popover: { title: t('keyMetricsTitle'), description: t('keyMetricsDesc'), side: 'bottom', align: 'start' } },
            { element: '#ai-alerts-card', popover: { title: t('aiAlertsTitle'), description: t('aiAlertsDesc'), side: 'right', align: 'start' } },
            { element: '#nav-users', popover: { title: t('userManagementTitle'), description: t('userManagementDesc'), side: 'left', align: 'start' } },
            { element: '#nav-approvals', popover: { title: t('approvalsQueueTitle'), description: t('adminApprovalsDesc'), side: 'left', align: 'start' } },
            { element: '#nav-master-schedule', popover: { title: t('masterScheduleTitle'), description: t('masterScheduleDesc'), side: 'left', align: 'start' } },
            { element: '#nav-reports', popover: { title: t('reportsTitle'), description: t('reportsDesc'), side: 'left', align: 'start' } },
            { element: '#nav-settings', popover: { title: t('settingsTitle'), description: t('settingsDesc'), side: 'left', align: 'start' } },
        ];

        const config: Record<UserRole, DriveStep[]> = {
            student: studentSteps,
            parent: parentSteps,
            teacher: teacherSteps,
            conservatorium_admin: adminSteps,
            delegated_admin: adminSteps,
            site_admin: adminSteps,
            school_coordinator: adminSteps,
            ministry_director: [],
            admin: adminSteps,
            superadmin: adminSteps,
        };
        return config;
    }, [t]);

    useEffect(() => {
        if (!user || user.hasSeenWalkthrough) {
            return;
        }

        const steps = stepsConfig[user.role];
        if (!steps || steps.length === 0) {
            markWalkthroughAsSeen(user.id);
            return;
        }

        const driverObj = driver({
            showProgress: true,
            progressText: '{{current}} / {{total}}',
            steps: steps,
            nextBtnText: t('next'),
            prevBtnText: t('back'),
            doneBtnText: t('done'),
            onDestroyed: () => {
                markWalkthroughAsSeen(user.id);
                const tutorialFinished = localStorage.getItem('tutorial-finished');
                if (!tutorialFinished) {
                    localStorage.setItem('tutorial-finished', 'true');
                }
            },
        });

        const timer = setTimeout(() => {
            driverObj.drive();
        }, 1500);

        return () => {
            clearTimeout(timer);
            try {
                driverObj.destroy();
            } catch (e) {
                // Ignore errors if already destroyed
            }
        };
    }, [user, markWalkthroughAsSeen, stepsConfig, t]);
}

export function WalkthroughManager() {
    useWalkthrough();
    return null;
}

