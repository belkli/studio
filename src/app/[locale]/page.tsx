import type { Metadata } from 'next';
import { PublicLandingPage } from '@/components/harmonia/public-landing-page';
import { BRAND_NAME, BRAND_DOMAIN } from '@/lib/brand';

export function generateMetadata(): Metadata {
  return {
    title: `${BRAND_NAME} - Music for Every Child`,
    description: 'Professional music conservatories across Israel.',
    openGraph: {
      title: BRAND_NAME,
      description: 'Professional music conservatories across Israel.',
      images: ['/images/og-lyriosa.jpg'],
    },
    alternates: {
      canonical: BRAND_DOMAIN,
      languages: {
        he: `${BRAND_DOMAIN}/he`,
        en: `${BRAND_DOMAIN}/en`,
      },
    },
  };
}

export default function HomePage() {
  return <PublicLandingPage />;
}
