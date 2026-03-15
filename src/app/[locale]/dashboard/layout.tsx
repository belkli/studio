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
  const isRtl = locale === 'he' || locale === 'ar';
  const sidebarSide = isRtl ? 'right' : 'left';
  const tAccessibility = await getTranslations({ locale, namespace: 'AccessibilityPage' });

  return (
    <SidebarProvider dir={isRtl ? 'rtl' : 'ltr'} data-brand="a">
      <Sidebar side={sidebarSide} collapsible="icon">
        <SidebarNav />
      </Sidebar>
      <SidebarInset id="main-content" tabIndex={-1} className="min-w-0">
        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col p-4 sm:p-6 lg:p-8">
          <div id="dashboard-content" className="flex-1">{children}</div>
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
