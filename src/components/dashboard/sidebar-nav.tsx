

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
import { Book, FileText, LayoutDashboard, Settings, User, BadgeCheck, Bell, PlusCircle, LogOut, Mail, Clock, Building, Calendar, DollarSign, Users, LineChart, Bot, FilePlus, PencilRuler, MessagesSquare, BarChart3, BrainCircuit, UserCircle, Megaphone, UserPlus, Download, Coins, UserCheck, Banknote, ListChecks, MessageCircleQuestion, ListCollapse, Presentation, GanttChartSquare, Music, ShieldQuestion, CalendarPlus, UserCog } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Notification, UserRole } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const NotificationItem = ({ notification }: { notification: Notification }) => (
  <DropdownMenuItem asChild className={cn('flex items-start gap-3 cursor-pointer p-3', !notification.read && 'bg-accent/50')}>
    <Link href={notification.link}>
      <div className="flex-shrink-0 mt-1">
        <Bell className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-grow">
        <p className="font-semibold text-sm">{notification.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
        <div className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: he })}
        </div>
      </div>
    </Link>
  </DropdownMenuItem>
);


export function SidebarNav() {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();
  const { user, logout, updateUser, newFeaturesEnabled } = useAuth();
  
  const handleHelpClick = () => {
    if (typeof (window as any).openHelpAssistant === 'function') {
        (window as any).openHelpAssistant();
    }
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  const legacyLinks = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin', 'ministry_director'] },
    { href: '/dashboard/forms', label: t('myForms'), icon: FileText, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/forms/new', label: t('newForm'), icon: PlusCircle, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/approvals', label: t('approvals'), icon: BadgeCheck, roles: ['teacher', 'conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/library', label: t('library'), icon: Book, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/users', label: t('users'), icon: User, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/ministry', label: t('ministry'), icon: Building, roles: ['ministry_director'] },
  ];

  const harmoniaLinks = [
    // --- Dashboards ---
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['conservatorium_admin', 'site_admin'], id: 'nav-dashboard-admin' },
    { href: '/dashboard/teacher', label: t('dashboard'), icon: LayoutDashboard, roles: ['teacher'], id: 'nav-dashboard-teacher' },
    { href: '/dashboard/family', label: t('myFamily'), icon: Users, roles: ['parent'], id: 'nav-family-hub' },
    { href: '/dashboard/profile', label: t('myProfile'), icon: UserCircle, roles: ['student'], id: 'nav-profile' },

    // --- Teacher Section ---
    { href: '/dashboard/teacher/profile', label: t('teacherProfile'), icon: UserCircle, roles: ['teacher'] },
    { href: '/dashboard/teacher/performance-profile', label: t('performanceProfile'), icon: Music, roles: ['teacher'] },
    { href: '/dashboard/teacher/availability', label: t('myAvailability'), icon: Calendar, roles: ['teacher'], id: 'nav-availability' },
    { href: '/dashboard/teacher/reports', label: t('myReports'), icon: LineChart, roles: ['teacher'] },
    { href: '/dashboard/teacher/payroll', label: t('payroll'), icon: Banknote, roles: ['teacher'] },

    // --- Student & Parent Section ---
    { href: '/dashboard/schedule', label: t('schedule'), icon: Calendar, roles: ['student', 'parent', 'teacher'], id: 'nav-schedule' },
    { href: '/dashboard/practice', label: t('practiceLog'), icon: PencilRuler, roles: ['student', 'parent'], id: 'nav-practice' },
    { href: '/dashboard/progress', label: t('progress'), icon: BarChart3, roles: ['student', 'parent'] },
    { href: '/dashboard/makeups', label: t('makeups'), icon: Coins, roles: ['student', 'parent'] },
    { href: '/dashboard/ai-reschedule', label: t('aiAssistant'), icon: BrainCircuit, roles: ['student', 'parent'] },
    { href: '/dashboard/apply-for-aid', label: 'בקשת מלגה', icon: ShieldQuestion, roles: ['student', 'parent'] },

    // --- Shared Features ---
    { href: '/dashboard/messages', label: t('messages'), icon: MessagesSquare, roles: ['student', 'parent', 'teacher', 'conservatorium_admin', 'site_admin'], id: 'nav-messages' },
    { href: '/dashboard/forms', label: t('formsAndDocs'), icon: FileText, roles: ['student', 'parent', 'teacher', 'conservatorium_admin'], id: 'nav-forms' },
    { href: '/dashboard/notifications', label: t('notifications'), icon: Bell, roles: ['student', 'parent', 'teacher', 'conservatorium_admin', 'site_admin'], id: 'nav-notifications' },
    { href: '/dashboard/billing', label: t('billing'), icon: DollarSign, roles: ['student', 'parent', 'conservatorium_admin'], id: 'nav-billing' },

    // --- Admin Section ---
    { href: '/dashboard/approvals', label: t('approvals'), icon: BadgeCheck, roles: ['teacher', 'conservatorium_admin', 'site_admin'], id: 'nav-approvals' },
    { href: '/dashboard/users', label: t('userManagement'), icon: User, roles: ['conservatorium_admin', 'site_admin'], id: 'nav-users' },
    { href: '/dashboard/enroll', label: t('newRegistration'), icon: UserPlus, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/master-schedule', label: t('masterSchedule'), icon: Calendar, roles: ['conservatorium_admin', 'site_admin'], id: 'nav-master-schedule' },
    { href: '/dashboard/events', label: t('events'), icon: Presentation, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/admin/open-day', label: t('manageOpenDay'), icon: CalendarPlus, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/admin/branches', label: t('branches'), icon: Building, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/admin/performances', label: t('performances'), icon: Music, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/admin/rentals', label: t('rentals'), icon: GanttChartSquare, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/admin/waitlists', label: t('waitlists'), icon: ListChecks, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/admin/makeups', label: t('adminMakeups'), icon: Coins, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/admin/substitute', label: t('substitute'), icon: UserCog, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/admin/payroll', label: t('teacherPayroll'), icon: Banknote, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/announcements', label: t('announcements'), icon: Megaphone, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/reports', label: t('reportsAnalytics'), icon: LineChart, roles: ['conservatorium_admin', 'site_admin'], id: 'nav-reports' },
    { href: '/dashboard/admin/form-builder', label: t('formBuilder'), icon: PencilRuler, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/ai', label: t('aiAgents'), icon: BrainCircuit, roles: ['conservatorium_admin', 'site_admin'] },
    { href: '/dashboard/ministry-export', label: t('ministryExport'), icon: Download, roles: ['conservatorium_admin', 'site_admin'] },

    // --- Ministry Section ---
    { href: '/dashboard/ministry', label: t('ministry'), icon: Building, roles: ['ministry_director'] },
  ];

  const unreadCount = user.notifications?.filter(n => !n.read).length || 0;

  const handleNotificationsOpen = () => {
    if (unreadCount > 0 && user.notifications) {
      const updatedUser = {
        ...user,
        notifications: user.notifications.map(n => ({ ...n, read: true }))
      };
      updateUser(updatedUser);
    }
  };

  const userRole = user.role;
  const links = newFeaturesEnabled ? harmoniaLinks : legacyLinks;

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Icons.logo className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold">{t('logo')}</span>
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

            const isActive = pathname === link.href || (link.href !== '/dashboard' && link.href !== '/dashboard/teacher' && pathname.startsWith(link.href));

            return (
              <SidebarMenuItem key={link.href} id={link.id}>
                <Link href={link.href} passHref>
                  <SidebarMenuButton
                    isActive={isActive}
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
                <span className="sr-only">{t('notifications')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.notifications && user.notifications.length > 0 ? (
                user.notifications.slice(0, 5).map(notif => <NotificationItem key={notif.id} notification={notif} />)
              ) : (
                <p className="p-4 text-sm text-center text-muted-foreground">{t('noNotifications')}</p>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="flex items-center justify-center cursor-pointer text-sm text-primary hover:text-primary">
                <Link href="/dashboard/notifications">
                  {t('viewAll')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard/settings" passHref>
              <SidebarMenuButton id="nav-settings" isActive={pathname.startsWith('/dashboard/settings')} tooltip={t('settings')}>
                <Settings />
                <span>{t('settings')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton id="sidebar-help-button" onClick={handleHelpClick} tooltip={t('help')}>
              <MessageCircleQuestion />
              <span>{t('help')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip={t('logout')}>
              <LogOut />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
