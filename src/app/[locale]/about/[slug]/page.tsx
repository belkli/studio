import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ConservatoriumPublicProfilePage } from '@/components/harmonia/conservatorium-public-profile-page';
import { extractConservatoriumIdFromSlug } from '@/lib/utils/conservatorium-slug';

type PageParams = {
  locale: string;
  slug: string;
};

type ConservatoriumDoc = {
  id: number;
  name: string;
  name_en?: string;
  city?: string;
  city_en?: string;
  about?: string;
  photos?: string[];
  official_site?: string | null;
};

function getNumericConservatoriumId(value: string | null): number | null {
  if (!value) return null;
  const direct = value.match(/^(?:cons-)?(\d+)$/);
  if (direct) return Number(direct[1]);
  return null;
}

async function loadConservatoriumDocById(id: number | null): Promise<ConservatoriumDoc | null> {
  if (!id) return null;
  const filePath = path.join(process.cwd(), 'docs', 'Conservatoriums', 'conservatoriums.json');
  const raw = await readFile(filePath, 'utf8');
  const all = JSON.parse(raw) as ConservatoriumDoc[];
  return all.find((item) => item.id === id) || null;
}

export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://harmonia.co.il';
  const conservatoriumId = extractConservatoriumIdFromSlug(slug);
  const numericId = getNumericConservatoriumId(conservatoriumId);
  const doc = await loadConservatoriumDocById(numericId);

  const title = doc?.name_en || doc?.name || 'Conservatory Profile';
  const description =
    doc?.about ||
    'Find full conservatory details, teachers, contact information and registration options on Harmonia.';
  const canonical = `${siteUrl}/${locale}/about/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        he: `${siteUrl}/he/about/${slug}`,
        en: `${siteUrl}/en/about/${slug}`,
        ar: `${siteUrl}/ar/about/${slug}`,
        ru: `${siteUrl}/ru/about/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      locale,
      images: doc?.photos?.[0] ? [doc.photos[0]] : undefined,
    },
  };
}

export default async function ConservatoriumPublicProfileRoute({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const conservatoriumId = extractConservatoriumIdFromSlug(slug);

  return <ConservatoriumPublicProfilePage conservatoriumId={conservatoriumId} slug={slug} />;
}
