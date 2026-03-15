export type BrandId = 'a' | 'b'

export function getActiveBrand(): BrandId {
  const raw = process.env.NEXT_PUBLIC_LANDING_THEME
  if (raw?.toLowerCase() === 'b') return 'b'
  return 'a'
}
