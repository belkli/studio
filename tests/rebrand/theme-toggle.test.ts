import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/headers so getActiveBrand() can be tested outside a request context
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { getActiveBrand } from '@/lib/themes/active-theme'
import { BRAND_THEME_COOKIE_NAME } from '@/lib/brand'

function mockCookies(value: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === BRAND_THEME_COOKIE_NAME && value ? { value } : undefined),
  } as Awaited<ReturnType<typeof cookies>>)
}

describe('getActiveBrand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns indigo when no brand cookie is set', async () => {
    mockCookies(undefined)
    expect(await getActiveBrand()).toBe('indigo')
  })

  it('return type is a valid BrandId', async () => {
    mockCookies(undefined)
    const result = await getActiveBrand()
    expect(['indigo', 'gold']).toContain(result)
  })
})
