import { describe, it, expect } from 'vitest'

describe('getActiveBrand', () => {
  it('returns "indigo" by default', async () => {
    const { getActiveBrand } = await import('@/lib/themes/active-theme')
    expect(getActiveBrand()).toBe('indigo')
  })

  it('return type is a valid BrandId ("indigo" or "gold")', async () => {
    const { getActiveBrand } = await import('@/lib/themes/active-theme')
    const result = getActiveBrand()
    expect(['indigo', 'gold']).toContain(result)
  })
})

describe('BrandId type', () => {
  it('getActiveBrand return type is BrandId', async () => {
    const { getActiveBrand } = await import('@/lib/themes/active-theme')
    const result = getActiveBrand()
    expect(['indigo', 'gold']).toContain(result)
  })
})
