import { DonationLandingPage } from '@/components/harmonia/donation-landing-page';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';

export default function DonatePage() {
    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <PublicNavbar />
            <main className="flex-1 pt-14">
                <DonationLandingPage />
            </main>
            <PublicFooter />
        </div>
    );
}


