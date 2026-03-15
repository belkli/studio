import { redirect } from 'next/navigation';
import { getClaimsFromRequest } from '@/lib/auth-utils';
import type { UserRole } from '@/lib/types';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';

const ROLE_REDIRECTS: Partial<Record<UserRole, string>> = {
  site_admin: '/dashboard/admin',
  conservatorium_admin: '/dashboard/admin',
  teacher: '/dashboard/teacher',
  parent: '/dashboard/family',
  student: '/dashboard/profile',
  ministry_director: '/dashboard/ministry',
  school_coordinator: '/dashboard/school',
};

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const claims = await getClaimsFromRequest();

  if (claims?.role) {
    const target = ROLE_REDIRECTS[claims.role as UserRole];
    if (target) {
      redirect(`/${locale}${target}`);
    }
  }

  // Fallback: render generic overview if role has no specific redirect
  return <DashboardOverview />;
}
