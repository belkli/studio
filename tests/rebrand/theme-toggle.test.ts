import { describe, it, expect } from 'vitest'
import { getActiveBrand } from '@/lib/themes/active-theme'

describe('getActiveBrand', () => {
  it('always returns "indigo" (env var removed)', () => {
    expect(getActiveBrand()).toBe('indigo')
  })

  it('return type is a valid BrandId', () => {
    const result = getActiveBrand()
    expect(['indigo', 'gold']).toContain(result)
  })
})
