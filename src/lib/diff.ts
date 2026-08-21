// Minimal unified-diff parser for rendering GitHub PR patches in the IDP.
// GitHub returns each file's `patch` as a unified diff; we parse it into hunks
// of typed lines carrying old/new line numbers so each row renders with its
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
    } else if (raw.startsWith(' ')) {
      // Context lines are always prefixed with a single space in a unified
      // diff. Strip exactly that space (a blank context line is " " → "").
      current.lines.push({ type: 'context', content: raw.slice(1), oldLine: oldLn, newLine: newLn })
      oldLn += 1
      newLn += 1
    }
    // Anything else — an empty string (e.g. the trailing element from
    // splitting a patch that ends in "\n") or a malformed line — is NOT part
    // of the hunk grammar. Skip it without advancing line numbers so rows
    // stay anchored to the correct post-image line.
  }

  return hunks
}
