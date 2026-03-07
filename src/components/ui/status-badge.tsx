import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { FormStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getStatusConfig = (t: any): Record<FormStatus, { className: string; label: string }> => ({
    'DRAFT': { className: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-300", label: t('draft') },
    'PENDING_TEACHER': { className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 dark:bg-yellow-900 dark:text-yellow-200", label: t('pendingTeacher') },
    'PENDING_ADMIN': { className: "bg-orange-100 text-orange-800 hover:bg-orange-100/80 dark:bg-orange-900 dark:text-orange-200", label: t('pendingAdmin') },
    'APPROVED': { className: "bg-teal-100 text-teal-800 hover:bg-teal-100/80 dark:bg-teal-900 dark:text-teal-200", label: t('approved') },
    'REJECTED': { className: "bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900 dark:text-red-200", label: t('rejected') },
    'REVISION_REQUIRED': { className: "bg-purple-100 text-purple-800 hover:bg-purple-100/80 dark:bg-purple-900 dark:text-purple-200", label: t('revisionRequired') },
    'FINAL_APPROVED': { className: "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-200", label: t('finalApproved') },
});

interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
    status: FormStatus;
    label?: string;
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
    const t = useTranslations('Status');
    const config = getStatusConfig(t)[status];

    if (!config) {
        return null;
    }

    return (
        <Badge variant="outline" className={cn("border-transparent", config.className, className)} {...props}>
            {label || config.label}
        </Badge>
    );
}
