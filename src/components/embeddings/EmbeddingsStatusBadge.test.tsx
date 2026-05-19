import { render, screen } from '@testing-library/react'
import { EmbeddingsStatusBadge } from './EmbeddingsStatusBadge'
import { EmbeddingsState, EmbeddingsStatus } from '@/lib/types/repository'

function makeState(status: EmbeddingsStatus, overrides: Partial<EmbeddingsState> = {}): EmbeddingsState {
  return {
    status,
    count: 1200,
    provider_configured: true,
    ...overrides,
  }
}

describe('EmbeddingsStatusBadge', () => {
  it('renders nothing when state is undefined (legacy backend payload)', () => {
    const { container } = render(<EmbeddingsStatusBadge state={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows "Indexado" + compact count for status=indexed', () => {
    render(<EmbeddingsStatusBadge state={makeState('indexed')} />)
    const badge = screen.getByRole('status')
    expect(badge.textContent).toContain('Indexado')
    // `Intl.NumberFormat('pt-BR', { notation: 'compact' })` injects a narrow
    // no-break space (U+202F) between the number and the suffix, so we match
    // tolerantly with a regex instead of asserting on a plain string.
    expect(badge.textContent).toMatch(/1,2\s*mil/)
  })

  it('shows "Desatualizado" with warn tone for status=stale', () => {
    render(<EmbeddingsStatusBadge state={makeState('stale')} />)
    expect(screen.getByRole('status').textContent).toContain('Desatualizado')
  })

  it('shows pulsing "Indexando…" while in progress', () => {
    render(<EmbeddingsStatusBadge state={makeState('indexing', { count: 0 })} />)
    expect(screen.getByRole('status').textContent).toContain('Indexando')
  })

  it('shows "Sem provedor" when provider_configured is false on idle', () => {
    render(
      <EmbeddingsStatusBadge state={makeState('idle', { count: 0, provider_configured: false })} />
    )
    expect(screen.getByRole('status').textContent).toContain('Sem provedor')
  })

  it('shows "Sem índice" when status is idle but provider is configured', () => {
    render(<EmbeddingsStatusBadge state={makeState('idle', { count: 0 })} />)
    expect(screen.getByRole('status').textContent).toContain('Sem índice')
  })

  it('shows "Falhou" for status=failed', () => {
    render(<EmbeddingsStatusBadge state={makeState('failed', { error: 'voyage timeout' })} />)
    expect(screen.getByRole('status').textContent).toContain('Falhou')
  })

  it('compact size collapses to just the count for indexed', () => {
    render(<EmbeddingsStatusBadge state={makeState('indexed')} size="compact" />)
    // Match tolerantly because of the U+202F separator.
    expect(screen.getByRole('status').textContent).toMatch(/^1,2\s*mil$/)
  })
})
