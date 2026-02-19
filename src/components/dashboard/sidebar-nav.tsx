'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { Book, FileText, LayoutDashboard, Settings, User, BadgeCheck, Bell, PlusCircle, LogOut, Mail, Clock, Building, Calendar, DollarSign, Users, LineChart, Bot, FilePlus, PencilRuler, MessagesSquare, BarChart3, BrainCircuit, UserCircle, Megaphone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Notification, UserRole } from '@/lib/types';


const legacyLinks = [
    { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin', 'ministry_director'] },
    { href: '/dashboard/forms', label: 'הטפסים שלי', icon: FileText, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/forms/new', label: 'טופס חדש', icon: PlusCircle, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/approvals', label: 'אישורים', icon: BadgeCheck, roles: ['teacher', 'conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/library', label: 'ספרייה', icon: Book, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/users', label: 'משתמשים', icon: User, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/ministry', label: 'אישורי משרד החינוך', icon: Building, roles: ['ministry_director'] },
];

const harmoniaLinks = [
    { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/teacher', label: 'לוח בקרה', icon: LayoutDashboard, roles: ['teacher'] },
    { href: '/dashboard/family', label: 'המשפחה שלי', icon: Users, roles: ['parent'] },
    { href: '/dashboard/profile', label: 'הפרופיל שלי', icon: UserCircle, roles: ['student', 'teacher'] },
    { href: '/dashboard/schedule', label: 'מערכת שעות', icon: Calendar, roles: ['student', 'parent', 'teacher', 'conservatorium_admin'] },
    { href: '/dashboard/billing', label: 'חיובים ותשלומים', icon: DollarSign, roles: ['student', 'parent', 'conservatorium_admin'] },
    { href: '/dashboard/practice', label: 'יומן אימונים', icon: PencilRuler, roles: ['student', 'parent', 'teacher'] },
    { href: '/dashboard/progress', label: 'התקדמות', icon: BarChart3, roles: ['student', 'parent', 'teacher'] },
    { href: '/dashboard/messages', label: 'הודעות', icon: MessagesSquare, roles: ['student', 'parent', 'teacher', 'conservatorium_admin'] },
    { href: '/dashboard/forms', label: 'טפסים ומסמכים', icon: FileText, roles: ['student', 'parent', 'teacher', 'conservatorium_admin'] },
    { href: '/dashboard/approvals', label: 'אישורים', icon: BadgeCheck, roles: ['teacher', 'conservatorium_admin'] },
    { href: '/dashboard/announcements', label: 'הכרזות', icon: Megaphone, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/reports', label: 'דוחות ואנליטיקה', icon: LineChart, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/users', label: 'ניהול משתמשים', icon: User, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/ai', label: 'סוכני AI', icon: BrainCircuit, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/ministry', label: 'אישורי משרד החינוך', icon: Building, roles: ['ministry_director'] },
];


const NotificationItem = ({ notification }: { notification: Notification }) => (
    <DropdownMenuItem asChild className={cn('flex items-start gap-3 cursor-pointer p-3', !notification.read && 'bg-accent/50')}>
        <Link href={notification.link}>
            <div className="flex-shrink-0 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-xs text-muted-foreground">{notification.message}</p>
                <div className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {notification.timestamp}
                </div>
            </div>
        </Link>
    </DropdownMenuItem>
);


export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout, updateUser, newFeaturesEnabled } = useAuth();

  if (!user) {
    return null; // Or a loading spinner
  }
  
  const unreadCount = user.notifications?.filter(n => !n.read).length || 0;

  const handleNotificationsOpen = () => {
    if (unreadCount > 0 && user.notifications) {
      const updatedUser = {
        ...user,
        notifications: user.notifications.map(n => ({...n, read: true}))
      };
      updateUser(updatedUser);
    }
  };

  const userRole = user.role;
  const links = newFeaturesEnabled ? harmoniaLinks : legacyLinks;
  
  const getLinkHref = (role: UserRole, baseHref: string): string => {
    if (baseHref === '/dashboard/profile') {
        if (role === 'teacher') return '/dashboard/teacher/profile';
    }
    if (baseHref === '/dashboard') {
        if (role === 'teacher') return '/dashboard/teacher';
    }
    return baseHref;
  }

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Icons.logo className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold">הַרמוֹנְיָה</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarMenu>
          {links.map((link) => {
            const userCanView = link.roles.includes(userRole);
            if (!userCanView) {
                return null;
            }
            
            // Special handling for dashboard links to avoid multiple "לוח בקרה" items
            if (link.href === '/dashboard' && (user.role === 'teacher' || user.role === 'student' || user.role === 'parent') && newFeaturesEnabled) return null;
            if (link.href === '/dashboard/teacher' && user.role !== 'teacher') return null;
            if (link.href === '/dashboard/teacher/profile' && user.role === 'teacher') return null; // Handled by /dashboard/profile


            const finalHref = getLinkHref(userRole, link.href);
            const isActive = pathname === finalHref || (finalHref !== '/dashboard' && finalHref !== '/dashboard/teacher' && pathname.startsWith(finalHref));

            return (
                <SidebarMenuItem key={link.href}>
                  <Link href={finalHref} passHref>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={link.label}
                    >
                      <link.icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="flex items-center justify-between p-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <DropdownMenu onOpenChange={(open) => open && handleNotificationsOpen()}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full group-data-[collapsible=icon]:hidden">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                            {unreadCount}
                        </span>
                    )}
                    <span className="sr-only">התראות</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>התראות</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.notifications && user.notifications.length > 0 ? (
                    user.notifications.slice(0, 5).map(notif => <NotificationItem key={notif.id} notification={notif} />)
                ) : (
                    <p className="p-4 text-sm text-center text-muted-foreground">אין התראות חדשות</p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        <SidebarSeparator />
        <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/dashboard/settings" passHref>
                    <SidebarMenuButton isActive={pathname.startsWith('/dashboard/settings')} tooltip="הגדרות">
                        <Settings />
                        <span>הגדרות</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton tooltip="התנתקות" onClick={logout}>
                    <LogOut />
                    <span>התנתקות</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
