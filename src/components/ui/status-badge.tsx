import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { FormStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<FormStatus, { className: string; label: string }> = {
    'טיוטה': { className: "bg-gray-200 text-gray-800 hover:bg-gray-200/80 dark:bg-gray-700 dark:text-gray-200", label: "טיוטה" },
    'ממתין לאישור מורה': { className: "bg-orange-200 text-orange-800 hover:bg-orange-200/80 dark:bg-orange-800 dark:text-orange-100", label: "ממתין לאישור מורה" },
    'ממתין לאישור מנהל': { className: "bg-yellow-200 text-yellow-800 hover:bg-yellow-200/80 dark:bg-yellow-800 dark:text-yellow-100", label: "ממתין לאישור מנהל" },
    'מאושר': { className: "bg-green-200 text-green-800 hover:bg-green-200/80 dark:bg-green-800 dark:text-green-100", label: "מאושר" },
    'נדחה': { className: "bg-red-200 text-red-800 hover:bg-red-200/80 dark:bg-red-800 dark:text-red-100", label: "נדחה" },
};

interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
    status: FormStatus;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
    const config = statusConfig[status];

    if (!config) {
        return null;
    }
    
    return (
        <Badge variant="outline" className={cn(config.className, className)} {...props}>
            {config.label}
        </Badge>
    );
}
