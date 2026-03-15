/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// We'll test the BrandThemeProvider and useBrandTheme hook
describe('BrandThemeProvider', () => {
  beforeEach(() => {
    // Reset data-theme attribute
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to theme "a" when no data-theme is set on html', async () => {
    const { BrandThemeProvider, useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { theme, isThemeB } = useBrandTheme()
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="isThemeB">{String(isThemeB)}</span>
        </div>
      )
    }

    render(
      <BrandThemeProvider>
        <TestConsumer />
      </BrandThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('a')
    expect(screen.getByTestId('isThemeB').textContent).toBe('false')
  })

  it('reads theme "b" from data-theme attribute', async () => {
    document.documentElement.dataset.theme = 'b'

    const { BrandThemeProvider, useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { theme, isThemeB } = useBrandTheme()
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="isThemeB">{String(isThemeB)}</span>
        </div>
      )
    }

    render(
      <BrandThemeProvider>
        <TestConsumer />
      </BrandThemeProvider>
    )

    // After useEffect runs, theme should be 'b'
    // Wait for effect
    await new Promise((r) => setTimeout(r, 50))

    expect(screen.getByTestId('theme').textContent).toBe('b')
    expect(screen.getByTestId('isThemeB').textContent).toBe('true')
  })

  it('useBrandTheme returns default values outside provider', async () => {
    const { useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { theme, isThemeB } = useBrandTheme()
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <span data-testid="isThemeB">{String(isThemeB)}</span>
        </div>
      )
    }

    render(<TestConsumer />)

    // Should return defaults from context
    expect(screen.getByTestId('theme').textContent).toBe('a')
    expect(screen.getByTestId('isThemeB').textContent).toBe('false')
  })
})
