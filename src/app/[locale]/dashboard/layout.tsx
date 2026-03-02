import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { WalkthroughManager } from '@/components/dashboard/walkthrough-manager';
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

  return (
    <SidebarProvider>
      <Sidebar side={sidebarSide} collapsible="icon">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
      <WalkthroughManager />
    </SidebarProvider>
  );
}
