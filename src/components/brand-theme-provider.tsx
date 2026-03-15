'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { ThemeId } from '@/lib/themes/active-theme'

interface BrandThemeContextValue {
  theme: ThemeId
  isThemeB: boolean
}

const BrandThemeContext = createContext<BrandThemeContextValue>({
  theme: 'a',
  isThemeB: false,
})

export function BrandThemeProvider({ theme, children }: { theme: ThemeId; children: ReactNode }) {
  return (
    <BrandThemeContext.Provider value={{ theme, isThemeB: theme === 'b' }}>
      {children}
    </BrandThemeContext.Provider>
  )
}

export function useBrandTheme(): BrandThemeContextValue {
  return useContext(BrandThemeContext)
}
