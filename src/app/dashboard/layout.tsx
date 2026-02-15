import { Header } from '@/components/dashboard/header';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <Sidebar side="left" collapsible="icon">
          <SidebarNav />
        </Sidebar>
        <SidebarInset>
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
