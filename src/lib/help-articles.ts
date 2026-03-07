
export interface HelpArticle {
    id: string;
    /** Key used for `t('category_' + categoryKey)` in HelpCenter namespace */
    categoryKey: string;
}

export const helpArticles: HelpArticle[] = [
    { id: 'booking-first-lesson',  categoryKey: 'SchedulingLessons' },
    { id: 'cancellation-policy',   categoryKey: 'SchedulingLessons' },
    { id: 'updating-payment',      categoryKey: 'PaymentsBilling' },
    { id: 'submitting-recital-form', categoryKey: 'FormsApprovals' },
    { id: 'teacher-availability',  categoryKey: 'ForTeachers' },
    { id: 'admin-approving-users', categoryKey: 'ForAdmins' },
];

export const helpCategoryKeys = Array.from(new Set(helpArticles.map(a => a.categoryKey)));
