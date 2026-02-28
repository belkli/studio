import { OpenDayLandingPage } from '@/components/harmonia/open-day-landing';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';

export default function OpenDayPage() {
    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <PublicNavbar />
            <main className="flex-1 pt-14">
                <OpenDayLandingPage />
            </main>
            <PublicFooter />
        </div>
    );
}

