import { AvailableSlotsMarketplace } from "@/components/harmonia/available-slots-marketplace";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { useTranslations } from 'next-intl';
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AvailableNowPage() {
    const tAvailable = useTranslations('AvailableNow');
    const heroImage = PlaceHolderImages.find(img => img.id === 'available-now-hero');

    return (
        <div className="flex flex-col min-h-dvh bg-background">
            <PublicNavbar />
            <main className="flex-1 pt-14">
                <section className="relative w-full py-12 md:py-24 lg:py-32 bg-slate-900 text-white">
                    {heroImage && (
                        <Image
                            src={heroImage.imageUrl}
                            alt={heroImage.description}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="z-0 opacity-20"
                            data-ai-hint={heroImage.imageHint}
                        />
                    )}
                    <div className="container relative z-10 px-4 md:px-6">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">{tAvailable('title')}</h1>
                            <p className="max-w-[900px] text-neutral-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                {tAvailable('subtitle')}
                            </p>
                        </div>
                    </div>
                </section>
                <section className="w-full py-12">
                    <div className="container px-4 md:px-6">
                        <AvailableSlotsMarketplace />
                    </div>
                </section>
            </main>
            <PublicFooter />
        </div>
    );
}
