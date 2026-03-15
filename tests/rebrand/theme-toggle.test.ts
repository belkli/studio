import { describe, it, expect, afterEach } from 'vitest'
import { getActiveTheme } from '@/lib/themes/active-theme'

describe('getActiveTheme', () => {
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
    expect(getActiveTheme()).toBe('a')
  })

  it('returns "a" when env var is "a"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'a'
    expect(getActiveTheme()).toBe('a')
  })

  it('returns "b" when env var is "b"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'b'
    expect(getActiveTheme()).toBe('b')
  })

  it('returns "b" for uppercase "B"', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'B'
    expect(getActiveTheme()).toBe('b')
  })

  it('returns "a" for invalid values', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = 'invalid'
    expect(getActiveTheme()).toBe('a')
  })

  it('returns "a" for empty string', () => {
    process.env.NEXT_PUBLIC_LANDING_THEME = ''
    expect(getActiveTheme()).toBe('a')
  })
})
