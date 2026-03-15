'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { ThemeId } from '@/lib/themes/active-theme'

interface BrandThemeContextValue {
  theme: ThemeId
  isThemeB: boolean
}

const BrandThemeContext = createContext<BrandThemeContextValue>({
  theme: 'a',
  isThemeB: false,
})

export function BrandThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>('a')

  useEffect(() => {
    const dt = document.documentElement.dataset.theme
    if (dt === 'b') setTheme('b')
  }, [])

  return (
    <BrandThemeContext.Provider value={{ theme, isThemeB: theme === 'b' }}>
      {children}
    </BrandThemeContext.Provider>
  )
}

export function useBrandTheme(): BrandThemeContextValue {
  return useContext(BrandThemeContext)
}
