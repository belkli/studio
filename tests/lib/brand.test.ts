import { describe, it, expect } from 'vitest'

describe('brand constants', () => {
  it('exports BRAND_NAME as Lyriosa', async () => {
    const { BRAND_NAME } = await import('@/lib/brand')
    expect(BRAND_NAME).toBe('Lyriosa')
  })

  it('exports Hebrew brand name', async () => {
    const { BRAND_NAME_HE } = await import('@/lib/brand')
    expect(BRAND_NAME_HE).toBe('ליריוסה')
  })

  it('exports Arabic brand name', async () => {
    const { BRAND_NAME_AR } = await import('@/lib/brand')
    expect(BRAND_NAME_AR).toBe('ليريوسا')
  })

  it('exports Russian brand name', async () => {
    const { BRAND_NAME_RU } = await import('@/lib/brand')
    expect(BRAND_NAME_RU).toBe('Лириоса')
  })

  it('exports support email', async () => {
    const { BRAND_SUPPORT_EMAIL } = await import('@/lib/brand')
    expect(BRAND_SUPPORT_EMAIL).toBe('support@lyriosa.co.il')
  })

  it('exports privacy email', async () => {
    const { BRAND_PRIVACY_EMAIL } = await import('@/lib/brand')
    expect(BRAND_PRIVACY_EMAIL).toBe('privacy@lyriosa.co.il')
  })

  it('exports accessibility email', async () => {
    const { BRAND_A11Y_EMAIL } = await import('@/lib/brand')
    expect(BRAND_A11Y_EMAIL).toBe('accessibility@lyriosa.co.il')
  })

  it('exports dev email', async () => {
    const { BRAND_DEV_EMAIL } = await import('@/lib/brand')
    expect(BRAND_DEV_EMAIL).toBe('dev@lyriosa.local')
  })

  it('exports cookie name', async () => {
    const { BRAND_COOKIE_NAME } = await import('@/lib/brand')
    expect(BRAND_COOKIE_NAME).toBe('lyriosa-user')
  })

  it('exports localStorage key', async () => {
    const { BRAND_LOCALSTORAGE_KEY } = await import('@/lib/brand')
    expect(BRAND_LOCALSTORAGE_KEY).toBe('lyriosa-user')
  })

  it('exports AI assistant name', async () => {
    const { AI_ASSISTANT_NAME } = await import('@/lib/brand')
    expect(AI_ASSISTANT_NAME).toBe('Lyria')
  })

  it('exports BRAND_DOMAIN defaulting to lyriosa.co.il', async () => {
    const { BRAND_DOMAIN } = await import('@/lib/brand')
    // Without NEXT_PUBLIC_SITE_URL env, falls back to default
    expect(BRAND_DOMAIN).toContain('lyriosa.co.il')
  })
})
