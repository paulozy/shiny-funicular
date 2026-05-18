import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RelationshipModal } from './RelationshipModal'
import { RepositoryGraphNode } from '@/lib/types/graph'

const nodes: RepositoryGraphNode[] = [
  { id: 'r1', name: 'web', url: 'https://github.com/org/web', type: 'github' },
  { id: 'r2', name: 'api', url: 'https://github.com/org/api', type: 'github' },
]

describe('RelationshipModal', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch
  })

  it('does not render when closed', () => {
    render(
      <RelationshipModal isOpen={false} onClose={() => undefined} nodes={nodes} onSuccess={() => undefined} />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the create form and submits a valid relationship', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 201,
      json: () =>
        Promise.resolve({
          id: 'edge-1',
          source_repository_id: 'r1',
          target_repository_id: 'r2',
          kind: 'http',
          source: 'manual',
          confidence: 1,
        }),
    })

    const onSuccess = jest.fn()
    const onClose = jest.fn()
    render(
      <RelationshipModal
        isOpen
        onClose={onClose}
        nodes={nodes}
        initialSourceId="r1"
        onSuccess={onSuccess}
      />
    )

    expect(screen.getByRole('dialog', { name: 'Nova relação' })).toBeInTheDocument()

    // The target select starts empty — pick api.
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'r2' } })

    fireEvent.click(screen.getByRole('button', { name: 'Criar' }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/repository-relationships',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('shows a validation error when source and target match', async () => {
    render(
      <RelationshipModal
        isOpen
        onClose={() => undefined}
        nodes={nodes}
        initialSourceId="r1"
        onSuccess={() => undefined}
      />
    )

    // Force target equal to source.
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'r1' } })

    fireEvent.click(screen.getByRole('button', { name: 'Criar' }))

    expect(
      await screen.findByText(/Origem e destino não podem ser o mesmo repositório/i)
    ).toBeInTheDocument()
  })
})
