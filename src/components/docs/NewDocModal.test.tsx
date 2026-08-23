import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { NewDocModal } from './NewDocModal'
import { DocTemplate } from '@/lib/types/docs'

const apiFetch = jest.fn()
jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}))

// The real editor lazy-loads an ESM package and imports a stylesheet; the
// contract this component depends on is "shows the content, calls onSave".
jest.mock('@/components/docs/DocMarkdownEditor', () => ({
  DocMarkdownEditor: ({
    initialContent,
    onSave,
  }: {
    initialContent: string
    onSave: (content: string) => void
  }) => (
    <div>
      <textarea defaultValue={initialContent} aria-label="editor" />
      <button type="button" onClick={() => onSave(initialContent)}>
        Salvar
      </button>
    </div>
  ),
}))

const repoTemplates: DocTemplate[] = [
  {
    id: 'repo-architecture',
    label: 'Arquitetura',
    description: 'Como este repositório é construído.',
    type: 'architecture',
    scope: 'repo',
    sections: ['Diagrama de componentes', 'Decisões técnicas principais'],
    output_path: 'docs/ARCHITECTURE.md',
  },
  {
    id: 'repo-service-doc',
    label: 'Serviço',
    description: 'O manual de operação.',
    type: 'service_doc',
    scope: 'repo',
    sections: ['Visão geral', 'Pré-requisitos'],
    output_path: 'docs/SERVICE.md',
  },
]

describe('NewDocModal', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue(repoTemplates)
  })

  function renderRepo(onCreated = jest.fn()) {
    render(
      <NewDocModal
        isOpen
        onClose={jest.fn()}
        scope="repo"
        repoId="repo-1"
        onCreated={onCreated}
      />
    )
    return onCreated
  }

  it('asks for templates in its own scope', async () => {
    renderRepo()
    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/api/docs/templates?scope=repo'))
  })

  it('offers the types with what each one contains', async () => {
    renderRepo()

    expect(await screen.findByText('Arquitetura')).toBeInTheDocument()
    expect(screen.getByText('Serviço')).toBeInTheDocument()
    expect(screen.getByText('docs/ARCHITECTURE.md')).toBeInTheDocument()
    expect(screen.getByText(/Diagrama de componentes · Decisões técnicas principais/)).toBeInTheDocument()
  })

  // The blank page is answerable: the outline comes from the type's own
  // sections, so it is exactly what the reader was promised.
  it('seeds the editor with the type\'s section outline', async () => {
    renderRepo()
    fireEvent.click(await screen.findByRole('button', { name: /Arquitetura/ }))

    const editor = screen.getByLabelText('editor') as HTMLTextAreaElement
    expect(editor.value).toContain('# Arquitetura')
    expect(editor.value).toContain('## Diagrama de componentes')
    expect(editor.value).toContain('## Decisões técnicas principais')
    // Not a sample document — headings only. Prose here would drift from the
    // prompts it mirrors with nothing to catch it.
    expect(editor.value).not.toMatch(/Lorem|exemplo:/i)
  })

  it('posts to the manual endpoint, not the generation one', async () => {
    const onCreated = renderRepo()
    apiFetch
      .mockResolvedValueOnce(repoTemplates)
      .mockResolvedValueOnce({ id: 'doc-9', source: 'manual', status: 'completed' })

    fireEvent.click(await screen.findByRole('button', { name: /Arquitetura/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    const [endpoint, init] = apiFetch.mock.calls[apiFetch.mock.calls.length - 1]
    expect(endpoint).toBe('/api/repositories/repo-1/docs/manual')
    expect(JSON.parse(init.body).type).toBe('architecture')
  })

  it('lets the writer go back and pick a different type', async () => {
    renderRepo()
    fireEvent.click(await screen.findByRole('button', { name: /Arquitetura/ }))
    expect(screen.getByLabelText('editor')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Trocar tipo/ }))
    expect(screen.queryByLabelText('editor')).not.toBeInTheDocument()
    expect(screen.getByText('Serviço')).toBeInTheDocument()
  })

  it('targets the organization endpoint in org scope', async () => {
    const onCreated = jest.fn()
    apiFetch
      .mockResolvedValueOnce([{ ...repoTemplates[0], scope: 'org', output_path: undefined }])
      .mockResolvedValueOnce({ id: 'doc-9', source: 'manual', status: 'completed' })

    render(<NewDocModal isOpen onClose={jest.fn()} scope="org" onCreated={onCreated} />)
    fireEvent.click(await screen.findByRole('button', { name: /Arquitetura/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(apiFetch.mock.calls[apiFetch.mock.calls.length - 1][0]).toBe(
      '/api/organizations/docs/manual'
    )
  })

  // An org document has no repository, so no file path is promised.
  it('shows no output file for org-scope types', async () => {
    apiFetch.mockResolvedValue([{ ...repoTemplates[0], scope: 'org', output_path: undefined }])
    render(<NewDocModal isOpen onClose={jest.fn()} scope="org" onCreated={jest.fn()} />)

    expect(await screen.findByText('Arquitetura')).toBeInTheDocument()
    expect(screen.queryByText('Arquivo')).not.toBeInTheDocument()
  })

  it('reports a save failure without closing', async () => {
    const onCreated = jest.fn()
    apiFetch
      .mockResolvedValueOnce(repoTemplates)
      .mockRejectedValueOnce(new Error('backend recusou'))

    renderRepo(onCreated)
    fireEvent.click(await screen.findByRole('button', { name: /Arquitetura/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText(/backend recusou/)).toBeInTheDocument()
    expect(onCreated).not.toHaveBeenCalled()
    expect(screen.getByLabelText('editor')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <NewDocModal isOpen={false} onClose={jest.fn()} scope="repo" repoId="r1" onCreated={jest.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
