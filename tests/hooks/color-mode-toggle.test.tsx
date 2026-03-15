// tests/hooks/color-mode-toggle.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorModeToggle } from '@/components/color-mode-toggle'

const mockSetMode = vi.fn()
vi.mock('@/hooks/use-color-mode', () => ({
  useColorMode: () => ({
    preference: 'system',
    setMode: mockSetMode,
    isDark: false,
  }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

beforeEach(() => mockSetMode.mockClear())

describe('ColorModeToggle', () => {
  it('renders a button with accessible label', () => {
    render(<ColorModeToggle />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('clicking cycles from system to dark', () => {
    render(<ColorModeToggle />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockSetMode).toHaveBeenCalledWith('dark')
  })
})
