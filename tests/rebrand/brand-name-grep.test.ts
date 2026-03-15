import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const OLD_BRAND_PATTERNS = [
  'Harmonia',
  'Harmony',  // AI assistant old name — may also appear as music theory term, review manually
  'הרמוניה',
  'הַרמוֹנְיָה',
  'هارمونيا',
  'Гармония',
]

const MESSAGES_DIR = join(process.cwd(), 'src', 'messages')

describe('Brand name residuals', () => {
  const locales = readdirSync(MESSAGES_DIR).filter(f => !f.startsWith('.'))

  for (const locale of locales) {
    const localeDir = join(MESSAGES_DIR, locale)
    const files = readdirSync(localeDir).filter(f => f.endsWith('.json'))

    for (const file of files) {
      it(`${locale}/${file} should not contain old brand names`, () => {
        const content = readFileSync(join(localeDir, file), 'utf8')
        const found: string[] = []
        for (const pattern of OLD_BRAND_PATTERNS) {
          if (content.includes(pattern)) {
            found.push(pattern)
          }
        }
        expect(found, `Found old brand patterns: ${found.join(', ')}`).toEqual([])
      })
    }
  }
})
