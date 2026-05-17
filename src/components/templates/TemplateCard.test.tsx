import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TemplateCard } from './TemplateCard'
import { CodeTemplate } from '@/lib/types/template'

const baseTemplate: CodeTemplate = {
  id: 't-1',
  organization_id: 'org-1',
  repository_id: null,
  prompt: 'Generate Next.js API',
  status: 'completed',
  files: [{ path: 'index.ts', content: 'export {}', language: 'typescript' }],
  summary: 'Next.js API scaffold',
  tokens_used: 1500,
  processing_ms: 8000,
  is_pinned: false,
  stack_snapshot: { languages: ['TypeScript'] },
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('TemplateCard', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch
  })

  it('renders summary, status, and links to the detail page', () => {
    render(<TemplateCard template={baseTemplate} />)

    // The summary text appears twice (link title + description block) — both
    // are intentional. We just verify both surfaces exist.
    expect(screen.getAllByText('Next.js API scaffold')).toHaveLength(2)
    expect(screen.getByText('Concluído')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next\.js api scaffold/i })).toHaveAttribute(
      'href',
      '/templates/t-1'
    )
  })

  it('optimistically toggles the pin button without waiting for the API', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...baseTemplate, is_pinned: true }),
    })

    render(<TemplateCard template={baseTemplate} />)
    const pinBtn = screen.getByLabelText('Fixar template')

    fireEvent.click(pinBtn)

    // Optimistically flips to unpin label immediately.
    expect(screen.getByLabelText('Desfixar template')).toBeInTheDocument()

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/templates/t-1/pin',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ is_pinned: true }),
      })
    )
  })

  it('rolls back the optimistic pin when the request fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'boom' }),
    })

    render(<TemplateCard template={baseTemplate} />)
    fireEvent.click(screen.getByLabelText('Fixar template'))

    await waitFor(() => {
      // After failure, label returns to "Fixar template".
      expect(screen.getByLabelText('Fixar template')).toBeInTheDocument()
    })
  })
})
