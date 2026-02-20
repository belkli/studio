import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { WalkthroughManager } from '@/components/dashboard/walkthrough-manager';
import { AiHelpAssistant } from '@/components/dashboard/harmonia/ai-help-assistant';
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
      <Sidebar side="left" collapsible="icon">
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
        <AiHelpAssistant />
      </SidebarInset>
      <WalkthroughManager />
    </SidebarProvider>
  );
}
