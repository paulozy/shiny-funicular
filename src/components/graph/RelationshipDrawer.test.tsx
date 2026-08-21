import { render, screen } from '@testing-library/react'
import { RelationshipDrawer } from './RelationshipDrawer'
import { RepositoryGraphEdge, RepositoryGraphNode } from '@/lib/types/graph'

const nodeA: RepositoryGraphNode = {
  id: 'repo-a',
  name: 'web',
  url: 'https://github.com/org/web',
  type: 'github',
}

const nodeB: RepositoryGraphNode = {
  id: 'repo-b',
  name: 'api',
  url: 'https://github.com/org/api',
  type: 'github',
}

const edge: RepositoryGraphEdge = {
  id: 'edge-1',
  source_repository_id: 'repo-a',
  target_repository_id: 'repo-b',
  kind: 'http',
  source: 'manual',
  confidence: 1,
}

const noop = () => {}

function renderDrawer(props: Partial<React.ComponentProps<typeof RelationshipDrawer>> = {}) {
  return render(
    <RelationshipDrawer
      selectedNode={null}
      selectedEdge={null}
      nodes={[nodeA, nodeB]}
      edges={[edge]}
      onCreateRelationship={noop}
      onEditRelationship={noop}
      onDeleteRelationship={noop}
      onClose={noop}
      {...props}
    />
  )
}

describe('RelationshipDrawer permissions', () => {
  // Relationship CRUD is gated at developer on the API. Rendering the controls
  // for a viewer would send them into a 403.
  it('hides edit and remove on an edge when the user cannot manage', () => {
    renderDrawer({ selectedEdge: edge, canManage: false })

    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument()
  })

  it('shows edit and remove on an edge when the user can manage', () => {
    renderDrawer({ selectedEdge: edge, canManage: true })

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remover/i })).toBeInTheDocument()
  })

  it('hides the create CTA on a node when the user cannot manage', () => {
    renderDrawer({ selectedNode: nodeA, canManage: false })

    expect(screen.queryByRole('button', { name: /nova relação/i })).not.toBeInTheDocument()
  })

  it('shows the create CTA on a node when the user can manage', () => {
    renderDrawer({ selectedNode: nodeA, canManage: true })

    expect(screen.getByRole('button', { name: /nova relação/i })).toBeInTheDocument()
  })

  // canManage defaults to false so a caller that forgets to pass it fails
  // closed rather than exposing the controls.
  it('defaults to hiding the controls', () => {
    renderDrawer({ selectedEdge: edge })

    expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument()
  })
})
