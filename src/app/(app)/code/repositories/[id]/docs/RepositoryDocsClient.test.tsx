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

    expect(screen.getByText(/Nenhuma documentação gerada para web/)).toBeInTheDocument()
    expect(apiFetch).not.toHaveBeenCalled()
  })

  // Generating is a write; a viewer must not be offered the button.
  it('offers generation only to roles that may generate', () => {
    const { rerender } = render(
      <RepositoryDocsClient repo={repo} initialDocs={[]} canGenerate={false} />
    )
    expect(screen.queryByRole('button', { name: /gerar documentação/i })).not.toBeInTheDocument()

    rerender(<RepositoryDocsClient repo={repo} initialDocs={[]} canGenerate />)
    expect(screen.getByRole('button', { name: /gerar documentação/i })).toBeInTheDocument()
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
