/**
 * @fileoverview The main sidebar navigation component for the dashboard.
 * Implements SDD-NAV-01: Navigation Architecture Redesign.
 * Links are grouped into named, collapsible NavGroups per persona.
 * The legacy flat-list rendering is preserved behind newFeaturesEnabled === false.
 */
'use client';

import { memo, useState } from 'react';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';

import {
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import {
  // Existing icons
  LayoutDashboard, Settings, BadgeCheck, Bell, LogOut, Clock,
  Building, DollarSign, LineChart, MessagesSquare, BarChart3,
  BrainCircuit, Megaphone, UserPlus, Download, Coins, UserCog,
  Banknote, ListChecks, Presentation, GanttChartSquare, Music,
  ShieldQuestion, CalendarPlus, HandCoins, GraduationCap,
  FileText, PencilRuler, MessageCircleQuestion, ChevronDown,
  Book, User, Bot, Users, Gift,
  // NEW icons â€" SDD-NAV-01 Â§3 Icon Rationalisation
  Music2, HeartHandshake, Dumbbell, CalendarSearch, CalendarDays,
  CalendarRange, CalendarCheck, TrendingUp, CreditCard,
  UsersRound, ChartNoAxesCombined, Theater, Landmark, School,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { AdminSection, Notification, UserRole } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useDateLocale } from '@/hooks/use-date-locale';
import { Badge } from '@/components/ui/badge';

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ Types â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  id?: string;
  section?: AdminSection;
};

type NavGroup = {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  defaultCollapsed?: boolean;
  items: NavItem[];
};

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ NavGroup Definitions â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
// SDD-NAV-01 Â§5.3  â€" All 5 personas + school_coordinator (SDD-PS Â§7.1)

const harmoniaNavGroups: NavGroup[] = [
  // â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ ADMIN GROUPS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  {
    labelKey: 'groupOverview', icon: LayoutDashboard,
    roles: ['conservatorium_admin', 'site_admin', 'delegated_admin'],
    items: [
      { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, id: 'nav-dashboard-admin' },
      { href: '/dashboard/announcements', labelKey: 'announcements', icon: Megaphone, section: 'announcements' },
    ],
  },
  {
    labelKey: 'groupPeople', icon: UsersRound,
    roles: ['conservatorium_admin', 'site_admin', 'delegated_admin'],
    items: [
      { href: '/dashboard/users', labelKey: 'userManagement', icon: UsersRound, id: 'nav-users', section: 'users' },
      { href: '/dashboard/enroll', labelKey: 'newRegistration', icon: UserPlus, section: 'registrations' },
      { href: '/dashboard/approvals', labelKey: 'approvals', icon: BadgeCheck, id: 'nav-approvals', section: 'approvals' },
      { href: '/dashboard/admin/substitute', labelKey: 'substitute', icon: UserCog },
      { href: '/dashboard/admin/scholarships', labelKey: 'manageScholarships', icon: HandCoins, section: 'scholarships' },
    ],
  },
  {
    labelKey: 'groupScheduleOps', icon: CalendarRange,
    roles: ['conservatorium_admin', 'site_admin', 'delegated_admin'],
    items: [
      { href: '/dashboard/master-schedule', labelKey: 'masterSchedule', icon: CalendarRange, id: 'nav-master-schedule', section: 'scheduling' },
      { href: '/dashboard/admin/makeups', labelKey: 'adminMakeups', icon: Coins },
      { href: '/dashboard/admin/waitlists', labelKey: 'waitlists', icon: ListChecks },
    ],
  },
  {
    labelKey: 'groupProgramsEvents', icon: Theater,
    roles: ['conservatorium_admin', 'site_admin', 'delegated_admin'],
    items: [
      { href: '/dashboard/events', labelKey: 'events', icon: Theater, section: 'events' },
      { href: '/dashboard/admin/open-day', labelKey: 'manageOpenDay', icon: CalendarPlus, section: 'open-day' },
      { href: '/dashboard/admin/performances', labelKey: 'performances', icon: Music, section: 'performances' },
      { href: '/dashboard/admin/rentals', labelKey: 'rentals', icon: GanttChartSquare, section: 'rentals' },
      { href: '/dashboard/admin/branches', labelKey: 'branches', icon: Building },
      { href: '/dashboard/admin/playing-school', labelKey: 'playingSchool', icon: School },
    ],
  },
  {
    labelKey: 'groupFinance', icon: Banknote,
    roles: ['conservatorium_admin', 'site_admin', 'delegated_admin'],
    items: [
      { href: '/dashboard/billing', labelKey: 'billing', icon: CreditCard, id: 'nav-billing' },
      { href: '/dashboard/admin/payroll', labelKey: 'teacherPayroll', icon: Banknote, section: 'payroll' },
    ],
  },
  {
    labelKey: 'groupIntelligence', icon: ChartNoAxesCombined,
    roles: ['conservatorium_admin', 'site_admin', 'delegated_admin'],
    defaultCollapsed: true,
    items: [
      { href: '/dashboard/reports', labelKey: 'reportsAnalytics', icon: ChartNoAxesCombined, id: 'nav-reports', section: 'reports' },
      { href: '/dashboard/ai', labelKey: 'aiAgents', icon: BrainCircuit },
      { href: '/dashboard/admin/form-builder', labelKey: 'formBuilder', icon: PencilRuler },
      { href: '/dashboard/ministry-export', labelKey: 'ministryExport', icon: Download },
    ],
  },
  {
    labelKey: 'groupCommunication', icon: MessagesSquare,
    roles: ['conservatorium_admin', 'site_admin', 'delegated_admin'],
    items: [
      { href: '/dashboard/messages', labelKey: 'messages', icon: MessagesSquare, id: 'nav-messages' },
      { href: '/dashboard/forms', labelKey: 'formsAndDocs', icon: FileText, id: 'nav-forms' },
      { href: '/dashboard/notifications', labelKey: 'notifications', icon: Bell, id: 'nav-notifications' },
      { href: '/dashboard/alumni', labelKey: 'alumni', icon: GraduationCap, section: 'alumni' },
    ],
  },

  // â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ TEACHER GROUPS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  {
    labelKey: 'groupMyWorkspace', icon: Music2,
    roles: ['teacher'],
    items: [
      { href: '/dashboard/teacher', labelKey: 'teacherDashboard', icon: Music2, id: 'nav-dashboard-teacher' },
      { href: '/dashboard/schedule', labelKey: 'schedule', icon: CalendarDays, id: 'nav-schedule' },
      { href: '/dashboard/approvals', labelKey: 'approvals', icon: BadgeCheck, id: 'nav-approvals', section: 'approvals' },
    ],
  },
  {
    labelKey: 'groupMyProfile', icon: Music,
    roles: ['teacher'],
    items: [
      { href: '/dashboard/teacher/profile', labelKey: 'teacherProfile', icon: User },
      { href: '/dashboard/teacher/performance-profile', labelKey: 'performanceProfile', icon: Music },
      { href: '/dashboard/teacher/availability', labelKey: 'myAvailability', icon: CalendarCheck, id: 'nav-availability' },
    ],
  },
  {
    labelKey: 'groupMyFinances', icon: Banknote,
    roles: ['teacher'],
    items: [
      { href: '/dashboard/teacher/payroll', labelKey: 'payroll', icon: Banknote },
      { href: '/dashboard/teacher/reports', labelKey: 'myReports', icon: TrendingUp },
    ],
  },
  {
    labelKey: 'groupCommunity', icon: MessagesSquare,
    roles: ['teacher'],
    items: [
      { href: '/dashboard/messages', labelKey: 'messages', icon: MessagesSquare, id: 'nav-messages' },
      { href: '/dashboard/forms', labelKey: 'formsAndDocs', icon: FileText, id: 'nav-forms' },
      { href: '/dashboard/notifications', labelKey: 'notifications', icon: Bell, id: 'nav-notifications' },
      { href: '/dashboard/alumni', labelKey: 'alumni', icon: GraduationCap, section: 'alumni' },
    ],
  },

  // â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ STUDENT GROUPS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  {
    labelKey: 'groupMyLearning', icon: GraduationCap,
    roles: ['student'],
    items: [
      { href: '/dashboard/profile', labelKey: 'myProfile', icon: User, id: 'navprofile' },
      { href: '/dashboard/schedule', labelKey: 'schedule', icon: CalendarDays, id: 'nav-schedule' },
      { href: '/dashboard/progress', labelKey: 'progress', icon: TrendingUp },
    ],
  },
  {
    labelKey: 'groupPractice', icon: Dumbbell,
    roles: ['student'],
    items: [
      { href: '/dashboard/practice', labelKey: 'practiceLog', icon: Dumbbell, id: 'nav-practice' },
      { href: '/dashboard/practice/coach', labelKey: 'aiCoach', icon: Bot },
    ],
  },
  {
    labelKey: 'groupLogistics', icon: Settings,
    roles: ['student'],
    items: [
      { href: '/dashboard/makeups', labelKey: 'makeups', icon: Coins },
      { href: '/dashboard/ai-reschedule', labelKey: 'aiAssistant', icon: CalendarSearch },
      { href: '/dashboard/billing', labelKey: 'billing', icon: CreditCard, id: 'nav-billing' },
      { href: '/dashboard/apply-for-aid', labelKey: 'scholarships', icon: ShieldQuestion },
      { href: '/dashboard/forms', labelKey: 'formsAndDocs', icon: FileText, id: 'nav-forms' },
    ],
  },
  {
    labelKey: 'groupCommunity', icon: MessagesSquare,
    roles: ['student'],
    items: [
      { href: '/dashboard/messages', labelKey: 'messages', icon: MessagesSquare, id: 'nav-messages' },
      { href: '/dashboard/notifications', labelKey: 'notifications', icon: Bell, id: 'nav-notifications' },
      { href: '/dashboard/alumni', labelKey: 'alumni', icon: GraduationCap, section: 'alumni' },
    ],
  },

  // â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ PARENT GROUPS â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  {
    labelKey: 'groupMyFamily', icon: HeartHandshake,
    roles: ['parent'],
    items: [
      { href: '/dashboard/family', labelKey: 'myFamily', icon: HeartHandshake, id: 'nav-family-hub' },
      { href: '/dashboard/schedule', labelKey: 'schedule', icon: CalendarDays, id: 'nav-schedule' },
    ],
  },
  {
    labelKey: 'groupChildProgress', icon: TrendingUp,
    roles: ['parent'],
    items: [
      { href: '/dashboard/progress', labelKey: 'progress', icon: TrendingUp },
      { href: '/dashboard/practice', labelKey: 'practiceLog', icon: Dumbbell, id: 'nav-practice' },
    ],
  },
  {
    labelKey: 'groupParentTools', icon: Bot,
    roles: ['parent'],
    items: [
      { href: '/dashboard/practice/coach', labelKey: 'aiCoach', icon: Bot },
      { href: '/dashboard/ai-reschedule', labelKey: 'aiAssistant', icon: CalendarSearch },
    ],
  },
  {
    labelKey: 'groupFinanceAdmin', icon: CreditCard,
    roles: ['parent'],
    items: [
      { href: '/dashboard/billing', labelKey: 'billing', icon: CreditCard, id: 'nav-billing' },
      { href: '/dashboard/makeups', labelKey: 'makeups', icon: Coins },
      { href: '/dashboard/apply-for-aid', labelKey: 'scholarships', icon: ShieldQuestion },
      { href: '/dashboard/forms', labelKey: 'formsAndDocs', icon: FileText, id: 'nav-forms' },
    ],
  },
  {
    labelKey: 'groupCommunity', icon: MessagesSquare,
    roles: ['parent'],
    items: [
      { href: '/dashboard/messages', labelKey: 'messages', icon: MessagesSquare, id: 'nav-messages' },
      { href: '/dashboard/notifications', labelKey: 'notifications', icon: Bell, id: 'nav-notifications' },
      { href: '/dashboard/alumni', labelKey: 'alumni', icon: GraduationCap, section: 'alumni' },
    ],
  },

  // â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ MINISTRY â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  {
    labelKey: 'groupMinistryOverview', icon: Landmark,
    roles: ['ministry_director'],
    items: [
      { href: '/dashboard/ministry', labelKey: 'ministry', icon: Landmark },
    ],
  },

  // â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ SCHOOL COORDINATOR (SDD-PS Â§7.1) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  {
    labelKey: 'groupMySchool', icon: School,
    roles: ['school_coordinator'],
    items: [
      { href: '/dashboard/school', labelKey: 'mySchool', icon: School },
    ],
  },
]; // end harmoniaNavGroups

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ Notification Item â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const dateLocale = useDateLocale();
  return (
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
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: dateLocale })}
          </div>
        </div>
      </Link>
    </DropdownMenuItem>
  );
};

// â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ Legacy type (unchanged) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

type LinkItem = {
  href: string;
  label: string;
  icon: any;
  roles: string[];
  id?: string;
};

// ——————————————————————————— Inner Props ——————————————————————————————————————

type SidebarNavInnerProps = {
  user: import('@/lib/types').User;
  logout: () => void;
  updateUser: (user: import('@/lib/types').User) => void;
  newFeaturesEnabled: boolean;
};

// ——————————————————————————— Memoized Inner Component ————————————————————————

const SidebarNavInner = memo(function SidebarNavInner({
  user,
  logout,
  updateUser,
  newFeaturesEnabled,
}: SidebarNavInnerProps) {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();

  // Track which groups are collapsed (keyed by labelKey)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    () => Object.fromEntries(
      harmoniaNavGroups
        .filter(g => g.defaultCollapsed)
        .map(g => [g.labelKey, true])
    )
  );

  const toggleGroup = (key: string) =>
    setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const handleHelpClick = () => {
    if (typeof (window as any).openHelpAssistant === 'function') {
      (window as any).openHelpAssistant();
    }
  };

  const userRole = user.role;
  const hasSeenNewFeatures = (user as any).hasSeenNewFeatures ?? true;
  const unreadCount = user.notifications?.filter(n => !n.read).length || 0;

  const handleNotificationsOpen = () => {
    if (unreadCount > 0 && user.notifications) {
      const updatedUser = {
        ...user,
        notifications: user.notifications.map(n => ({ ...n, read: true })),
      };
      updateUser(updatedUser);
    }
  };

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/dashboard' && href !== '/dashboard/teacher' && pathname.startsWith(href));

  // —— Legacy mode: unchanged flat rendering ——————————————————————————————————
  if (!newFeaturesEnabled) {
    const legacyLinks: LinkItem[] = [
      { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin', 'ministry_director'] },
      { href: '/dashboard/forms', label: t('myForms'), icon: FileText, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin'] },
      { href: '/dashboard/approvals', label: t('approvals'), icon: BadgeCheck, roles: ['teacher', 'conservatorium_admin', 'site_admin'] },
      { href: '/dashboard/library', label: t('library'), icon: Book, roles: ['student', 'teacher', 'conservatorium_admin', 'site_admin'] },
      { href: '/dashboard/users', label: t('users'), icon: User, roles: ['conservatorium_admin', 'site_admin', 'delegated_admin'] },
      { href: '/dashboard/ministry', label: t('ministry'), icon: Building, roles: ['ministry_director'] },
    ];

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
            {legacyLinks.map(link => {
              if (!link.roles.includes(userRole)) return null;
              const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <SidebarMenuItem key={link.href} id={link.id}>
                  <Link href={link.href}>
                    <SidebarMenuButton isActive={active}>
                      <link.icon aria-hidden="true" />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} tooltip={t('logout')} aria-label={t('logout')}>
                <LogOut aria-hidden="true" />
                <span>{t('logout')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </>
    );
  }

  // —— New grouped nav ————————————————————————————————————————————————————————
  const delegatedAllowedSections = new Set<AdminSection>(user.delegatedAdminPermissions ?? []);

  const visibleGroups = harmoniaNavGroups
    .filter(g => g.roles.includes(userRole))
    .map(group => {
      if (userRole !== 'delegated_admin') return group;
      const allowedItems = group.items.filter(item => !item.section || delegatedAllowedSections.has(item.section));
      return { ...group, items: allowedItems };
    })
    .filter(group => group.items.length > 0);

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
        <nav aria-label={t('mainNavigation')}>
        {visibleGroups.map(group => {
          const isCollapsed = !!collapsedGroups[group.labelKey];
          return (
            <SidebarGroup key={group.labelKey}>
              <SidebarGroupLabel
                className="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors select-none"
                role="button"
                aria-expanded={!isCollapsed}
                tabIndex={0}
                onClick={() => toggleGroup(group.labelKey)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleGroup(group.labelKey);
                  }
                }}
              >
                <span className="flex items-center gap-2">
                  <group.icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t(group.labelKey)}
                </span>
                <ChevronDown aria-hidden="true" className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none',
                  isCollapsed && '-rotate-90'
                )} />
              </SidebarGroupLabel>
              {!isCollapsed && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(item => (
                      <SidebarMenuItem key={item.href} id={item.id}>
                        <Link href={item.href}>
                          <SidebarMenuButton isActive={isActive(item.href)}>
                            <item.icon className="h-4 w-4" aria-hidden="true" />
                            <span>{t(item.labelKey)}</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between p-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <DropdownMenu onOpenChange={(open) => open && handleNotificationsOpen()}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full group-data-[collapsible=icon]:hidden" aria-label={unreadCount > 0 ? `${t('notifications')} (${unreadCount})` : t('notifications')}>
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 end-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
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
                <Link href="/dashboard/whats-new">
                    <SidebarMenuButton id="nav-whats-new" isActive={pathname.startsWith('/dashboard/whats-new')} tooltip={t('whatsNew')}>
                        <Gift aria-hidden="true" />
                        <span className="flex items-center justify-between w-full">
                            {t('whatsNew')}
                            {!hasSeenNewFeatures && <Badge variant="secondary" className="h-5">{t('newBadge')}</Badge>}
                        </span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/settings">
              <SidebarMenuButton id="nav-settings" isActive={pathname.startsWith('/dashboard/settings')} tooltip={t('settings')}>
                <Settings aria-hidden="true" />
                <span>{t('settings')}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton id="sidebar-help-button" onClick={handleHelpClick} tooltip={t('help')}>
              <MessageCircleQuestion aria-hidden="true" />
              <span>{t('help')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip={t('logout')} aria-label={t('logout')}>
              <LogOut aria-hidden="true" />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}, (prev, next) => {
  // Custom comparator: only re-render when sidebar-relevant data changes
  if (prev.newFeaturesEnabled !== next.newFeaturesEnabled) return false;
  if (prev.user.role !== next.user.role) return false;
  if (prev.user.name !== next.user.name) return false;
  if (prev.user.avatarUrl !== next.user.avatarUrl) return false;
  if ((prev.user.notifications?.length ?? 0) !== (next.user.notifications?.length ?? 0)) return false;
  if ((prev.user.notifications?.filter(n => !n.read).length ?? 0) !== (next.user.notifications?.filter(n => !n.read).length ?? 0)) return false;
  if (prev.user.delegatedAdminPermissions?.length !== next.user.delegatedAdminPermissions?.length) return false;
  return true;
});

// ——————————————————————————— Outer Wrapper (thin, calls useAuth) ———————————

export function SidebarNav() {
  const { user, logout, updateUser, newFeaturesEnabled } = useAuth();

  if (!user) return null;

  return (
    <SidebarNavInner
      user={user}
      logout={logout}
      updateUser={updateUser}
      newFeaturesEnabled={newFeaturesEnabled}
    />
  );
}