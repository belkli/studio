// tests/hooks/use-color-mode.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useColorMode } from '@/hooks/use-color-mode'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
})

beforeEach(() => {
  localStorageMock.clear()
  document.documentElement.removeAttribute('data-color-mode')
})

describe('useColorMode', () => {
  it('returns system as default when no localStorage value', () => {
    const { result } = renderHook(() => useColorMode())
    expect(result.current.preference).toBe('system')
  })

  it('setMode("dark") writes localStorage and sets data-color-mode', () => {
    const { result } = renderHook(() => useColorMode())
    act(() => result.current.setMode('dark'))
    expect(localStorageMock.getItem('lyriosa-color-mode')).toBe('dark')
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('dark')
  })

  it('setMode("light") writes localStorage and sets data-color-mode', () => {
    const { result } = renderHook(() => useColorMode())
    act(() => result.current.setMode('light'))
    expect(localStorageMock.getItem('lyriosa-color-mode')).toBe('light')
    expect(document.documentElement.getAttribute('data-color-mode')).toBe('light')
  })

  it('setMode("system") removes localStorage and removes data-color-mode', () => {
    localStorageMock.setItem('lyriosa-color-mode', 'dark')
    document.documentElement.setAttribute('data-color-mode', 'dark')
    const { result } = renderHook(() => useColorMode())
    act(() => result.current.setMode('system'))
    expect(localStorageMock.getItem('lyriosa-color-mode')).toBeNull()
    expect(document.documentElement.hasAttribute('data-color-mode')).toBe(false)
  })

  it('isDark is true when mode is dark', () => {
    const { result } = renderHook(() => useColorMode())
    act(() => result.current.setMode('dark'))
    expect(result.current.isDark).toBe(true)
  })
})
