import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { WalkthroughManager } from '@/components/dashboard/walkthrough-manager';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sidebarSide = locale === 'he' || locale === 'ar' ? 'right' : 'left';
  const tAccessibility = await getTranslations({ locale, namespace: 'AccessibilityPage' });

  return (
    <SidebarProvider>
      <Sidebar side={sidebarSide} collapsible="icon">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 flex min-h-dvh flex-col">
          <div className="flex-1">{children}</div>
          <footer className="mt-8 border-t pt-4 text-sm text-muted-foreground">
            <Link href="/accessibility" className="underline underline-offset-4">
              {tAccessibility('footerLink')}
            </Link>
          </footer>
        </div>
      </SidebarInset>
      <WalkthroughManager />
    </SidebarProvider>
  );
}
