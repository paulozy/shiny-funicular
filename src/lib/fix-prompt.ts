// Generates a markdown prompt that the developer can paste into Cursor /
// Claude Code / ChatGPT / Copilot Chat to request fixes for the analyzed
// issues. Pure function so it's trivial to snapshot-test and reuse from a
// single-issue copy action and the batch "Copy fix prompt" button.
//
// Convention: send `file_path:line` + description, NOT inline code snippets.
// IDE agents read the file directly and snippets stale fast — sending them
// also inflates the prompt 10x for no benefit.

import { CodeAnalysis, CodeIssue, SeverityLevel } from '@/lib/types/analysis'
import { RepositoryResponse } from '@/lib/types/repository'

const MAX_ISSUES = 50
const MAX_CHARS = 30_000

const SEVERITY_ORDER: SeverityLevel[] = ['critical', 'error', 'warning', 'info']

const SEVERITY_LABEL: Record<SeverityLevel, string> = {
  critical: 'CRITICAL',
  error: 'ERROR',
  warning: 'WARNING',
  info: 'INFO',
}

const SEVERITY_SHORT: Record<SeverityLevel, string> = {
  critical: 'C',
  error: 'E',
  warning: 'W',
  info: 'I',
}

export interface BuildFixPromptInput {
  repo: RepositoryResponse
  issues: CodeIssue[]
  /** ISO timestamp from the analysis that produced these issues. */
  analysisCreatedAt?: string | null
}

export interface BuildFixPromptResult {
  text: string
  includedCount: number
  totalCount: number
  truncated: boolean
  charCount: number
}

export function buildFixPrompt({ repo, issues, analysisCreatedAt }: BuildFixPromptInput): BuildFixPromptResult {
  const totalCount = issues.length

  // 1. Sort by severity (critical → info) with stable order inside each bucket.
  const sorted = sortIssuesBySeverity(issues)

  // 2. Cap by count first. Then render and shrink by dropping less-severe
  //    issues until the rendered prompt fits MAX_CHARS.
  let working = sorted.slice(0, MAX_ISSUES)
  let text = renderPrompt(repo, working, analysisCreatedAt)
  while (text.length > MAX_CHARS && working.length > 0) {
    // Drop the least-severe trailing issue (the sort above already arranges
    // them from most to least severe, so popping from the end is correct).
    working = working.slice(0, -1)
    text = renderPrompt(repo, working, analysisCreatedAt)
  }

  return {
    text,
    includedCount: working.length,
    totalCount,
    truncated: working.length < totalCount,
    charCount: text.length,
  }
}

/** Convenience helper for the single-issue copy button on each IssueCard. */
export function buildSingleIssuePrompt(
  repo: RepositoryResponse,
  issue: CodeIssue,
  analysisCreatedAt?: string | null
): BuildFixPromptResult {
  return buildFixPrompt({ repo, issues: [issue], analysisCreatedAt })
}

function sortIssuesBySeverity(issues: CodeIssue[]): CodeIssue[] {
  return issues
    .map((issue, idx) => ({ issue, idx }))
    .sort((a, b) => {
      const sa = SEVERITY_ORDER.indexOf(a.issue.severity)
      const sb = SEVERITY_ORDER.indexOf(b.issue.severity)
      const aSev = sa === -1 ? SEVERITY_ORDER.length : sa
      const bSev = sb === -1 ? SEVERITY_ORDER.length : sb
      if (aSev !== bSev) return aSev - bSev
      return a.idx - b.idx
    })
    .map(({ issue }) => issue)
}

function renderPrompt(
  repo: RepositoryResponse,
  issues: CodeIssue[],
  analysisCreatedAt?: string | null
): string {
  const branch = repo.metadata?.default_branch || 'main'
  const languages = formatList(Object.keys(repo.metadata?.languages ?? {}))
  const frameworks = formatList(repo.metadata?.frameworks ?? [])
  const analysedAt = formatAnalysisDate(analysisCreatedAt)
  const counts = countBySeverity(issues)

  const lines: string[] = []

  lines.push(`# Code Review Fixes — ${repo.full_name || repo.name}`)
  lines.push('')
  lines.push('## Contexto')
  lines.push(`- Repositório: ${repo.full_name || repo.name} (branch: ${branch})`)
  if (languages) lines.push(`- Linguagem(s): ${languages}`)
  if (frameworks) lines.push(`- Framework(s): ${frameworks}`)
  if (analysedAt) lines.push(`- Análise gerada em: ${analysedAt}`)
  lines.push('')
  lines.push('## Sua tarefa')
  lines.push('Atue como senior engineer. Para cada issue abaixo:')
  lines.push('1. Localize o arquivo e linha indicados.')
  lines.push('2. Proponha o fix mínimo que resolve o problema sem regressões.')
  lines.push('3. Respeite as convenções existentes do projeto (lint, naming, estilo).')
  lines.push('4. Resolva na ordem listada (critical → error → warning → info).')
  lines.push('5. Ao final, resuma o que mudou e os arquivos tocados.')
  lines.push('')
  lines.push(`## Issues (${issues.length} total${formatBreakdown(counts)})`)
  lines.push('')

  for (const issue of issues) {
    lines.push(renderIssue(issue))
    lines.push('')
  }

  lines.push('## Como usar este prompt')
  lines.push('Cole em Cursor (Cmd+L), Claude Code, ChatGPT ou Copilot Chat.')
  lines.push('Para o agente abrir os arquivos diretamente, prefira ferramentas')
  lines.push('rodando no repositório clonado.')

  return lines.join('\n')
}

function renderIssue(issue: CodeIssue): string {
  const lines: string[] = []
  const label = SEVERITY_LABEL[issue.severity] || issue.severity.toUpperCase()
  lines.push(`### [${label}] ${issue.title}`)

  if (issue.file) {
    const location = issue.line && issue.line > 0 ? `${issue.file}:${issue.line}` : issue.file
    lines.push(`- Arquivo: \`${location}\``)
  }

  const tags = [
    issue.category,
    issue.cwe_id,
    issue.owasp_category,
    issue.pattern,
    issue.debt_category,
  ].filter((t): t is string => !!t && t.length > 0)
  if (tags.length > 0) {
    lines.push(`- Categoria: ${tags.join(' · ')}`)
  }

  if (issue.description) lines.push(`- Descrição: ${issue.description}`)
  if (issue.suggestion) lines.push(`- Sugestão da análise: ${issue.suggestion}`)

  return lines.join('\n')
}

function formatList(items: string[]): string {
  return items.filter(Boolean).join(', ')
}

function formatAnalysisDate(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function countBySeverity(issues: CodeIssue[]): Record<SeverityLevel, number> {
  const counts: Record<SeverityLevel, number> = { critical: 0, error: 0, warning: 0, info: 0 }
  for (const issue of issues) {
    const sev = SEVERITY_ORDER.includes(issue.severity) ? issue.severity : 'info'
    counts[sev]++
  }
  return counts
}

function formatBreakdown(counts: Record<SeverityLevel, number>): string {
  const parts: string[] = []
  for (const sev of SEVERITY_ORDER) {
    if (counts[sev] > 0) parts.push(`${counts[sev]}${SEVERITY_SHORT[sev]}`)
  }
  return parts.length > 0 ? ` — ${parts.join(' / ')}` : ''
}

/** Re-export so callers don't have to import the type separately. */
export type { CodeAnalysis }
