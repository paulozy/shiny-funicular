import { diffNewLines } from '@/lib/diff'
import { severityMeta } from '@/lib/severity'
import {
  CodeIssue,
  CreatePullRequestReviewRequest,
  PullRequestFileResponse,
  PullRequestReviewCommentInput,
} from '@/lib/types/pull_request'

// Only these severities are worth an inline comment; anything lower is folded
// into the review summary to keep the noise down (matches the "medium+" rule).
const INLINE_SEVERITIES = new Set(['critical', 'error', 'warning'])

function formatComment(issue: CodeIssue): string {
  let body = `**[${severityMeta(issue.severity).label}] ${issue.title}**`
  if (issue.description) body += `\n\n${issue.description}`
  if (issue.suggestion) body += `\n\n_Sugestão:_ ${issue.suggestion}`
  return body
}

function formatBody(summaryText: string | undefined, overflow: CodeIssue[]): string {
  const parts: string[] = ['🤖 **Revisão automática — IDP**']
  if (summaryText) parts.push(summaryText)
  if (overflow.length > 0) {
    const lines = overflow.map((issue) => {
      const loc = issue.file ? `\`${issue.file}${issue.line ? `:${issue.line}` : ''}\` — ` : ''
      return `- [${severityMeta(issue.severity).label}] ${loc}${issue.title}`
    })
    parts.push(`**Outros alertas:**\n${lines.join('\n')}`)
  }
  return parts.join('\n\n')
}

/**
 * Turns review findings into a single GitHub review submission. A finding is
 * commented inline only when it is medium+ severity AND its line is part of the
 * diff (post-image / RIGHT side) — GitHub rejects (422) inline comments on
 * lines outside the diff. Everything else is summarized in the review body so
 * no finding is lost. The event is always COMMENT (never blocks merge).
 */
export function buildReviewSubmission(
  files: PullRequestFileResponse[],
  issues: CodeIssue[],
  summaryText?: string
): CreatePullRequestReviewRequest {
  const newLinesByFile = new Map<string, Set<number>>()
  for (const file of files) {
    newLinesByFile.set(file.filename, diffNewLines(file.patch))
  }

  const comments: PullRequestReviewCommentInput[] = []
  const overflow: CodeIssue[] = []

  for (const issue of issues) {
    const anchorable =
      !!issue.file &&
      !!issue.line &&
      INLINE_SEVERITIES.has(issue.severity) &&
      (newLinesByFile.get(issue.file)?.has(issue.line) ?? false)

    if (anchorable) {
      comments.push({ path: issue.file!, line: issue.line!, side: 'RIGHT', body: formatComment(issue) })
    } else {
      overflow.push(issue)
    }
  }

  return {
    event: 'COMMENT',
    body: formatBody(summaryText, overflow),
    comments,
  }
}
