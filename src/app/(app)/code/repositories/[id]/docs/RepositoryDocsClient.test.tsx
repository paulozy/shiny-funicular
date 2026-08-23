import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RepositoryDocsClient } from './RepositoryDocsClient'
import { RepositoryResponse } from '@/lib/types/repository'
import { DocGenerationSummary } from '@/lib/types/docs'

const apiFetch = jest.fn()
jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}))

const repo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  organization_id: 'org-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

const generation: DocGenerationSummary = {
  id: 'doc-1',
  organization_id: 'org-1',
  source: 'ai',
  scope: 'repo',
  repository_id: 'repo-1',
  status: 'completed',
  types: ['architecture'],
  tokens_used: 100,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('RepositoryDocsClient', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue({
      ...generation,
      content: { architecture: '# Arquitetura\n\nO serviço fala HTTP.' },
    })
  })

  it('loads and shows the newest generation for the repository', async () => {
    render(<RepositoryDocsClient repo={repo} initialDocs={[generation]} canGenerate />)

    expect(apiFetch).toHaveBeenCalledWith('/api/docs/doc-1')
    await waitFor(() => expect(screen.getByText('O serviço fala HTTP.')).toBeInTheDocument())
  })

  it('explains the empty state instead of showing a blank panel', () => {
    render(<RepositoryDocsClient repo={repo} initialDocs={[]} canGenerate />)

    // "Documento", not "documentação gerada": the panel now holds
    // hand-written documents too, so the wording no longer claims a model
    // produced everything in it.
    expect(screen.getByText(/Nenhum documento para web/)).toBeInTheDocument()
    expect(apiFetch).not.toHaveBeenCalled()
  })

  // Both are writes; a viewer must be offered neither.
  it('offers the two authoring actions only to roles that may write', () => {
    const { rerender } = render(
      <RepositoryDocsClient repo={repo} initialDocs={[]} canGenerate={false} />
    )
    expect(screen.queryByRole('button', { name: /gerar com ia/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\+ Nova/i })).not.toBeInTheDocument()

    rerender(<RepositoryDocsClient repo={repo} initialDocs={[]} canGenerate />)
    expect(screen.getByRole('button', { name: /gerar com ia/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ Nova/i })).toBeInTheDocument()
  })

  // Writing by hand is the primary action because it is the one that always
  // works — generating needs an Anthropic key, a host credential, token budget
  // and a live queue.
  it('leads with writing by hand rather than generating', () => {
    render(<RepositoryDocsClient repo={repo} initialDocs={[]} canGenerate />)

    const actions = screen.getAllByRole('button')
    const manualIndex = actions.findIndex((b) => /\+ Nova/i.test(b.textContent ?? ''))
    const aiIndex = actions.findIndex((b) => /gerar com ia/i.test(b.textContent ?? ''))
    expect(manualIndex).toBeGreaterThanOrEqual(0)
    expect(manualIndex).toBeLessThan(aiIndex)
  })

  it('keeps a way back to the organization-wide docs hub', () => {
    render(<RepositoryDocsClient repo={repo} initialDocs={[]} canGenerate />)

    expect(screen.getByRole('link', { name: /ver no hub de documentação/i })).toHaveAttribute(
      'href',
      '/docs?repo=repo-1'
    )
  })

  it('switches between the generated document types', async () => {
    apiFetch.mockResolvedValue({
      ...generation,
      content: { architecture: 'Sobre a arquitetura.', adr: 'Sobre as decisões.' },
    })
    render(<RepositoryDocsClient repo={repo} initialDocs={[generation]} canGenerate />)

    // Opens on the first type that actually carries content, in DOC_TYPES
    // order — ADRs here, not the alphabetically-first tab.
    await waitFor(() => expect(screen.getByText('Sobre as decisões.')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: 'Arquitetura' }))
    expect(screen.getByText('Sobre a arquitetura.')).toBeInTheDocument()
  })
})
