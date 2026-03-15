export type ThemeId = 'a' | 'b'

export function getActiveTheme(): ThemeId {
  const raw = process.env.NEXT_PUBLIC_LANDING_THEME
  if (raw?.toLowerCase() === 'b') return 'b'
  return 'a'
}
