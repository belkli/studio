import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('getActiveBrand', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns "a" by default when env is not set', async () => {
    vi.stubEnv('NEXT_PUBLIC_LANDING_THEME', '')
    const { getActiveBrand } = await import('@/lib/themes/active-theme')
    expect(getActiveBrand()).toBe('a')
  })

  it('returns "b" when NEXT_PUBLIC_LANDING_THEME is "b"', async () => {
    vi.stubEnv('NEXT_PUBLIC_LANDING_THEME', 'b')
    // Need fresh import to pick up env change
    vi.resetModules()
    const { getActiveBrand } = await import('@/lib/themes/active-theme')
    expect(getActiveBrand()).toBe('b')
  })

  it('returns "b" when NEXT_PUBLIC_LANDING_THEME is "B" (case-insensitive)', async () => {
    vi.stubEnv('NEXT_PUBLIC_LANDING_THEME', 'B')
    vi.resetModules()
    const { getActiveBrand } = await import('@/lib/themes/active-theme')
    expect(getActiveBrand()).toBe('b')
  })

  it('returns "a" for any other value', async () => {
    vi.stubEnv('NEXT_PUBLIC_LANDING_THEME', 'x')
    vi.resetModules()
    const { getActiveBrand } = await import('@/lib/themes/active-theme')
    expect(getActiveBrand()).toBe('a')
  })
})

describe('BrandId type', () => {
  it('getActiveBrand return type is BrandId', async () => {
    const { getActiveBrand } = await import('@/lib/themes/active-theme')
    const result = getActiveBrand()
    expect(['a', 'b']).toContain(result)
  })
})
