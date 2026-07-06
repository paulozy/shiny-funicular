// Minimal unified-diff parser for rendering GitHub PR patches in the IDP.
// GitHub returns each file's `patch` as a unified diff; we parse it into hunks
// of typed lines carrying old/new line numbers so findings can be anchored to
// the post-image (new) line.

export type DiffLineType = 'add' | 'del' | 'context'

export interface DiffLine {
  type: DiffLineType
  content: string
  oldLine?: number
  newLine?: number
}

export interface DiffHunk {
  header: string
  lines: DiffLine[]
}

const HUNK_RE = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/

export function parseUnifiedDiff(patch?: string): DiffHunk[] {
  const hunks: DiffHunk[] = []
  if (!patch) return hunks

  let current: DiffHunk | null = null
  let oldLn = 0
  let newLn = 0

  for (const raw of patch.split('\n')) {
    const hunkMatch = raw.match(HUNK_RE)
    if (hunkMatch) {
      oldLn = Number.parseInt(hunkMatch[1], 10)
      newLn = Number.parseInt(hunkMatch[2], 10)
      current = { header: raw, lines: [] }
      hunks.push(current)
      continue
    }
    if (!current) continue

    if (raw.startsWith('+') && !raw.startsWith('+++')) {
      current.lines.push({ type: 'add', content: raw.slice(1), newLine: newLn })
      newLn += 1
    } else if (raw.startsWith('-') && !raw.startsWith('---')) {
      current.lines.push({ type: 'del', content: raw.slice(1), oldLine: oldLn })
      oldLn += 1
    } else if (raw.startsWith('\\')) {
      // "\ No newline at end of file" — metadata, not a real line.
      continue
    } else {
      const content = raw.startsWith(' ') ? raw.slice(1) : raw
      current.lines.push({ type: 'context', content, oldLine: oldLn, newLine: newLn })
      oldLn += 1
      newLn += 1
    }
  }

  return hunks
}

/** The set of post-image (new) line numbers that appear in the diff. Used to
 * decide whether a finding can be anchored inline or must fall back to a list. */
export function diffNewLines(patch?: string): Set<number> {
  const lines = new Set<number>()
  for (const hunk of parseUnifiedDiff(patch)) {
    for (const line of hunk.lines) {
      if (line.newLine !== undefined && (line.type === 'add' || line.type === 'context')) {
        lines.add(line.newLine)
      }
    }
  }
  return lines
}
