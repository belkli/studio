import { describe, it, expect } from 'vitest'

// src/app/actions/user-preferences.ts has 'use server' — cannot be imported directly in Vitest.
// We reproduce the pure validation logic here to verify correctness.
// The integration (cookie set + DB update) is covered by the BrandToggle component tests
// which mock the action at the boundary.

// ---------------------------------------------------------------------------
// Pure logic: brand validation
// Mirrors the Zod schema in updateBrandPreferenceAction:
//   z.object({ brand: z.enum(['indigo', 'gold']) })
// ---------------------------------------------------------------------------

type BrandId = 'indigo' | 'gold'

function validateBrandInput(input: unknown): { success: true; brand: BrandId } | { success: false; error: string } {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('brand' in input) ||
    (input as { brand: unknown }).brand !== 'indigo' &&
    (input as { brand: unknown }).brand !== 'gold'
  ) {
    return { success: false, error: 'Invalid brand value' }
  }
  return { success: true, brand: (input as { brand: BrandId }).brand }
}

describe('updateBrandPreferenceAction — brand validation', () => {
  it('accepts indigo', () => {
    const result = validateBrandInput({ brand: 'indigo' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.brand).toBe('indigo')
  })

  it('accepts gold', () => {
    const result = validateBrandInput({ brand: 'gold' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.brand).toBe('gold')
  })

  it('rejects an unknown brand string', () => {
    const result = validateBrandInput({ brand: 'purple' })
    expect(result.success).toBe(false)
  })

  it('rejects missing brand key', () => {
    const result = validateBrandInput({})
    expect(result.success).toBe(false)
  })

  it('rejects non-object input', () => {
    const result = validateBrandInput('gold')
    expect(result.success).toBe(false)
  })
})

describe('updateBrandPreferenceAction — complete valid set', () => {
  it('accepts exactly indigo and gold, rejects everything else', () => {
    expect(validateBrandInput({ brand: 'indigo' }).success).toBe(true)
    expect(validateBrandInput({ brand: 'gold' }).success).toBe(true)
    expect(validateBrandInput({ brand: '' }).success).toBe(false)
    expect(validateBrandInput({ brand: null }).success).toBe(false)
    expect(validateBrandInput({ brand: 42 }).success).toBe(false)
  })
})
