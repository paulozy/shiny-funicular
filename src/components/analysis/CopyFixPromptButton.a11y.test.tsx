import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { CopyFixPromptButton } from './CopyFixPromptButton'
import { CodeIssue } from '@/lib/types/analysis'
import { RepositoryResponse } from '@/lib/types/repository'

const repo: RepositoryResponse = {
  id: 'r1',
  name: 'app',
  full_name: 'org/app',
  url: 'https://github.com/org/app',
  provider: 'github',
  is_private: false,
  metadata: { default_branch: 'main', languages: { TypeScript: 100 } },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  organization_id: 'org-1',
}

const issues: CodeIssue[] = [
  {
    severity: 'critical',
    category: 'security',
    title: 'Hardcoded key',
    description: 'Exposed key in source',
    is_ai_generated: true,
    confidence: 0.95,
  },
]

describe('CopyFixPromptButton a11y', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    })
  })

  it('has no axe violations with the button visible', async () => {
    const { container } = render(
      <CopyFixPromptButton repo={repo} issues={issues} analysisCreatedAt={null} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations once the preview dialog is open', async () => {
    const { container } = render(
      <CopyFixPromptButton repo={repo} issues={issues} analysisCreatedAt={null} />
    )
    fireEvent.click(screen.getByRole('button', { name: /ver prompt/i }))
    expect(screen.getByRole('dialog', { name: /prompt de fix/i })).toBeInTheDocument()
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
