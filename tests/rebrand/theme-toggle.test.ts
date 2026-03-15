import { describe, it, expect, afterEach } from 'vitest'
import { getActiveBrand } from '@/lib/themes/active-theme'

describe('getActiveBrand', () => {
  const originalEnv = process.env.NEXT_PUBLIC_LANDING_THEME

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_LANDING_THEME = originalEnv
    } else {
      delete process.env.NEXT_PUBLIC_LANDING_THEME
    }
  })

  it('returns "a" when env var is not set', () => {
    delete process.env.NEXT_PUBLIC_LANDING_THEME
    expect(getActiveBrand()).toBe('a')
  })

  it('returns "a" when env var is "a"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'a'
    expect(getActiveBrand()).toBe('a')
  })

  it('returns "b" when env var is "b"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'b'
    expect(getActiveBrand()).toBe('b')
  })

  it('returns "b" for uppercase "B"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'B'
    expect(getActiveBrand()).toBe('b')
  })

  it('returns "a" for invalid values', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'invalid'
    expect(getActiveBrand()).toBe('a')
  })

  it('returns "a" for empty string', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = ''
    expect(getActiveBrand()).toBe('a')
  })
})
