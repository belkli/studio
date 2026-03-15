/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

describe('BrandThemeProvider', () => {
  it('provides brand "a" when prop is "a"', async () => {
    const { BrandThemeProvider, useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { brand, isThemeB } = useBrandTheme()
      return (
        <div>
          <span data-testid="brand">{brand}</span>
          <span data-testid="isThemeB">{String(isThemeB)}</span>
        </div>
      )
    }

    render(
      <BrandThemeProvider brand="a">
        <TestConsumer />
      </BrandThemeProvider>
    )

    expect(screen.getByTestId('brand').textContent).toBe('a')
    expect(screen.getByTestId('isThemeB').textContent).toBe('false')
  })

  it('provides brand "b" when prop is "b"', async () => {
    const { BrandThemeProvider, useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { brand, isThemeB } = useBrandTheme()
      return (
        <div>
          <span data-testid="brand">{brand}</span>
          <span data-testid="isThemeB">{String(isThemeB)}</span>
        </div>
      )
    }

    render(
      <BrandThemeProvider brand="b">
        <TestConsumer />
      </BrandThemeProvider>
    )

    expect(screen.getByTestId('brand').textContent).toBe('b')
    expect(screen.getByTestId('isThemeB').textContent).toBe('true')
  })

  it('useBrandTheme returns default values outside provider', async () => {
    const { useBrandTheme } = await import(
      '@/components/brand-theme-provider'
    )

    function TestConsumer() {
      const { brand, isThemeB } = useBrandTheme()
      return (
        <div>
          <span data-testid="brand">{brand}</span>
          <span data-testid="isThemeB">{String(isThemeB)}</span>
        </div>
      )
    }

    render(<TestConsumer />)

    expect(screen.getByTestId('brand').textContent).toBe('a')
    expect(screen.getByTestId('isThemeB').textContent).toBe('false')
  })
})
