import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test that getActiveBrand() reads the cookie value correctly.
// Mock next/headers to control cookie values.
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { getActiveBrand } from '@/lib/themes/active-theme'

function mockCookies(value: string | undefined) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === 'lyriosa-brand' && value ? { value } : undefined),
  } as Awaited<ReturnType<typeof cookies>>)
}

describe('getActiveBrand', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns indigo when cookie is absent', async () => {
    mockCookies(undefined)
    expect(await getActiveBrand()).toBe('indigo')
  })

  it('returns gold when cookie is gold', async () => {
    mockCookies('gold')
    expect(await getActiveBrand()).toBe('gold')
  })

  it('returns indigo for an unrecognised cookie value', async () => {
    mockCookies('purple')
    expect(await getActiveBrand()).toBe('indigo')
  })

  it('returns indigo when cookies() throws (static generation context)', async () => {
    vi.mocked(cookies).mockRejectedValue(new Error('cookies not available'))
    expect(await getActiveBrand()).toBe('indigo')
  })
})
