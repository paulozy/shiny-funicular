import { act, fireEvent, render, screen } from '@testing-library/react'
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
  {
    severity: 'warning',
    category: 'style',
    title: 'Missing doc',
    description: '',
    is_ai_generated: true,
    confidence: 0.6,
  },
]

describe('CopyFixPromptButton', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    })
  })

  it('renders nothing when there are no issues', () => {
    const { container } = render(
      <CopyFixPromptButton repo={repo} issues={[]} analysisCreatedAt={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('copies the prompt to the clipboard on click and shows a toast', async () => {
    render(<CopyFixPromptButton repo={repo} issues={issues} analysisCreatedAt={null} />)
    const button = screen.getByRole('button', { name: /copiar prompt de fix/i })
    await act(async () => {
      fireEvent.click(button)
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
    const payload = (navigator.clipboard.writeText as jest.Mock).mock.calls[0][0]
    expect(payload).toContain('# Code Review Fixes — org/app')
    expect(payload).toContain('] Hardcoded key')
    expect(screen.getByRole('status')).toHaveTextContent(/prompt copiado/i)
  })

  it('opens and closes the preview modal', () => {
    render(<CopyFixPromptButton repo={repo} issues={issues} analysisCreatedAt={null} />)
    fireEvent.click(screen.getByRole('button', { name: /ver prompt/i }))

    const dialog = screen.getByRole('dialog', { name: /prompt de fix/i })
    expect(dialog).toBeInTheDocument()
    expect(dialog.textContent).toContain('# Code Review Fixes — org/app')

    fireEvent.click(screen.getByRole('button', { name: /fechar/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('surfaces the truncation count when over the cap', async () => {
    const many = Array.from({ length: 73 }, (_, i) => ({ ...issues[1], title: `W${i}` }))
    render(<CopyFixPromptButton repo={repo} issues={many} analysisCreatedAt={null} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copiar prompt de fix/i }))
    })
    expect(screen.getByRole('status')).toHaveTextContent(/50\/73 issues/)
  })
})
