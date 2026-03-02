import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
}
