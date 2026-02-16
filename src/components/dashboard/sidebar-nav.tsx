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
import { Book, FileText, LayoutDashboard, Settings, User, BadgeCheck, Bell, PlusCircle } from 'lucide-react';
import { mockUser } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const links = [
    { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
    { href: '/dashboard/forms', label: 'הטפסים שלי', icon: FileText },
    { href: '/dashboard/approvals', label: 'אישורים', icon: BadgeCheck, role: 'teacher' },
    { href: '/dashboard/library', label: 'ספרייה', icon: Book, role: 'site_admin' },
    { href: '/dashboard/users', label: 'משתמשים', icon: User, role: 'conservatorium_admin' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const user = mockUser;
  const userRole = user.role;

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
            const userCanView = !link.role || userRole === 'site_admin' || userRole === link.role;
            if (!userCanView) {
                return null;
            }
            
            return (
                <SidebarMenuItem key={link.href}>
                  <Link href={link.href} passHref>
                    <SidebarMenuButton
                      isActive={pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))}
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
      
      <div className="p-4 space-y-2 mt-auto">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
             <Button variant="ghost" size="icon" className="rounded-full group-data-[collapsible=icon]:hidden">
                <Bell className="h-5 w-5" />
                <span className="sr-only">התראות</span>
            </Button>
        </div>
        <Button asChild className="w-full">
            <Link href="/dashboard/forms/new">
                <PlusCircle className="me-2 h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">טופס חדש</span>
            </Link>
        </Button>
      </div>

      <SidebarFooter>
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
      </SidebarFooter>
    </>
  );
}
