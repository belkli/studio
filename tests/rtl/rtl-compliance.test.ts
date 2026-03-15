/**
 * RTL Compliance Scanner
 *
 * Scans all TSX component files for common RTL violations.
 * Run: npx vitest run tests/rtl/rtl-compliance.test.ts
 *
 * Rules enforced:
 * 1. No text-left/text-right (use text-start/text-end)
 * 2. No ml-/mr-/pl-/pr- (use ms-/me-/ps-/pe-)
 * 3. Native date/time/number inputs must have dir="ltr"
 * 4. <Tabs> must have dir= prop
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const SRC_DIR = join(process.cwd(), 'src', 'components')

// Directories to skip (shared UI primitives that don't need RTL per-component)
const SKIP_DIRS = ['ui']

function collectTsxFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.includes(entry) && !entry.startsWith('.')) {
        files.push(...collectTsxFiles(fullPath))
      }
    } else if (entry.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }
  return files
}

const tsxFiles = collectTsxFiles(SRC_DIR)

describe('RTL Compliance', () => {
  describe('No hardcoded physical CSS classes', () => {
    // Pattern: text-left or text-right (should be text-start/text-end)
    // Exceptions: text-left/text-right inside comments, or in className strings that also contain "start"/"end"
    const PHYSICAL_TEXT_PATTERN = /\b(text-left|text-right)\b/
    // Exceptions: lines that are comments
    const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/

    for (const file of tsxFiles) {
      const relPath = relative(process.cwd(), file)

      it(`${relPath} should not use text-left/text-right`, () => {
        const content = readFileSync(file, 'utf8')
        const lines = content.split('\n')
        const violations: string[] = []

        lines.forEach((line, i) => {
          if (!COMMENT_LINE.test(line) && PHYSICAL_TEXT_PATTERN.test(line)) {
            violations.push(`  Line ${i + 1}: ${line.trim()}`)
          }
        })

        expect(
          violations,
          `Found text-left/text-right (use text-start/text-end instead):\n${violations.join('\n')}`
        ).toHaveLength(0)
      })
    }
  })

  describe('No hardcoded physical margin/padding', () => {
    // Pattern: ml-N, mr-N, pl-N, pr-N (should be ms-/me-/ps-/pe-)
    // Be careful not to match class names like "ml-auto" → actually "ms-auto" is the fix
    const PHYSICAL_SPACING = /\b(ml-|mr-|pl-|pr-)\d/
    const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/

    for (const file of tsxFiles) {
      const relPath = relative(process.cwd(), file)

      it(`${relPath} should not use ml-/mr-/pl-/pr- (use ms-/me-/ps-/pe-)`, () => {
        const content = readFileSync(file, 'utf8')
        const lines = content.split('\n')
        const violations: string[] = []

        lines.forEach((line, i) => {
          if (!COMMENT_LINE.test(line) && PHYSICAL_SPACING.test(line)) {
            violations.push(`  Line ${i + 1}: ${line.trim()}`)
          }
        })

        expect(
          violations,
          `Found physical spacing classes (use logical ms-/me-/ps-/pe- instead):\n${violations.join('\n')}`
        ).toHaveLength(0)
      })
    }
  })

  describe('Native inputs must have dir="ltr"', () => {
    // Native date, time, month, number inputs need dir="ltr" for correct rendering in RTL
    const NATIVE_INPUT = /type=["'](date|time|month)["']/
    const HAS_DIR_LTR = /dir=["']ltr["']/
    const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/

    for (const file of tsxFiles) {
      const relPath = relative(process.cwd(), file)

      it(`${relPath} native date/time/month inputs should have dir="ltr"`, () => {
        const content = readFileSync(file, 'utf8')
        const lines = content.split('\n')
        const violations: string[] = []

        lines.forEach((line, i) => {
          if (!COMMENT_LINE.test(line) && NATIVE_INPUT.test(line) && !HAS_DIR_LTR.test(line)) {
            violations.push(`  Line ${i + 1}: ${line.trim()}`)
          }
        })

        expect(
          violations,
          `Native date/time/month inputs missing dir="ltr":\n${violations.join('\n')}`
        ).toHaveLength(0)
      })
    }
  })

  describe('Tabs components must have dir prop', () => {
    // <Tabs must have dir= attribute for RTL support
    const TABS_OPEN = /<Tabs\s/
    const HAS_DIR = /\bdir[=\s{]/
    const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/

    for (const file of tsxFiles) {
      const relPath = relative(process.cwd(), file)
      const content = readFileSync(file, 'utf8')

      // Only test files that actually use Tabs
      if (!TABS_OPEN.test(content)) continue

      it(`${relPath} <Tabs> should have dir prop`, () => {
        const lines = content.split('\n')
        const violations: string[] = []

        lines.forEach((line, i) => {
          if (!COMMENT_LINE.test(line) && TABS_OPEN.test(line) && !HAS_DIR.test(line)) {
            violations.push(`  Line ${i + 1}: ${line.trim()}`)
          }
        })

        expect(
          violations,
          `<Tabs> missing dir prop (add dir={isRtl ? 'rtl' : 'ltr'}):\n${violations.join('\n')}`
        ).toHaveLength(0)
      })
    }
  })
})
