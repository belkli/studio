'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck } from 'lucide-react';
import type { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

const NotificationItem = ({ notification }: { notification: Notification }) => {
    return (
        <Link href={notification.link} className={cn(
            "block p-4 rounded-lg border transition-colors hover:bg-muted/50",
            !notification.read ? "bg-primary/5 border-primary/20" : "bg-card"
        )}>
            <div className="flex items-start gap-4">
                <div className={cn("mt-1 h-8 w-8 rounded-full flex items-center justify-center", !notification.read ? 'bg-primary/10' : 'bg-muted')}>
                    <Bell className={cn("h-4 w-4", !notification.read ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1">
                    <p className={cn("font-semibold", !notification.read && "text-primary")}>{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: he })}
                </div>
            </div>
        </Link>
    )
}

export default function NotificationsPage() {
    const { user, updateUser } = useAuth();
    const [currentTab, setCurrentTab] = useState('all');

    const handleMarkAllRead = () => {
        if (!user || !user.notifications) return;
        const updatedUser = {
            ...user,
            notifications: user.notifications.map(n => ({ ...n, read: true }))
        };
        updateUser(updatedUser);
    };
    
    const unreadCount = useMemo(() => user?.notifications?.filter(n => !n.read).length || 0, [user?.notifications]);
    
    const filteredNotifications = useMemo(() => {
        if (!user?.notifications) return [];
        const sortedNotifications = [...user.notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (currentTab === 'unread') {
            return sortedNotifications.filter(n => !n.read);
        }
        return sortedNotifications;
    }, [user?.notifications, currentTab]);


    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">התראות</h1>
                    <p className="text-muted-foreground">כל העדכונים וההודעות שלך במקום אחד.</p>
                </div>
                <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                    <CheckCheck className="me-2 h-4 w-4" />
                    סמן הכל כנקרא
                </Button>
            </div>
            
            <Card>
                <CardHeader className="p-0 border-b">
                    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none h-auto p-0">
                            <TabsTrigger value="all" className="py-3 rounded-t-lg rounded-b-none data-[state=active]:shadow-none data-[state=active]:border-b-2 border-b-primary">הכל</TabsTrigger>
                            <TabsTrigger value="unread" className="py-3 rounded-t-lg rounded-b-none data-[state=active]:shadow-none data-[state=active]:border-b-2 border-b-primary">
                                לא נקראו
                                {unreadCount > 0 && <span className="ms-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">{unreadCount}</span>}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {filteredNotifications.length > 0 ? (
                             filteredNotifications.map(notification => (
                                <NotificationItem key={notification.id} notification={notification} />
                             ))
                        ) : (
                            <div className="text-center text-muted-foreground py-16">
                                <Bell className="mx-auto h-12 w-12" />
                                <p className="mt-4">
                                    {currentTab === 'unread' ? 'אין התראות שלא נקראו.' : 'אין התראות להצגה.'}
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
