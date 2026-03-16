import { cookies } from 'next/headers'
import { BRAND_THEME_COOKIE_NAME } from '@/lib/brand'

export type BrandId = 'indigo' | 'gold'

export async function getActiveBrand(): Promise<BrandId> {
  try {
    const cookieStore = await cookies()
    const value = cookieStore.get(BRAND_THEME_COOKIE_NAME)?.value
    if (value === 'gold' || value === 'indigo') return value
  } catch {
    // cookies() throws outside a request context (static generation)
  }
  return 'indigo'
}
