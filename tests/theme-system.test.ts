import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = join(__dirname, '..')
const css = readFileSync(join(ROOT, 'src/app/globals.css'), 'utf-8')
const landingPage = readFileSync(
  join(ROOT, 'src/components/harmonia/public-landing-page.tsx'),
  'utf-8'
)
const layout = readFileSync(join(ROOT, 'src/app/[locale]/layout.tsx'), 'utf-8')
const dashboardLayout = readFileSync(
  join(ROOT, 'src/app/[locale]/dashboard/layout.tsx'),
  'utf-8'
)

describe('Theme V2 CSS architecture', () => {
  it('uses data-brand selectors, not data-theme', () => {
    expect(css).toContain('[data-brand="b"]')
    expect(css).not.toContain('[data-theme="b"]')
  })

  it('has light-mode cream background for Theme B', () => {
    // Use [\s\S]*? (lazy) to correctly capture just the first [data-brand="b"] block
    const themeBLight = css.match(/\[data-brand="b"\]\s*\{([\s\S]*?)\}/)?.[1] ?? ''
    expect(themeBLight).toContain('40 43% 96%')
  })

  it('has data-color-mode="dark" selector for Theme A dark', () => {
    expect(css).toContain('[data-color-mode="dark"]')
  })

  it('has system preference media query for Theme A', () => {
    expect(css).toMatch(/@media.*prefers-color-scheme.*dark/)
    expect(css).toMatch(/:root:not\(\[data-color-mode="light"\]\)/)
    expect(css).toMatch(/:root:not\(\[data-brand="b"\]\)/)
  })

  it('has system preference media query for Theme B dark', () => {
    expect(css).toMatch(/\[data-brand="b"\]:not\(\[data-color-mode="light"\]\)/)
  })

  it('does not use standalone .dark class for color mode', () => {
    expect(css).not.toMatch(/^\.dark\s*\{/m)
  })
})

describe('Theme V2 HTML attributes', () => {
  it('layout uses data-brand attribute', () => {
    expect(layout).toContain('data-brand=')
    expect(layout).not.toContain('data-theme=')
  })

  it('dashboard layout hardcodes data-brand="a"', () => {
    expect(dashboardLayout).toContain('data-brand="a"')
    expect(dashboardLayout).not.toContain('data-theme=')
  })

  it('layout imports getActiveBrand', () => {
    expect(layout).toContain('getActiveBrand')
    expect(layout).not.toContain('getActiveTheme')
  })
})

describe('Theme B hero', () => {
  it('showHeroImage is true for Theme B', () => {
    const heroStylesB = landingPage.match(/b:\s*\{[\s\S]*?showHeroImage:\s*(true|false)/)?.[1]
    expect(heroStylesB).toBe('true')
  })

  it('showCinematicOverlays is false for Theme B', () => {
    const match = landingPage.match(
      /b:\s*\{[\s\S]*?showCinematicOverlays:\s*(true|false)/
    )?.[1]
    expect(match).toBe('false')
  })
})
