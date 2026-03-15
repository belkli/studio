import type { FormSubmission, User } from '@/lib/types';

export function isInUserApprovalQueue(form: FormSubmission, user: User): boolean {
  switch (user.role) {
    case 'teacher':
      return form.status === 'PENDING_TEACHER' && Boolean(user.students?.includes(form.studentId));
    case 'delegated_admin':
    case 'conservatorium_admin':
      return (form.status === 'PENDING_ADMIN' || form.status === 'REVISION_REQUIRED')
        && form.conservatoriumId === user.conservatoriumId;
    case 'site_admin':
      return form.status === 'PENDING_ADMIN' || form.status === 'REVISION_REQUIRED';
    case 'ministry_director':
      return form.status === 'APPROVED';
    default:
      return false;
  }
}

export function isOverdue(form: FormSubmission, slaDays: number = 7): boolean {
  if (!['PENDING_TEACHER', 'PENDING_ADMIN', 'REVISION_REQUIRED'].includes(form.status)) return false;
  const submitted = new Date(form.submissionDate);
  const diffDays = (Date.now() - submitted.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > slaDays;
}
