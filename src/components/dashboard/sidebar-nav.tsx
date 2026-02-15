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
} from '@/components/ui/sidebar';
import { Icons } from '@/components/icons';
import { Book, FileText, LayoutDashboard, Settings, User, BadgeCheck } from 'lucide-react';
import { mockUser } from '@/lib/data';

const links = [
    { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
    { href: '/dashboard/forms', label: 'הטפסים שלי', icon: FileText },
    { href: '/dashboard/approvals', label: 'אישורים ממתינים', icon: BadgeCheck, role: 'teacher' },
    { href: '/dashboard/library', label: 'ספרייה', icon: Book, role: 'site_admin' },
    { href: '/dashboard/users', label: 'משתמשים', icon: User, role: 'conservatorium_admin' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const userRole = mockUser.role; // In a real app, get this from session

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
            if (link.role && link.role !== userRole && userRole !== 'site_admin') {
                return null;
            }
            // Site admin can see everything
            if (link.role === 'teacher' && userRole !== 'teacher' && userRole !== 'site_admin') {
                return null;
            }
            if (link.role === 'conservatorium_admin' && userRole !== 'conservatorium_admin' && userRole !== 'site_admin') {
                return null;
            }
            return (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} passHref>
                    <SidebarMenuButton
                      isActive={pathname === link.href}
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
      </SidebarMenu>
    </>
  );
}
