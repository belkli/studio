export function buildConservatoriumSlug(input: { id: string; name: string; nameEn?: string }) {
  const baseSource = (input.nameEn || input.name || 'conservatory').toLowerCase();
  const base = baseSource
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'conservatory';

  return `${base}__${input.id}`;
}

export function extractConservatoriumIdFromSlug(slug: string) {
  const markerIndex = slug.lastIndexOf('__');
  if (markerIndex === -1) return null;
  const id = slug.slice(markerIndex + 2).trim();
  return id || null;
}
