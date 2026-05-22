import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TemplateActionsMenu } from './TemplateActionsMenu'
import { CodeTemplate } from '@/lib/types/template'

const baseTemplate: CodeTemplate = {
  id: 't-1',
  organization_id: 'org-1',
  repository_id: null,
  prompt: 'Generate Next.js API',
  status: 'failed',
  files: [],
  summary: 'Next.js API scaffold',
  tokens_used: 1500,
  processing_ms: 8000,
  is_pinned: false,
  stack_snapshot: { languages: ['TypeScript'] },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('TemplateActionsMenu', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch
  })

  it('renders the kebab button and opens the menu with "Excluir"', () => {
    render(<TemplateActionsMenu template={baseTemplate} onDeleted={jest.fn()} />)

    const kebab = screen.getByLabelText('Mais ações')
    fireEvent.click(kebab)

    expect(screen.getByRole('menuitem', { name: /excluir/i })).toBeInTheDocument()
  })

  it('disables the "Excluir" item for non-terminal status', () => {
    const generating: CodeTemplate = { ...baseTemplate, status: 'generating' }
    render(<TemplateActionsMenu template={generating} onDeleted={jest.fn()} />)

    fireEvent.click(screen.getByLabelText('Mais ações'))
    const item = screen.getByRole('menuitem', { name: /excluir/i })

    expect(item).toBeDisabled()
    expect(item).toHaveAttribute('title', expect.stringMatching(/aguarde/i))
  })

  it('opens the confirm dialog and calls DELETE + onDeleted on confirmation', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(undefined),
    })

    const onDeleted = jest.fn()
    render(<TemplateActionsMenu template={baseTemplate} onDeleted={onDeleted} />)

    fireEvent.click(screen.getByLabelText('Mais ações'))
    fireEvent.click(screen.getByRole('menuitem', { name: /excluir/i }))

    // Confirm dialog is open
    expect(screen.getByRole('dialog', { name: /excluir template/i })).toBeInTheDocument()

    // Click the destructive button inside the dialog (text changes to "Excluindo…" while in flight).
    const buttons = screen.getAllByRole('button', { name: /excluir/i })
    // The last one is the destructive button in the dialog (kebab + menuitem also match /excluir/i…
    // simpler: target by exact match after disabled state)
    const destructive = buttons[buttons.length - 1]
    fireEvent.click(destructive)

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/templates/t-1',
      expect.objectContaining({ method: 'DELETE' })
    )
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('t-1'))
  })

  it('shows an inline error and keeps the dialog open when the request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'internal_error', error_description: 'boom' }),
    })

    const onDeleted = jest.fn()
    render(<TemplateActionsMenu template={baseTemplate} onDeleted={onDeleted} />)

    fireEvent.click(screen.getByLabelText('Mais ações'))
    fireEvent.click(screen.getByRole('menuitem', { name: /excluir/i }))
    const destructive = screen.getAllByRole('button', { name: /excluir/i }).slice(-1)[0]
    fireEvent.click(destructive)

    await waitFor(() => expect(screen.getByText(/boom/i)).toBeInTheDocument())
    expect(onDeleted).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: /excluir template/i })).toBeInTheDocument()
  })

  it('cancels the confirm dialog when Cancelar is clicked', () => {
    render(<TemplateActionsMenu template={baseTemplate} onDeleted={jest.fn()} />)

    fireEvent.click(screen.getByLabelText('Mais ações'))
    fireEvent.click(screen.getByRole('menuitem', { name: /excluir/i }))
    expect(screen.getByRole('dialog', { name: /excluir template/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByRole('dialog', { name: /excluir template/i })).not.toBeInTheDocument()
  })
})
