import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrandToggle } from '@/components/brand-toggle'

const mockRefresh = vi.fn()
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

vi.mock('@/app/actions/user-preferences', () => ({
  updateBrandPreferenceAction: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const brandRef = { value: 'indigo' as 'indigo' | 'gold' }
vi.mock('@/components/brand-theme-provider', () => ({
  useBrandTheme: () => ({ brand: brandRef.value }),
}))

import { updateBrandPreferenceAction } from '@/app/actions/user-preferences'

beforeEach(() => {
  vi.clearAllMocks()
  brandRef.value = 'indigo'
})

describe('BrandToggle', () => {
  it('renders a button with accessible label', () => {
    render(<BrandToggle />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('aria-label reflects current brand (indigo → switching to gold)', () => {
    render(<BrandToggle />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-label')).toBe('brandIndigoLabel')
  })

  it('clicking with indigo brand calls action with gold', async () => {
    render(<BrandToggle />)
    fireEvent.click(screen.getByRole('button'))
    await vi.waitFor(() => {
      expect(updateBrandPreferenceAction).toHaveBeenCalledWith({ brand: 'gold' })
    })
  })

  it('clicking with gold brand calls action with indigo', async () => {
    brandRef.value = 'gold'
    render(<BrandToggle />)
    fireEvent.click(screen.getByRole('button'))
    await vi.waitFor(() => {
      expect(updateBrandPreferenceAction).toHaveBeenCalledWith({ brand: 'indigo' })
    })
  })
})
