import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { GenerateDocsModal } from './GenerateDocsModal'
import { DocGenerationSummary, DocTemplate } from '@/lib/types/docs'

const apiFetch = jest.fn()
jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}))

const repoTemplates: DocTemplate[] = [
  {
    id: 'repo-architecture',
    label: 'Arquitetura',
    description: 'Como este repositório é construído: um diagrama Mermaid dos módulos.',
    type: 'architecture',
    scope: 'repo',
    sections: ['Diagrama de componentes (Mermaid)', 'O que o sistema faz'],
    output_path: 'docs/ARCHITECTURE.md',
  },
  {
    id: 'repo-guidelines',
    label: 'Diretrizes',
    description: 'Um CONTRIBUTING.md com o estilo de código inferido do repositório.',
    type: 'guidelines',
    scope: 'repo',
    sections: ['Estilo de código', 'Processo de PR'],
    output_path: 'CONTRIBUTING.md',
  },
]

function existing(types: string[]): DocGenerationSummary[] {
  return [
    {
      id: 'doc-1',
      organization_id: 'org-1',
      source: 'ai',
      scope: 'repo',
      status: 'completed',
      types: types as DocGenerationSummary['types'],
      tokens_used: 1200,
      created_at: '2026-08-12T10:00:00Z',
      updated_at: '2026-08-12T10:00:00Z',
    },
  ]
}

function renderModal(props: Partial<Parameters<typeof GenerateDocsModal>[0]> = {}) {
  return render(
    <GenerateDocsModal
      isOpen
      onClose={jest.fn()}
      repoId="repo-1"
      defaultBranch="main"
      onSuccess={jest.fn()}
      {...props}
    />
  )
}

describe('GenerateDocsModal', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue(repoTemplates)
  })

  // Scope is what keeps org templates out of a gallery whose documents have to
  // land in a repository.
  it('asks only for repo-scope templates', async () => {
    renderModal()
    await waitFor(() => expect(apiFetch).toHaveBeenCalled())
    expect(apiFetch).toHaveBeenCalledWith('/api/docs/templates?scope=repo')
  })

  // The complaint this replaces: checkboxes labelled with a raw slug.
  it('says what each type produces — description, sections and the file', async () => {
    renderModal()

    expect(await screen.findByText('Arquitetura')).toBeInTheDocument()
    expect(screen.getByText(/diagrama Mermaid dos módulos/)).toBeInTheDocument()
    expect(screen.getByText(/Diagrama de componentes \(Mermaid\)/)).toBeInTheDocument()
    expect(screen.getByText('docs/ARCHITECTURE.md')).toBeInTheDocument()
    expect(screen.getByText('CONTRIBUTING.md')).toBeInTheDocument()
  })

  // A pre-checked option reads as a recommendation, and each selected type
  // costs a Claude call against the org's hourly budget.
  it('pre-selects nothing', async () => {
    renderModal()
    await screen.findByText('Arquitetura')

    for (const card of screen.getAllByRole('button', { pressed: false })) {
      expect(card).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument()
    expect(screen.getByText('Nenhum tipo selecionado')).toBeInTheDocument()
  })

  it('refuses to submit with nothing selected', async () => {
    renderModal()
    await screen.findByText('Arquitetura')

    fireEvent.click(screen.getByRole('button', { name: 'Gerar' }))

    expect(await screen.findByText(/Selecione ao menos um tipo/)).toBeInTheDocument()
    // Only the template fetch happened — no generation was requested.
    expect(apiFetch).toHaveBeenCalledTimes(1)
  })

  it('toggles a type and counts what the PR will contain', async () => {
    renderModal()
    const card = await screen.findByRole('button', { name: /Arquitetura/ })

    fireEvent.click(card)
    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 arquivo neste PR')).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: /Diretrizes/ }))
    expect(screen.getByText('2 arquivos neste PR')).toBeInTheDocument()

    fireEvent.click(card)
    expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('1 arquivo neste PR')).toBeInTheDocument()
  })

  // "Do I already have this?" is the question the old list could not answer.
  it('marks which types already exist for this repository', async () => {
    renderModal({ existingDocs: existing(['architecture']) })
    await screen.findByText('Arquitetura')

    expect(screen.getByText('Substitui o atual')).toBeInTheDocument()
    expect(screen.getByText('Faltando')).toBeInTheDocument()
  })

  it('submits the selected types and the branch', async () => {
    const onSuccess = jest.fn()
    apiFetch
      .mockResolvedValueOnce(repoTemplates)
      .mockResolvedValueOnce({ id: 'gen-1', status: 'pending' })

    renderModal({ onSuccess })
    fireEvent.click(await screen.findByRole('button', { name: /Arquitetura/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Gerar' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(apiFetch).toHaveBeenLastCalledWith(
      '/api/repositories/repo-1/docs',
      expect.objectContaining({ method: 'POST' })
    )
    const [, init] = apiFetch.mock.calls[1]
    expect(JSON.parse(init.body)).toEqual({ types: ['architecture'], branch: 'main' })
  })

  // Degrading to nothing beats degrading to unlabelled checkboxes — offering a
  // choice with no explanation is the state this replaced.
  it('reports a template load failure instead of rendering bare options', async () => {
    apiFetch.mockRejectedValue(new Error('backend down'))
    renderModal()

    expect(await screen.findByText(/Não foi possível carregar os tipos/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { pressed: false })).not.toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <GenerateDocsModal
        isOpen={false}
        onClose={jest.fn()}
        repoId="repo-1"
        onSuccess={jest.fn()}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})

// Regression: clicking one card used to select every card sharing its type.
//
// Selection was keyed by `template.type`, which is not unique — the four
// organization ADR templates all carry `type: 'adr'`. It stayed invisible while
// this gallery only ever received one template per type, and became a visible
// bug the moment an unfiltered registry reached it: choosing "Escolha de
// tecnologia" also marked boundary, deprecation and convention.
describe('GenerateDocsModal selection identity', () => {
  const unfiltered: DocTemplate[] = [
    {
      id: 'adr-tech-choice',
      label: 'Escolha de tecnologia',
      description: 'Decisão entre opções concorrentes.',
      type: 'adr',
      scope: 'org',
      sections: ['Status'],
    },
    {
      id: 'adr-service-boundary',
      label: 'Boundary entre serviços',
      description: 'Como serviços se comunicam.',
      type: 'adr',
      scope: 'org',
      sections: ['Status'],
    },
    ...repoTemplates,
  ]

  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue(unfiltered)
  })

  // The endpoint answers with everything when it does not recognize the scope
  // parameter — which is what an older server does. A document with no
  // repository to land in must not be offered here whatever arrives.
  it('shows only repo-scope templates even when the response is unfiltered', async () => {
    renderModal()

    expect(await screen.findByText('Arquitetura')).toBeInTheDocument()
    expect(screen.queryByText('Escolha de tecnologia')).not.toBeInTheDocument()
    expect(screen.queryByText('Boundary entre serviços')).not.toBeInTheDocument()
  })

  it('selects exactly one card per click, even among same-type templates', async () => {
    // Bypass the scope guard to test the selection key itself: two entries
    // sharing a type must still select independently.
    apiFetch.mockResolvedValue(
      unfiltered.map((t) => ({ ...t, scope: 'repo' as const, output_path: 'docs/X.md' }))
    )
    renderModal()

    const first = await screen.findByRole('button', { name: /Escolha de tecnologia/ })
    fireEvent.click(first)

    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Boundary entre serviços/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
  })

  // The API takes types, so two selected templates of the same type must not
  // ask the worker to generate it twice.
  it('dedupes types when two selected templates share one', async () => {
    apiFetch.mockResolvedValue(
      unfiltered.map((t) => ({ ...t, scope: 'repo' as const, output_path: 'docs/X.md' }))
    )
    renderModal()

    fireEvent.click(await screen.findByRole('button', { name: /Escolha de tecnologia/ }))
    fireEvent.click(screen.getByRole('button', { name: /Boundary entre serviços/ }))
    apiFetch.mockResolvedValueOnce({ id: 'gen-1', status: 'pending' })
    fireEvent.click(screen.getByRole('button', { name: 'Gerar' }))

    await waitFor(() =>
      expect(apiFetch).toHaveBeenLastCalledWith(
        '/api/repositories/repo-1/docs',
        expect.objectContaining({ method: 'POST' })
      )
    )
    const [, init] = apiFetch.mock.calls[apiFetch.mock.calls.length - 1]
    expect(JSON.parse(init.body).types).toEqual(['adr'])
  })
})
