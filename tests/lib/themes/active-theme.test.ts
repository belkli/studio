import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('getActiveTheme', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns "a" by default when env is not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_LANDING_THEME', '')
    const { getActiveTheme } = await import('@/lib/themes/active-theme')
    expect(getActiveTheme()).toBe('a')
  })

  it('returns "b" when NEXT_PUBLIC_LANDING_THEME is "b"', async () => {
    vi.stubEnv('NEXT_PUBLIC_LANDING_THEME', 'b')
    // Need fresh import to pick up env change
    vi.resetModules()
    const { getActiveTheme } = await import('@/lib/themes/active-theme')
    expect(getActiveTheme()).toBe('b')
  })

  it('returns "b" when NEXT_PUBLIC_LANDING_THEME is "B" (case-insensitive)', async () => {
    vi.stubEnv('NEXT_PUBLIC_LANDING_THEME', 'B')
    vi.resetModules()
    const { getActiveTheme } = await import('@/lib/themes/active-theme')
    expect(getActiveTheme()).toBe('b')
  })

  it('returns "a" for any other value', async () => {
    vi.stubEnv('NEXT_PUBLIC_LANDING_THEME', 'x')
    vi.resetModules()
    const { getActiveTheme } = await import('@/lib/themes/active-theme')
    expect(getActiveTheme()).toBe('a')
  })
})

describe('ThemeId type', () => {
  it('getActiveTheme return type is ThemeId', async () => {
    const { getActiveTheme } = await import('@/lib/themes/active-theme')
    const result = getActiveTheme()
    expect(['a', 'b']).toContain(result)
  })
})
