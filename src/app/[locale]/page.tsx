import type { Metadata } from 'next';
import { PublicLandingPage } from '@/components/harmonia/public-landing-page';

export function generateMetadata(): Metadata {
  return {
    title: 'Harmonia - Music for Every Child',
    description: 'Professional music conservatories across Israel.',
    openGraph: {
      title: 'Harmonia',
      description: 'Professional music conservatories across Israel.',
      images: ['/images/og-harmonia.jpg'],
    },
    alternates: {
      canonical: 'https://harmonia.co.il',
      languages: {
        he: 'https://harmonia.co.il/he',
        en: 'https://harmonia.co.il/en',
      },
    },
  };
}

export default function HomePage() {
  return <PublicLandingPage />;
}
