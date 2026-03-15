// src/hooks/use-color-mode.ts
'use client'

import { useState, useEffect, useLayoutEffect, useCallback } from 'react'

export type ColorModePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'lyriosa-color-mode'

function applyColorMode(preference: ColorModePreference) {
  const html = document.documentElement
  if (preference === 'dark') {
    html.setAttribute('data-color-mode', 'dark')
  } else if (preference === 'light') {
    html.setAttribute('data-color-mode', 'light')
  } else {
    html.removeAttribute('data-color-mode')
  }
}

function readStoredPreference(): ColorModePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // private browsing
  }
  return 'system'
}

export function useColorMode() {
  const [preference, setPreference] = useState<ColorModePreference>('system')
  const [systemDark, setSystemDark] = useState<boolean>(false)

  // Hydrate from localStorage on mount (lazy initializer doesn't re-run on client after SSR).
  // useLayoutEffect runs synchronously before paint on the client and is skipped on the server.
  useLayoutEffect(() => {
    const stored = readStoredPreference()
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreference(stored)
    setSystemDark(dark)
    // Only apply explicit preferences — don't touch the attribute when system,
    // as the blocking script already set it correctly from OS preference.
    if (stored !== 'system') applyColorMode(stored)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      setSystemDark(mq.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const next = (e.newValue as ColorModePreference | null) ?? 'system'
        const safe = next === 'light' || next === 'dark' ? next : 'system'
        applyColorMode(safe)
        setPreference(safe)
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const setMode = useCallback((next: ColorModePreference) => {
    try {
      if (next === 'system') {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, next)
      }
    } catch {
      // private browsing
    }
    applyColorMode(next)
    setPreference(next)
  }, [])

  const isDark =
    preference === 'dark' ||
    (preference === 'system' && systemDark)

  return { preference, setMode, isDark }
}
