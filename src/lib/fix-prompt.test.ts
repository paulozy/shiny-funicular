import { buildFixPrompt, buildSingleIssuePrompt } from './fix-prompt'
import { CodeIssue } from '@/lib/types/analysis'
import { RepositoryResponse } from '@/lib/types/repository'

const baseRepo: RepositoryResponse = {
  id: 'r1',
  name: 'shiny-funicular',
  full_name: 'paulozy/shiny-funicular',
  url: 'https://github.com/paulozy/shiny-funicular',
  provider: 'github',
  is_private: false,
  metadata: {
    default_branch: 'main',
    languages: { TypeScript: 8000, CSS: 2000 },
    frameworks: ['Next.js'],
  },
  created_at: '2026-05-19T00:00:00Z',
  updated_at: '2026-05-19T00:00:00Z',
  organization_id: 'org-1',
}

function makeIssue(overrides: Partial<CodeIssue>): CodeIssue {
  return {
    severity: 'warning',
    category: 'security',
    title: 'Default title',
    description: 'Default description',
    is_ai_generated: true,
    confidence: 0.9,
    ...overrides,
  }
}

describe('buildFixPrompt', () => {
  it('orders issues critical → error → warning → info (stable inside bucket)', () => {
    const issues: CodeIssue[] = [
      makeIssue({ severity: 'warning', title: 'W1' }),
      makeIssue({ severity: 'critical', title: 'C1' }),
      makeIssue({ severity: 'warning', title: 'W2' }),
      makeIssue({ severity: 'error', title: 'E1' }),
    ]
    const result = buildFixPrompt({ repo: baseRepo, issues })
    const order = ['C1', 'E1', 'W1', 'W2'].map((t) => result.text.indexOf(`] ${t}`))
    expect(order.every((idx) => idx > 0)).toBe(true)
    for (let i = 1; i < order.length; i++) {
      expect(order[i]).toBeGreaterThan(order[i - 1])
    }
  })

  it('includes repo name, branch, languages, frameworks and analysis date', () => {
    const result = buildFixPrompt({
      repo: baseRepo,
      issues: [makeIssue({ severity: 'critical', title: 'X' })],
      analysisCreatedAt: '2026-05-19T14:33:00Z',
    })
    expect(result.text).toContain('# Code Review Fixes — paulozy/shiny-funicular')
    expect(result.text).toContain('branch: main')
    expect(result.text).toContain('Linguagem(s): TypeScript, CSS')
    expect(result.text).toContain('Framework(s): Next.js')
    expect(result.text).toMatch(/Análise gerada em: 2026-05-19 \d{2}:\d{2}/)
  })

  it('skips empty/undefined metadata lines instead of emitting placeholders', () => {
    const repo: RepositoryResponse = {
      ...baseRepo,
      metadata: { default_branch: 'develop' },
    }
    const result = buildFixPrompt({
      repo,
      issues: [makeIssue({ severity: 'error', title: 'X' })],
    })
    expect(result.text).not.toContain('Linguagem(s)')
    expect(result.text).not.toContain('Framework(s)')
    expect(result.text).not.toContain('Análise gerada em')
  })

  it('omits optional issue fields when absent (no "CWE-undefined")', () => {
    const result = buildFixPrompt({
      repo: baseRepo,
      issues: [
        makeIssue({
          severity: 'critical',
          title: 'minimal',
          description: '',
          suggestion: '',
        }),
      ],
    })
    expect(result.text).not.toContain('undefined')
    expect(result.text).not.toContain('CWE-')
    expect(result.text).not.toContain('Descrição:')
    expect(result.text).not.toContain('Sugestão')
  })

  it('renders file:line and CWE/OWASP tags when present', () => {
    const result = buildFixPrompt({
      repo: baseRepo,
      issues: [
        makeIssue({
          severity: 'critical',
          title: 'SQLi',
          file: 'app/api/users.ts',
          line: 42,
          cwe_id: 'CWE-89',
          owasp_category: 'A03:2021',
        }),
      ],
    })
    expect(result.text).toContain('`app/api/users.ts:42`')
    expect(result.text).toContain('CWE-89')
    expect(result.text).toContain('A03:2021')
  })

  it('caps to 50 issues and reports truncated/totalCount', () => {
    const issues = Array.from({ length: 73 }, (_, i) =>
      makeIssue({ severity: 'warning', title: `W${i}` })
    )
    const result = buildFixPrompt({ repo: baseRepo, issues })
    expect(result.includedCount).toBe(50)
    expect(result.totalCount).toBe(73)
    expect(result.truncated).toBe(true)
  })

  it('keeps critical/error when truncating by length', () => {
    // Force the length-based truncation by stuffing many low-severity issues
    // with long descriptions.
    const longDesc = 'x'.repeat(1500)
    const issues: CodeIssue[] = [
      ...Array.from({ length: 50 }, (_, i) =>
        makeIssue({ severity: 'warning', title: `W${i}`, description: longDesc })
      ),
      makeIssue({ severity: 'critical', title: 'CRIT-1', description: 'short' }),
    ]
    const result = buildFixPrompt({ repo: baseRepo, issues })
    // critical was the LAST in input — but should survive truncation because
    // it sorts to the front.
    expect(result.text).toContain('] CRIT-1')
    expect(result.truncated).toBe(true)
  })

  it('returns the issue count breakdown in the heading', () => {
    const result = buildFixPrompt({
      repo: baseRepo,
      issues: [
        makeIssue({ severity: 'critical', title: 'A' }),
        makeIssue({ severity: 'critical', title: 'B' }),
        makeIssue({ severity: 'error', title: 'C' }),
        makeIssue({ severity: 'warning', title: 'D' }),
      ],
    })
    expect(result.text).toContain('## Issues (4 total — 2C / 1E / 1W)')
  })

  it('buildSingleIssuePrompt returns a single-issue prompt', () => {
    const issue = makeIssue({ severity: 'error', title: 'lone', file: 'a.ts', line: 9 })
    const result = buildSingleIssuePrompt(baseRepo, issue, '2026-05-19T10:00:00Z')
    expect(result.includedCount).toBe(1)
    expect(result.text).toContain('## Issues (1 total — 1E)')
    expect(result.text).toContain('] lone')
  })
})
