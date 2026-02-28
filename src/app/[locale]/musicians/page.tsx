import { MusiciansForHire } from '@/components/harmonia/musicians-for-hire';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { PublicFooter } from '@/components/layout/public-footer';

export default function MusiciansPage() {
    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <PublicNavbar />
            <main className="flex-1 pt-14">
                <MusiciansForHire />
            </main>
            <PublicFooter />
        </div>
    );
}



