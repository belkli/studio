'use client';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { PerformanceBooking, PerformanceBookingStatus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AssignMusicianDialog } from './assign-musician-dialog';


const pipelineStages: { id: PerformanceBookingStatus; title: string }[] = [
    { id: 'INQUIRY_RECEIVED', title: 'פנייה חדשה' },
    { id: 'ADMIN_REVIEWING', title: 'בבדיקת מנהל' },
    { id: 'MUSICIANS_CONFIRMED', title: 'מוזיקאים שובצו' },
    { id: 'QUOTE_SENT', title: 'הצעה נשלחה' },
    { id: 'DEPOSIT_PAID', title: 'שולם פיקדון' },
    { id: 'BOOKING_CONFIRMED', title: 'הזמנה מאושרת' },
    { id: 'EVENT_COMPLETED', title: 'הסתיים' },
];

const BookingCard = ({ booking, onAssignClick }: { booking: PerformanceBooking; onAssignClick: () => void; }) => (
    <Card className="mb-4">
        <CardHeader className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-base">{booking.eventName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{booking.clientName}</p>
                </div>
                <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={onAssignClick}>
                            <UserPlus className="w-4 h-4 me-2" />
                            שבץ מוזיקאים
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm space-y-2">
            <p><strong>תאריך:</strong> {format(new Date(booking.eventDate), 'dd/MM/yyyy')} @ {booking.eventTime}</p>
            <p><strong>סוג:</strong> {booking.eventType}</p>
            <p><strong>הצעת מחיר:</strong> ₪{booking.totalQuote.toLocaleString()}</p>
            {booking.assignedMusicians && booking.assignedMusicians.length > 0 && (
                <p><strong>משובצים:</strong> {booking.assignedMusicians.map(m => m.name).join(', ')}</p>
            )}
        </CardContent>
    </Card>
);

export function PerformanceBookingDashboard() {
    const { mockPerformanceBookings, user } = useAuth();
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<PerformanceBooking | null>(null);

    const bookingsByStage = useMemo(() => {
        const stages: Record<string, PerformanceBooking[]> = {};
        pipelineStages.forEach(stage => stages[stage.id] = []);
        mockPerformanceBookings
            .filter(b => b.conservatoriumId === user?.conservatoriumId)
            .forEach(booking => {
                if (stages[booking.status]) {
                    stages[booking.status].push(booking);
                }
            });
        return stages;
    }, [mockPerformanceBookings, user]);

    const handleAssignClick = (booking: PerformanceBooking) => {
        setSelectedBooking(booking);
        setAssignDialogOpen(true);
    };

    return (
        <>
            <div className="flex gap-4 overflow-x-auto p-1">
                {pipelineStages.map(stage => (
                    <div key={stage.id} className="min-w-[300px] flex-1">
                        <h3 className="font-semibold text-lg p-2 mb-2">{stage.title} ({bookingsByStage[stage.id]?.length || 0})</h3>
                        <div className="bg-muted/50 rounded-lg p-2 h-full">
                            {bookingsByStage[stage.id]?.length > 0 ? (
                                bookingsByStage[stage.id].map(booking => (
                                    <BookingCard key={booking.id} booking={booking} onAssignClick={() => handleAssignClick(booking)} />
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                    אין הזמנות בשלב זה.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <AssignMusicianDialog 
                booking={selectedBooking} 
                open={assignDialogOpen} 
                onOpenChange={setAssignDialogOpen}
            />
        </>
    );
}
