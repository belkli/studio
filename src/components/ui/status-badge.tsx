import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { FormStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<FormStatus, { className: string; label: string }> = {
    'טיוטה': { className: "bg-gray-100 text-gray-700 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-300", label: "טיוטה" },
    'ממתין לאישור מורה': { className: "bg-yellow-100 text-amber-700 hover:bg-yellow-100/80 dark:bg-yellow-900 dark:text-yellow-200", label: "ממתין לאישור מורה" },
    'ממתין לאישור מנהל': { className: "bg-orange-100 text-orange-800 hover:bg-orange-100/80 dark:bg-orange-900 dark:text-orange-200", label: "ממתין לאישור מנהל" },
    'מאושר': { className: "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900 dark:text-green-200", label: "מאושר" },
    'נדחה': { className: "bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900 dark:text-red-200", label: "נדחה" },
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
        <Badge variant="outline" className={cn("border-transparent", config.className, className)} {...props}>
            {config.label}
        </Badge>
    );
}
