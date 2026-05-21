import { stableKey } from './stable-key'

describe('stableKey', () => {
  it('returns the same key for the same input', () => {
    const a = stableKey(['critical', 'Hardcoded API key', 'config.go', 12], 0)
    const b = stableKey(['critical', 'Hardcoded API key', 'config.go', 12], 5)
    expect(a).toBe(b)
  })

  it('returns different keys for different content', () => {
    const a = stableKey(['critical', 'Hardcoded API key'], 0)
    const b = stableKey(['warning', 'Missing comment'], 0)
    expect(a).not.toBe(b)
  })

  it('falls back to row-idx when nothing identifying is present', () => {
    expect(stableKey([], 3)).toBe('row-3')
    expect(stableKey(['', null, undefined], 7)).toBe('row-7')
  })

  it('ignores empty strings (the original `??` bug)', () => {
    // Empty id should not cause an empty key — should hash the rest.
    const a = stableKey(['', 'critical', 'Title', 'file.go', 10], 0)
    const b = stableKey(['critical', 'Title', 'file.go', 10], 0)
    expect(a).toBe(b)
    expect(a).not.toBe('')
  })

  it('produces base36 strings (no length explosion)', () => {
    const k = stableKey(['some-id', 'title', 'file.go', 99], 0)
    expect(k).toMatch(/^[0-9a-z]+$/)
    expect(k.length).toBeLessThan(15)
  })
})
