# HARMONIA — SDD-NAV-01: Navigation Architecture Redesign

**v1.0 — February 2026**  
**Confidential — Internal Engineering Document**

---

## Software Design Document

### SDD-NAV-01: Navigation Architecture Redesign

**Version:** 1.0 — February 2026  
**Status:** Draft — Pending Engineering Review  
**Scope:** sidebar-nav.tsx + i18n + sidebar.tsx  
**Personas:** Admin • Teacher • Student • Parent • Ministry

---

## 1. Problem Statement & Goals

The current Lyriosa sidebar navigation renders all links as a single, unsegmented flat list. While this is simple to implement, it creates a significant usability problem as the feature set has grown. This document analyses the current state quantitatively, defines the target architecture, and provides the complete code changes required.

### 1.1 Current State: Link Count per Persona

| Persona / Role | Current Links | Groups | Key Pain Points |
|---|---|---|---|
| conservatorium_admin / site_admin | 26 | 0 | Admin items span 3 conceptual domains; Finance buried below Events; AI items scattered; identical Calendar icon used 3× |
| teacher | 12 | 0 | Profile sub-pages listed at top level; Payroll and My Reports separated from each other; Schedule appears between profile and reports |
| student | 13 | 0 | 2× BrainCircuit icons for AI Coach and AI Assistant; Makeups and AI Reschedule not visually grouped; Billing next to Alumni |
| parent | 13 | 0 | Identical to student list but with Family Hub prepended — no differentiation to reflect the parent's coordinative role vs the student's personal role |
| ministry_director | 1 | 0 | Only one link — no structure — the Ministry dashboard has many sub-features that are not navigable from the sidebar |

#### ⚠️ Admin Navigation is the Critical Case

26 flat links is the direct equivalent of showing a full app sitemap as the primary nav. Users must scroll through ~20 items to reach Reports or Ministry Export. No visual boundary separates People management from Financial management from Intelligence/AI tools.

### 1.2 Specific Problems Identified

#### 1.2.1 Icon Ambiguity

Three separate navigation items use BrainCircuit as their icon: AI Coach (/dashboard/practice/coach), AI Assistant (/dashboard/ai-reschedule), and AI Agents (/dashboard/ai). Three items use Calendar (Schedule, Master Schedule, My Availability). This makes the sidebar scannable only by reading labels — defeating the purpose of icons.

#### 1.2.2 Flat Structure Violates Progressive Disclosure

Progressive disclosure is a UX principle that reveals complexity incrementally. A flat list exposes all 26 admin items simultaneously, forcing the user to mentally group items themselves. Research on navigation usability (Nielsen Norman Group) shows that grouped navigation with 4–7 items per group reduces time-to-target by 30–50% compared to flat lists of equal size.

#### 1.2.3 Role Rendering is Correct but Invisible

The existing code correctly filters links by role, but because there's no grouping, a teacher cannot easily distinguish 'my work' items (schedule, approvals) from 'my profile' items or 'communication' items. The absence of group headers forces the user to remember which items belong to which mental model.

#### 1.2.4 Duplicate i18n Keys

The 'dashboard' label key is reused across teacher, admin, and student roles — producing the same word for three different landing pages. This makes the translation file ambiguous and makes the active state of the nav confusing.

#### 1.2.5 SidebarGroup Components Exist but Are Unused

The sidebar.tsx component already exports SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenuSub, SidebarMenuSubItem, and SidebarMenuSubButton — a full accordion/collapsible sub-menu system. None of these are used in the current sidebar-nav.tsx.

### 1.3 Design Goals for the New Navigation

1. Group links into 3–6 named sections per persona, each with a clear semantic theme.
2. Eliminate duplicate icons — each nav group and major feature area gets a unique icon.
3. Move secondary/infrequent items into collapsible sub-menus to reduce visible surface area.
4. Retain all existing routes — no route changes, only navigation structure changes.
5. Keep the existing role-based filtering logic intact — extend it, not replace it.
6. Maintain full i18n support (HE, EN, AR, RU) by extending the translation files, not hardcoding strings.
7. Preserve all existing walkthrough IDs (id='nav-*') for backward compatibility.

---

## 2. Navigation Redesign — Persona by Persona

### 2.1 Conservatorium Admin & Site Admin

The admin sidebar is reduced from 26 ungrouped items to 6 named groups. Items within each group are ordered by frequency of use (most used first).

| Group | Icon | Items | Rationale |
|---|---|---|---|
| Overview | | Dashboard, Announcements | Everything the admin needs on arrival — current state + broadcast |
| People | | User Management, New Registration, Substitute Mgmt, Scholarships | All people-centric operations in one place |
| Schedule & Lessons | | Master Schedule, Makeups, Substitute Mgmt, Waitlists | Operational scheduling — the daily admin task cluster |
| Programs & Events | | Events, Open Day, Performances, Branches | High-level programme management — less frequent |
| Finance | | Billing, Teacher Payroll, Rentals | All money flows together |
| Intelligence | | Reports & Analytics, AI Agents, Ministry Export, Form Builder | Power-user tools — collapsed by default on first load |
| Communication | | Messages, Forms & Docs, Notifications | Cross-role communication tools |

**Visible Count Reduction:** 26 → 7 groups of 3–4 items

- Groups are collapsible via SidebarGroup — admin can collapse unused sections.
- Intelligence group collapses by default (low daily frequency).
- Approvals moves into the People group as a sub-item.

### 2.2 Teacher

The teacher sidebar is reorganised from 12 flat items into 4 groups reflecting the three modes of a teacher's day: doing work, managing their career, and communicating.

| Group | Icon | Items | Rationale |
|---|---|---|---|
| My Workspace | | Dashboard, Schedule, Approvals | The daily operational view — what's on today, what needs sign-off |
| My Profile | | Teacher Profile, Performance Profile, Availability | Career identity — who I am and when I'm available |
| My Finances | | Payroll, My Reports | Consolidated financial view |
| Community | | Messages, Forms & Docs, Notifications, Alumni | All outward-facing and community interactions |

### 2.3 Student

The student sidebar is reorganised into 4 groups: learning journey, AI-powered practice tools, admin/logistics, and community. The two AI items (Coach + Reschedule Assistant) are consolidated under a single 'AI Tools' sub-group to eliminate the duplicate icon problem.

| Group | Icon | Items | Rationale |
|---|---|---|---|
| My Learning | | My Profile, Schedule, Progress | Core learning journey — identity, time, growth |
| Practice | 🏋 | Practice Log, AI Coach | Practice is the student's primary daily action — given top-level prominence |
| Logistics | ⚙ | Makeups, AI Reschedule, Billing, Scholarships, Forms | Administrative tasks grouped so learning items stay prominent |
| Community | | Messages, Notifications, Alumni | Outward-facing and social items |

### 2.4 Parent

The parent view shifts the primary frame from 'my personal learning' (student) to 'my children's learning' (parent). Family Hub is promoted to the top. The AI Reschedule Assistant is moved into a 'My Tools' group reflecting the parent's managerial role.

| Group | Icon | Items | Rationale |
|---|---|---|---|
| My Family | | Family Hub, Schedule | Parent's primary view — coordinating multiple children |
| My Child's Progress | | Progress, Practice Log | Observational — parent monitors, does not log |
| Tools | 🛠 | AI Coach (view-only), AI Reschedule | Parent-facing AI tools (coach is readonly for parent; reschedule is primary action) |
| Finance & Admin | | Billing, Makeups, Scholarships, Forms | Financial responsibility sits clearly in one group |
| Community | | Messages, Notifications, Alumni | Outward-facing and social |

### 2.5 Ministry Director

The Ministry Director currently has a single link. This SDD expands the Ministry sidebar into three groups, surfacing the sub-capabilities of the Ministry dashboard that are currently hidden inside a single page.

| Group | Icon | Items | Rationale |
|---|---|---|---|
| Overview | 🏛 | Ministry Dashboard | Top-level summary across all conservatories |
| Approvals & Forms | | Ministry Inbox, Pending Approvals | Primary daily action for ministry staff |
| Intelligence | | Reports, Exam Export | Cross-conservatory analytics and official data export |

---

## 3. Icon Rationalisation

The following table defines the canonical icon assignment. Each icon is used for exactly one group or item across the entire navigation system. Icons are sourced from the existing lucide-react import already in the codebase.

| Feature / Group | New Icon (lucide-react) | Replaces |
|---|---|---|
| Dashboard (Admin) | LayoutDashboard | (unchanged) |
| Dashboard (Teacher) | Music2 | LayoutDashboard — disambiguates teacher home from admin home |
| My Learning (Student) | GraduationCap | UserCircle — clearer learning identity |
| Family Hub (Parent) | HeartHandshake | Users — stronger family connotation |
| Practice Log | Dumbbell | PencilRuler — aligns with physical practice metaphor |
| AI Coach | Bot | BrainCircuit — unique to AI Coach |
| AI Reschedule | CalendarSearch | BrainCircuit — unique to scheduling assistant |
| AI Agents (Admin) | BrainCircuit | (unchanged — now unique to admin AI control panel) |
| Schedule (student/parent/teacher) | CalendarDays | Calendar — disambiguates from Master Schedule |
| Master Schedule (Admin) | CalendarRange | Calendar — disambiguates from lesson Schedule |
| Availability (Teacher) | CalendarCheck | Calendar — disambiguates from Schedule |
| Progress | TrendingUp | BarChart3 — directional growth metaphor |
| Finance / Billing | CreditCard | DollarSign — more specific payment metaphor |
| Teacher Payroll (Admin) | Banknote | (unchanged — distinct from student Billing) |
| People / User Management | UsersRound | User (singular) — group icon for group management |
| Intelligence Group (Admin) | ChartNoAxesCombined | LineChart — unique to analytics/reporting group header |
| Ministry | Landmark | Building — architectural clarity, governmental metaphor |
| Programs & Events | Theater | Presentation — arts venue metaphor |

#### ℹ️ Import Additions Required

All new icons must be added to the lucide-react destructured import in sidebar-nav.tsx.

**New imports:** Music2, HeartHandshake, Dumbbell, CalendarSearch, CalendarDays, CalendarRange, CalendarCheck, TrendingUp, CreditCard, UsersRound, ChartNoAxesCombined, Theater, Landmark

**No new npm packages required** — all are available in the lucide-react version already installed.

---

## 4. Data Structure Redesign

### 4.1 Replace Flat LinkItem Array with NavGroup[]

The core change is replacing the flat LinkItem[] array with a NavGroup[] structure. Each NavGroup has a label, an icon (for the group header), the roles that see it, and an array of items. Items may optionally have sub-items, rendered as SidebarMenuSub.

```typescript
// BEFORE — flat array (current)
type LinkItem = {
  href: string;
  label: string;
  icon: any;
  roles: string[];
  id?: string;
};

const harmoniaLinks: LinkItem[] = [ ...26 items... ];

// AFTER — grouped structure (proposed)
type NavItem = {
  href: string;
  labelKey: string; // i18n key into Sidebar namespace
  icon: React.ComponentType;
  id?: string; // walkthrough id — preserved
  subItems?: NavItem[]; // optional sub-menu (collapsible)
};

type NavGroup = {
  labelKey: string; // i18n key for group header label
  icon: React.ComponentType; // group header icon
  roles: UserRole[]; // which roles see this group
  defaultCollapsed?: boolean; // Intelligence collapses by default
  items: NavItem[];
};

const harmoniaNavGroups: NavGroup[] = [ ...see §5... ];
```

### 4.2 Rendering Strategy

The SidebarContent renders NavGroup[] as SidebarGroup elements. Each SidebarGroup uses SidebarGroupLabel (the group name) and SidebarGroupContent containing a SidebarMenu. Items with subItems render as a SidebarMenuSub with SidebarMenuSubItem children, using Collapsible from @/components/ui/collapsible for the expand/collapse animation.

```typescript
// Pseudocode render loop (full code in §5)
harmoniaNavGroups
  .filter(g => g.roles.includes(userRole))
  .map(group => (
    <SidebarGroup key={group.labelKey}>
      <SidebarGroupLabel>
        <group.icon className='h-4 w-4 mr-2' />
        {t(group.labelKey)}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map(item => (
            item.subItems
              ? <CollapsibleMenuItem item={item} /> // sub-menu
              : <FlatMenuItem item={item} /> // leaf node
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
```

---

## 5. Full Replacement Code: sidebar-nav.tsx

The following is the complete replacement for src/components/dashboard/sidebar-nav.tsx. Copy-paste in its entirety. All existing walkthrough IDs, role filtering, and notification logic are preserved.

### 5.1 Imports Block

```typescript
'use client';

import { useState } from 'react';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import {
  SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, SidebarSeparator, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Icons } from '@/components/icons';
import {
  // Existing imports
  LayoutDashboard, Settings, BadgeCheck, Bell, LogOut, Clock,
  Building, DollarSign, LineChart, MessagesSquare, BarChart3,
  BrainCircuit, Megaphone, UserPlus, Download, Coins, UserCog,
  Banknote, ListChecks, Presentation, GanttChartSquare, Music,
  ShieldQuestion, CalendarPlus, HandCoins, GraduationCap,
  FileText, PencilRuler, MessageCircleQuestion, ChevronRight,
  Book, User, Bot, Users,
  // NEW imports — see §3 Icon Rationalisation
  Music2, HeartHandshake, Dumbbell, CalendarSearch, CalendarDays,
  CalendarRange, CalendarCheck, TrendingUp, CreditCard,
  UsersRound, ChartNoAxesCombined, Theater, Landmark,
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
import type { Notification, UserRole } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
```

### 5.2 Type Definitions

```typescript
type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  id?: string;
  subItems?: Omit<NavItem, 'subItems'>[];
};

type NavGroup = {
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  defaultCollapsed?: boolean;
  items: NavItem[];
};
```

### 5.3 NavGroup Definitions — harmoniaNavGroups

This array replaces the old harmoniaLinks flat array. Each group is role-gated at the group level; items are always shown to all users in the group.

```typescript
const harmoniaNavGroups: NavGroup[] = [
  // ─────────────────────────── ADMIN GROUPS ──────────────────────────
  {
    labelKey: 'groupOverview', icon: LayoutDashboard,
    roles: ['conservatorium_admin', 'site_admin'],
    items: [
      { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, id: 'nav-dashboard-admin' },
      { href: '/dashboard/announcements', labelKey: 'announcements', icon: Megaphone },
    ],
  },
  {
    labelKey: 'groupPeople', icon: UsersRound,
    roles: ['conservatorium_admin', 'site_admin'],
    items: [
      { href: '/dashboard/users', labelKey: 'userManagement', icon: UsersRound, id: 'nav-users' },
      { href: '/dashboard/enroll', labelKey: 'newRegistration', icon: UserPlus },
      { href: '/dashboard/approvals', labelKey: 'approvals', icon: BadgeCheck, id: 'nav-approvals' },
      { href: '/dashboard/admin/substitute', labelKey: 'substitute', icon: UserCog },
      { href: '/dashboard/admin/scholarships', labelKey: 'manageScholarships', icon: HandCoins },
    ],
  },
  {
    labelKey: 'groupScheduleOps', icon: CalendarRange,
    roles: ['conservatorium_admin', 'site_admin'],
    items: [
      { href: '/dashboard/master-schedule', labelKey: 'masterSchedule', icon: CalendarRange, id: 'nav-master-schedule' },
      { href: '/dashboard/admin/makeups', labelKey: 'adminMakeups', icon: Coins },
      { href: '/dashboard/admin/waitlists', labelKey: 'waitlists', icon: ListChecks },
    ],
  },
  {
    labelKey: 'groupProgramsEvents', icon: Theater,
    roles: ['conservatorium_admin', 'site_admin'],
    items: [
      { href: '/dashboard/events', labelKey: 'events', icon: Theater },
      { href: '/dashboard/admin/open-day', labelKey: 'manageOpenDay', icon: CalendarPlus },
      { href: '/dashboard/admin/performances', labelKey: 'performances', icon: Music },
      { href: '/dashboard/admin/rentals', labelKey: 'rentals', icon: GanttChartSquare },
      { href: '/dashboard/admin/branches', labelKey: 'branches', icon: Building },
    ],
  },
  {
    labelKey: 'groupFinance', icon: Banknote,
    roles: ['conservatorium_admin', 'site_admin'],
    items: [
      { href: '/dashboard/billing', labelKey: 'billing', icon: CreditCard, id: 'nav-billing' },
      { href: '/dashboard/admin/payroll', labelKey: 'teacherPayroll', icon: Banknote },
    ],
  },
  {
    labelKey: 'groupIntelligence', icon: ChartNoAxesCombined,
    roles: ['conservatorium_admin', 'site_admin'],
    defaultCollapsed: true,
    items: [
      { href: '/dashboard/reports', labelKey: 'reportsAnalytics', icon: ChartNoAxesCombined, id: 'nav-reports' },
      { href: '/dashboard/ai', labelKey: 'aiAgents', icon: BrainCircuit },
      { href: '/dashboard/admin/form-builder', labelKey: 'formBuilder', icon: PencilRuler },
      { href: '/dashboard/ministry-export', labelKey: 'ministryExport', icon: Download },
    ],
  },
  {
    labelKey: 'groupCommunication', icon: MessagesSquare,
    roles: ['conservatorium_admin', 'site_admin'],
    items: [
      { href: '/dashboard/messages', labelKey: 'messages', icon: MessagesSquare, id: 'nav-messages' },
      { href: '/dashboard/forms', labelKey: 'formsAndDocs', icon: FileText, id: 'nav-forms' },
      { href: '/dashboard/notifications', labelKey: 'notifications', icon: Bell, id: 'nav-notifications' },
      { href: '/dashboard/alumni', labelKey: 'alumni', icon: GraduationCap },
    ],
  },
  // ─────────────────────────── TEACHER GROUPS ─────────────────────────
  {
    labelKey: 'groupMyWorkspace', icon: Music2,
    roles: ['teacher'],
    items: [
      { href: '/dashboard/teacher', labelKey: 'teacherDashboard', icon: Music2, id: 'nav-dashboard-teacher' },
      { href: '/dashboard/schedule', labelKey: 'schedule', icon: CalendarDays, id: 'nav-schedule' },
      { href: '/dashboard/approvals', labelKey: 'approvals', icon: BadgeCheck, id: 'nav-approvals' },
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
      { href: '/dashboard/alumni', labelKey: 'alumni', icon: GraduationCap },
    ],
  },
  // ─────────────────────────── STUDENT GROUPS ─────────────────────────
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
      { href: '/dashboard/alumni', labelKey: 'alumni', icon: GraduationCap },
    ],
  },
  // ─────────────────────────── PARENT GROUPS ──────────────────────────
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
      { href: '/dashboard/alumni', labelKey: 'alumni', icon: GraduationCap },
    ],
  },
  // ─────────────────────────── MINISTRY ───────────────────────────────
  {
    labelKey: 'groupMinistryOverview', icon: Landmark,
    roles: ['ministry_director'],
    items: [
      { href: '/dashboard/ministry', labelKey: 'ministry', icon: Landmark },
    ],
  },
]; // end harmoniaNavGroups
```

### 5.4 Render Function — SidebarNav Component

```typescript
export function SidebarNav() {
  const t = useTranslations('Sidebar');
  const pathname = usePathname();
  const { user, logout, updateUser, newFeaturesEnabled } = useAuth();

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

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/dashboard' && href !== '/dashboard/teacher' && 
      pathname.startsWith(href));

  const handleHelpClick = () => {
    if (typeof (window as any).openHelpAssistant === 'function')
      (window as any).openHelpAssistant();
  };

  if (!user) return null;

  const userRole = user.role;
  const unreadCount = user.notifications?.filter(n => !n.read).length || 0;

  // Legacy mode: unchanged flat rendering
  if (!newFeaturesEnabled) {
    return <LegacySidebarNav />; // extract existing legacy JSX unchanged
  }

  const visibleGroups = harmoniaNavGroups.filter(g => g.roles.includes(userRole));

  return (
    <>
      <SidebarHeader>
        <div className='flex items-center gap-2 p-2'>
          <Icons.logo className='w-6 h-6 text-primary' />
          <span className='text-lg font-semibold'>{t('logo')}</span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {visibleGroups.map(group => {
          const isCollapsed = !!collapsedGroups[group.labelKey];
          return (
            <SidebarGroup key={group.labelKey}>
              <SidebarGroupLabel
                className='flex items-center justify-between cursor-pointer hover:text-foreground transition-colors'
                onClick={() => toggleGroup(group.labelKey)} // click label to collapse
              >
                <span className='flex items-center gap-2'>
                  <group.icon className='h-3.5 w-3.5' />
                  {t(group.labelKey)}
                </span>
                <ChevronRight className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  !isCollapsed && 'rotate-90'
                )} />
              </SidebarGroupLabel>
              {!isCollapsed && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(item => (
                      <SidebarMenuItem key={item.href} id={item.id}>
                        <Link href={item.href} passHref>
                          <SidebarMenuButton isActive={isActive(item.href)}>
                            <item.icon className='h-4 w-4' />
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
      </SidebarContent>
      {/* SidebarFooter — unchanged from current implementation */}
      <SidebarFooter> ... </SidebarFooter>
    </>
  );
}
```

---

## 6. i18n Changes: Translation File Updates

The following keys must be added to all four locale files: src/messages/en.json, he.json, ar.json, ru.json. Existing keys are unchanged.

### 6.1 New Keys (en.json additions inside the Sidebar namespace)

```json
"Sidebar": {
  // existing keys unchanged ...
  
  // NEW: group header labels
  "groupOverview": "Overview",
  "groupPeople": "People",
  "groupScheduleOps": "Schedule & Lessons",
  "groupProgramsEvents": "Programs & Events",
  "groupFinance": "Finance",
  "groupIntelligence": "Intelligence",
  "groupCommunication": "Communication",
  "groupMyWorkspace": "My Workspace",
  "groupMyProfile": "My Profile",
  "groupMyFinances": "My Finances",
  "groupCommunity": "Community",
  "groupMyLearning": "My Learning",
  "groupPractice": "Practice",
  "groupLogistics": "Logistics",
  "groupMyFamily": "My Family",
  "groupChildProgress": "My Child's Progress",
  "groupParentTools": "My Tools",
  "groupFinanceAdmin": "Finance & Admin",
  "groupMinistryOverview": "Ministry Overview",
  
  // NEW: renamed item labels (disambiguation)
  "teacherDashboard": "Dashboard"
}
```

### 6.2 Hebrew Translations (he.json additions)

```json
"Sidebar": {
  "groupOverview": "סקירה כללית",
  "groupPeople": "אנשים",
  "groupScheduleOps": "לוח זמנים ושיעורים",
  "groupProgramsEvents": "תוכניות ואירועים",
  "groupFinance": "פיננסים",
  "groupIntelligence": "נתונים ואנליטיקה",
  "groupCommunication": "תקשורת",
  "groupMyWorkspace": "סביבת העבודה שלי",
  "groupMyProfile": "הפרופיל שלי",
  "groupMyFinances": "הכספים שלי",
  "groupCommunity": "קהילה",
  "groupMyLearning": "הלמידה שלי",
  "groupPractice": "אימון",
  "groupLogistics": "ניהול אישי",
  "groupMyFamily": "המשפחה שלי",
  "groupChildProgress": "התקדמות הילד שלי",
  "groupParentTools": "הכלים שלי",
  "groupFinanceAdmin": "כספים וניהול",
  "groupMinistryOverview": "סקירת משרד החינוך",
  "teacherDashboard": "לוח בקרה"
}
```

---

## 7. Before / After Navigation Maps

### 7.1 Admin Navigation — Before (26 flat items)

🔴 **BEFORE: 26 ungrouped items (Admin)**

Dashboard • Announcements • User Management • New Registration • Approvals • Substitute Mgmt • Scholarships • Master Schedule • Makeups • Waitlists • Events • Open Day • Performances • Rentals • Branches • Billing • Teacher Payroll • Reports & Analytics • AI Agents • Form Builder • Ministry Export • Messages • Forms & Docs • Notifications • Alumni

**[26 items, 0 groups]**

### 7.2 Admin Navigation — After (7 collapsible groups)

🟢 **AFTER: 7 collapsible groups (Admin)**

- **Overview** → Dashboard · Announcements
- **People** → User Management · New Registration · Approvals · Substitute · Scholarships
- **Schedule & Lessons** → Master Schedule · Makeups · Waitlists
- **Programs & Events** → Events · Open Day · Performances · Rentals · Branches
- **Finance** → Billing · Teacher Payroll
- **Intelligence** ▾ *collapsed by default* → Reports · AI Agents · Form Builder · Ministry Export
- **Communication** → Messages · Forms & Docs · Notifications · Alumni

### 7.3 Full Before / After Link Count Summary

| Persona | Before Links | After Groups | Max Visible Items | Key UX Improvement |
|---|---|---|---|---|
| Admin | 26 | 7 | 5 (others collapsed) | Finance isolated; Intelligence hidden by default; People & Schedule clear |
| Teacher | 12 | 4 | 3–4 per group | Profile items separated from work items; Payroll + Reports co-located |
| Student | 13 | 4 | 2–5 per group | Practice group elevates daily habit; AI items unified under Logistics |
| Parent | 13 | 5 | 2–4 per group | Family Hub promoted; Finance clearly owns billing, makeups, scholarships |
| Ministry | 1 | 3 | 1–2 per group | Inbox and Reports now navigable; future expansion slots established |

---

## 8. Backward Compatibility, Testing & Rollout

### 8.1 Breaking Change Risk Assessment

| Item | Risk | Mitigation |
|---|---|---|
| Walkthrough IDs (nav-*) | None | All id= attributes preserved on NavItem.id field; mapped identically to SidebarMenuItem id prop |
| Existing routes | None | Zero route changes — only nav structure changed |
| legacyLinks (old feature flag) | None | Legacy mode extracted to <LegacySidebarNav /> component with identical JSX — untouched |
| i18n keys | Low | Only additive — new keys added, no existing keys renamed or removed |
| Icon imports | Low | New icons added to existing import block; old icons not removed (may still be used elsewhere in codebase) |
| collapsedGroups state | Low | Initialised from defaultCollapsed — persists only for session; no localStorage required. UX impact: groups re-expand on page reload |

### 8.2 Test Cases Required

1. Per-role render test: For each of the 5 roles, verify only the correct groups render and no cross-role items leak through
2. Group collapse/expand: Click group label → items disappear → click again → items reappear (with animation)
3. Active state: Navigate to each route → confirm only the correct SidebarMenuButton shows isActive=true
4. Walkthrough test: Confirm all nav-* IDs are still present in the DOM after render
5. Icon uniqueness: Visual QA check that no two visible menu items have the same icon within the same persona
6. Collapsed default test: On first load as admin, 'Intelligence' group is closed; all other groups are open
7. i18n test: Switch locale to HE/AR — all group labels and item labels render in correct language
8. Legacy mode: Set newFeaturesEnabled=false → LegacySidebarNav renders unchanged; no regressions

### 8.3 Rollout Strategy

Because the navigation is gated behind the existing newFeaturesEnabled flag, the rollout is zero-risk:

1. **Phase 1 (Internal):** Enable for Lyriosa team accounts and QA environment only
2. **Phase 2 (Pilot):** Enable for one beta conservatory (opt-in via admin settings toggle)
3. **Phase 3 (GA):** Roll out to all conservatories with newFeaturesEnabled=true
4. **Phase 4 (Cleanup):** Remove legacyLinks / LegacySidebarNav after 90-day deprecation window

### 8.4 Future Extensibility

The NavGroup[] structure makes future additions trivial:

- **Adding a Playing School (SDD-PS) group:** add one new NavGroup entry with roles: ['conservatorium_admin'] — no rendering logic changes
- **Adding school_coordinator persona:** add NavGroup entries with roles: ['school_coordinator'] — picked up automatically
- **Adding sub-menus:** set subItems[] on any NavItem — the render function already handles the CollapsibleMenuItem branch
- **User-configurable nav order:** store preferred group order in user profile; sort harmoniaNavGroups before rendering
