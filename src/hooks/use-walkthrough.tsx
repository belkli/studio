'use client';

import { useEffect } from 'react';
import { driver, type DriveStep } from 'driver.js';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/lib/types';

const studentSteps: DriveStep[] = [
  { element: '#nav-profile', popover: { title: 'הפרופיל האישי שלך', description: 'כאן תמצא/י סיכום של הפעילות, ההתקדמות וההישגים שלך.', side: 'left', align: 'start' } },
  { element: '#nav-schedule', popover: { title: 'מערכת שעות', description: 'כאן תוכל/י לראות את מערכת השעות שלך, לבטל או לשנות מועד של שיעור.', side: 'left', align: 'start' } },
  { element: '#nav-practice', popover: { title: 'רישום אימונים', description: 'עדכן/י את המורה על ההתקדמות שלך בין השיעורים ותעד/י את האימונים.', side: 'left', align: 'start' } },
  { element: '#nav-forms', popover: { title: 'טפסים ומסמכים', description: 'הגש/י טפסים לרסיטלים, בחינות ועוד, ועקוב/עקבי אחר סטטוס האישור שלהם.', side: 'left', align: 'start' } },
  { element: '#nav-messages', popover: { title: 'הודעות', description: 'שלח/י הודעות ישירות למורה שלך מכאן.', side: 'left', align: 'start' } },
  { element: '#help-button', popover: { title: 'צריך עזרה?', description: 'בכל שאלה - לחץ/י על כפתור העזרה! עוזר ה-AI שלנו זמין 24/7.', side: 'top', align: 'center' } },
];

const parentSteps: DriveStep[] = [
    { element: '#nav-family-hub', popover: { title: 'מרכז המשפחה', description: 'זהו מרכז הבקרה שלך - כאן תראי את כל ילדיך במקום אחד.', side: 'left', align: 'start' } },
    { element: '#child-card-0', popover: { title: 'כרטיס ילד', description: 'כאן מוצג סיכום שבועי של הפעילות של ילדך. לחץ/י על "פרופיל מלא" כדי לראות את כל הפרטים.', side: 'bottom', align: 'start' } },
    { element: '#nav-billing', popover: { title: 'חיובים ותשלומים', description: 'כאן תמצאי חשבוניות ותוכלי לעדכן אמצעי תשלום.', side: 'left', align: 'start' } },
    { element: '#nav-notifications', popover: { title: 'העדפות התראות', description: 'בחרי איך לקבל עדכונים - SMS, WhatsApp, או אימייל.', side: 'left', align: 'start' } },
    { popover: { title: 'סיכום שבועי', description: 'בנוסף, כל שבוע תקבל/י סיכום למייל על מה שקרה בשיעורים של ילדיך.', side: 'top' } },
    { element: '#help-button', popover: { title: 'צריך עזרה?', description: 'יש שאלות? לחץ/י על העזרה בכל רגע.', side: 'top', align: 'center' } },
];

const teacherSteps: DriveStep[] = [
    { element: '#nav-dashboard-teacher', popover: { title: 'לוח בקרה', description: 'ברוך הבא! זהו מרכז הבקרה שלך, עם כל המידע שאתה צריך להיום.', side: 'left', align: 'start' } },
    { element: '#today-lessons-card', popover: { title: 'השיעורים להיום', description: 'כאן תוכל לסמן נוכחות לתלמידים שלך בקליק.', side: 'bottom', align: 'start' } },
    { element: '#nav-availability', popover: { title: 'ניהול זמינות', description: 'הגדר מתי אתה פנוי - תלמידים יראו את הזמינות שלך ויוכלו להזמין שיעורים.', side: 'left', align: 'start' } },
    { element: '#student-roster-card', popover: { title: 'רשימת התלמידים', description: 'צפה בכל התלמידים שלך וגש במהירות לפרופיל המלא שלהם.', side: 'bottom', align: 'start' } },
    { element: '#nav-approvals', popover: { title: 'תור אישורים', description: 'כאן יחכו לך טפסים שהתלמידים הגישו וממתינים לאישורך.', side: 'left', align: 'start' } },
    { element: '#sick-leave-button', popover: { title: 'דיווח מחלה', description: 'אם אתה חולה, לחץ כאן - המערכת תבטל את השיעורים ותודיע לכולם אוטומטית.', side: 'top', align: 'end' } },
    { element: '#help-button', popover: { title: 'צריך עזרה?', description: 'סיור זה זמין שוב מהגדרות. לשאלות נוספות, השתמש בעוזר ה-AI.', side: 'top', align: 'center' } },
];

const adminSteps: DriveStep[] = [
    { element: '#nav-dashboard-admin', popover: { title: 'מרכז הבקרה', description: 'ברוכה הבאה! זהו מרכז הבקרה שלך לניהול הקונסרבטוריון.', side: 'left', align: 'start' } },
    { element: '#key-metrics-bar', popover: { title: 'מדדי מפתח', description: 'כאן תראי את הנתונים החשובים ביותר בזמן אמת: תלמידים פעילים, שיעורים, אישורים ממתינים והתראות AI.', side: 'bottom', align: 'start' } },
    { element: '#ai-alerts-card', popover: { title: 'התראות סוכן AI', description: 'סוכן ה-AI מזהה בעיות תפעוליות באופן יזום ומתריע לך כאן.', side: 'right', align: 'start' } },
    { element: '#nav-users', popover: { title: 'ניהול משתמשים', description: 'כאן תוכלי לאשר בקשות הצטרפות ולנהל את כלל המשתמשים.', side: 'left', align: 'start' } },
    { element: '#nav-approvals', popover: { title: 'תור אישורים', description: 'טפסים מכל הסוגים הממתינים לאישורך הסופי מרוכזים כאן.', side: 'left', align: 'start' } },
    { element: '#nav-master-schedule', popover: { title: 'מערכת שעות ראשית', description: 'צפי במערכת השעות של כל המורים והחדרים במבט על.', side: 'left', align: 'start' } },
    { element: '#nav-reports', popover: { title: 'דוחות ואנליטיקה', description: 'נתחי את ביצועי המוסד עם דוחות פיננסיים, תפעוליים ואקדמיים.', side: 'left', align: 'start' } },
    { element: '#nav-settings', popover: { title: 'הגדרות', description: 'מכאן תוכלי לנהל את כל הגדרות המערכת, כולל תמחור, סוכני AI ועוד.', side: 'left', align: 'start' } },
];

const stepsConfig: Record<UserRole, DriveStep[]> = {
    student: studentSteps,
    parent: parentSteps,
    teacher: teacherSteps,
    conservatorium_admin: adminSteps,
    site_admin: adminSteps,
    ministry_director: [],
};


export function useWalkthrough() {
    const { user, markWalkthroughAsSeen } = useAuth();
    
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
            steps: steps,
            onDestroyed: () => {
                markWalkthroughAsSeen(user.id);
            },
            nextBtnText: 'הבא',
            prevBtnText: 'הקודם',
            doneBtnText: 'סיום',
        });
        
        const timer = setTimeout(() => {
            driverObj.drive();
        }, 1500);

        return () => clearTimeout(timer);
    }, [user, markWalkthroughAsSeen]);
}
