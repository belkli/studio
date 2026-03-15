'use client'
import { createContext, useContext, type ReactNode } from 'react'
import type { BrandId } from '@/lib/themes/active-theme'

interface BrandThemeContextValue {
  brand: BrandId
}

const BrandThemeContext = createContext<BrandThemeContextValue>({
  brand: 'indigo',
})

export function BrandThemeProvider({ brand, children }: { brand: BrandId; children: ReactNode }) {
  return (
    <BrandThemeContext.Provider value={{ brand }}>
      {children}
    </BrandThemeContext.Provider>
  )
}

export function useBrandTheme(): BrandThemeContextValue {
  return useContext(BrandThemeContext)
}
