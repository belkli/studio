/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

describe('BrandThemeProvider', () => {
  it('provides brand "indigo" when prop is "indigo"', async () => {
    const { BrandThemeProvider, useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { brand } = useBrandTheme()
      return (
        <div>
          <span data-testid="brand">{brand}</span>
        </div>
      )
    }

    render(
      <BrandThemeProvider brand="indigo">
        <TestConsumer />
      </BrandThemeProvider>
    )

    expect(screen.getByTestId('brand').textContent).toBe('indigo')
  })

  it('provides brand "gold" when prop is "gold"', async () => {
    const { BrandThemeProvider, useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { brand } = useBrandTheme()
      return (
        <div>
          <span data-testid="brand">{brand}</span>
        </div>
      )
    }

    render(
      <BrandThemeProvider brand="gold">
        <TestConsumer />
      </BrandThemeProvider>
    )

    expect(screen.getByTestId('brand').textContent).toBe('gold')
  })

  it('useBrandTheme returns default brand "indigo" outside provider', async () => {
    const { useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { brand } = useBrandTheme()
      return (
        <div>
          <span data-testid="brand">{brand}</span>
        </div>
      )
    }

    render(<TestConsumer />)

    expect(screen.getByTestId('brand').textContent).toBe('indigo')
  })
})
