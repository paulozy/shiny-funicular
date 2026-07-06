import { parseUnifiedDiff, diffNewLines } from './diff'

const PATCH = [
  '@@ -1,3 +1,4 @@',
  ' context line',
  '-removed line',
  '+added line one',
  '+added line two',
  ' trailing context',
].join('\n')

describe('parseUnifiedDiff', () => {
  it('returns empty for missing patch', () => {
    expect(parseUnifiedDiff(undefined)).toEqual([])
    expect(parseUnifiedDiff('')).toEqual([])
  })

  it('parses hunks and assigns old/new line numbers', () => {
    const hunks = parseUnifiedDiff(PATCH)
    expect(hunks).toHaveLength(1)
    const lines = hunks[0].lines

    // context line: old 1 / new 1
    expect(lines[0]).toMatchObject({ type: 'context', oldLine: 1, newLine: 1 })
    // removed: old 2, no new
    expect(lines[1]).toMatchObject({ type: 'del', oldLine: 2 })
    expect(lines[1].newLine).toBeUndefined()
    // added lines: new 2 and 3, no old
    expect(lines[2]).toMatchObject({ type: 'add', newLine: 2, content: 'added line one' })
    expect(lines[3]).toMatchObject({ type: 'add', newLine: 3, content: 'added line two' })
    // trailing context: old advanced past the delete (3), new 4
    expect(lines[4]).toMatchObject({ type: 'context', oldLine: 3, newLine: 4 })
  })

  it('ignores the "no newline at eof" marker', () => {
    const hunks = parseUnifiedDiff('@@ -1 +1 @@\n+x\n\\ No newline at end of file')
    expect(hunks[0].lines).toHaveLength(1)
    expect(hunks[0].lines[0]).toMatchObject({ type: 'add', content: 'x' })
  })

  it('diffNewLines collects added and context new line numbers only', () => {
    const lines = diffNewLines(PATCH)
    expect([...lines].sort((a, b) => a - b)).toEqual([1, 2, 3, 4])
  })
})
