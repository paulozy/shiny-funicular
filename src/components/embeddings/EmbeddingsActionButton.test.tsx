import { fireEvent, render, screen } from '@testing-library/react'
import { EmbeddingsActionButton } from './EmbeddingsActionButton'
import { EmbeddingsState, EmbeddingsStatus } from '@/lib/types/repository'

function makeState(status: EmbeddingsStatus, overrides: Partial<EmbeddingsState> = {}): EmbeddingsState {
  return { status, count: 0, provider_configured: true, ...overrides }
}

describe('EmbeddingsActionButton', () => {
  it('renders "Indexar código" for idle + provider configured', () => {
    render(<EmbeddingsActionButton state={makeState('idle')} onTrigger={async () => undefined} />)
    expect(screen.getByRole('button', { name: /indexar código/i })).toBeEnabled()
  })

  it('renders "Atualizar referências" for indexed', () => {
    render(<EmbeddingsActionButton state={makeState('indexed', { count: 100 })} onTrigger={async () => undefined} />)
    expect(screen.getByRole('button', { name: /atualizar referências/i })).toBeEnabled()
  })

  it('renders "Tentar novamente" for failed', () => {
    render(<EmbeddingsActionButton state={makeState('failed')} onTrigger={async () => undefined} />)
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeEnabled()
  })

  it('disables and shows "Indexando…" while in progress', () => {
    render(<EmbeddingsActionButton state={makeState('indexing')} onTrigger={async () => undefined} />)
    const btn = screen.getByRole('button', { name: /indexando/i })
    expect(btn).toBeDisabled()
  })

  it('renders disabled + settings link when provider is not configured', () => {
    render(
      <EmbeddingsActionButton state={makeState('idle', { provider_configured: false })} onTrigger={async () => undefined} />
    )
    expect(screen.getByRole('button', { name: /provedor não configurado/i })).toBeDisabled()
    expect(screen.getByRole('link', { name: /abrir configurações/i })).toHaveAttribute('href', '/settings')
  })

  it('calls onTrigger when clicked in an actionable state', async () => {
    const onTrigger = jest.fn(async () => undefined)
    render(<EmbeddingsActionButton state={makeState('idle')} onTrigger={onTrigger} />)
    fireEvent.click(screen.getByRole('button', { name: /indexar código/i }))
    expect(onTrigger).toHaveBeenCalledTimes(1)
  })

  it('uses fallbackProviderConfigured when state is undefined (legacy backend)', () => {
    render(
      <EmbeddingsActionButton state={undefined} fallbackProviderConfigured onTrigger={async () => undefined} />
    )
    // Falls back to the idle treatment with provider OK.
    expect(screen.getByRole('button', { name: /indexar código/i })).toBeEnabled()
  })

  it('uses fallbackProviderConfigured=false to show the disabled state', () => {
    render(
      <EmbeddingsActionButton state={undefined} fallbackProviderConfigured={false} onTrigger={async () => undefined} />
    )
    expect(screen.getByRole('button', { name: /provedor não configurado/i })).toBeDisabled()
  })
})
