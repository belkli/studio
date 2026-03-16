'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, LogOut, Search, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '../language-switcher';
import { BrandToggle } from '@/components/brand-toggle';

export function Header() {
  const t = useTranslations('Dashboard.header');
  const tCommon = useTranslations('Common.shared');
  const { user } = useAuth(); // Get user from auth context

  if (!user) return null; // Or show a login button if appropriate for this layout

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="relative me-auto flex-1 md:grow-0">
        <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={tCommon('search')}
          className="w-full rounded-lg bg-background ps-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <LanguageSwitcher />
      <BrandToggle />
      <Button variant="ghost" size="icon" className="rounded-full">
        <Bell className="h-5 w-5" />
        <span className="sr-only">{t('notifications')}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('profile')}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="flex items-center">
              <User className="me-2 h-4 w-4" />
              <span>{t('profile')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="me-2 h-4 w-4" />
              <span>{t('settings')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="me-2 h-4 w-4" />
            <span>{t('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
