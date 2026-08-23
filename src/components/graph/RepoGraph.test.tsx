import { render, screen } from '@testing-library/react'
import { RepoGraph } from './RepoGraph'
import { RepositoryGraphEdge, RepositoryGraphNode } from '@/lib/types/graph'

// React Flow needs real layout measurement, which jsdom does not do. Stubbing the
// canvas keeps this test about the thing worth asserting — that every node kind
// routes to a component — rather than about jsdom's lack of a layout engine.
jest.mock('@xyflow/react', () => {
  const actual = jest.requireActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({
      nodes,
      nodeTypes,
    }: {
      nodes: Array<{ id: string; type?: string; data: unknown }>
      nodeTypes: Record<string, React.ComponentType<{ data: unknown; selected: boolean }>>
    }) => (
      <div data-testid="canvas" data-node-types={Object.keys(nodeTypes).sort().join(',')}>
        {nodes.map((node) => {
          const Component = nodeTypes[node.type ?? '']
          if (!Component) return <div key={node.id} data-testid="unrendered-node" />
          return (
            <div key={node.id} data-testid={`node-${node.type}`}>
              <Component data={node.data} selected={false} />
            </div>
          )
        })}
      </div>
    ),
    ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Background: () => null,
    Controls: () => null,
    MiniMap: () => null,
    // Handle reads React Flow's zustand store, which only exists inside a real
    // provider. The node components under test render one for edge anchoring and
    // nothing else, so a no-op is faithful enough.
    Handle: () => null,
  }
})

const nodes: RepositoryGraphNode[] = [
  {
    id: 'repo:repo-a',
    kind: 'repo',
    name: 'orders',
    url: 'https://github.com/org/orders',
    type: 'github',
    sync_status: 'synced',
  },
  {
    id: 'api:api-1',
    kind: 'api',
    name: 'Orders API',
    spec_kind: 'openapi',
    spec_path: 'openapi.yaml',
    repository_id: 'repo-a',
    version: '1.4.0',
  },
  {
    id: 'resource:res-1',
    kind: 'resource',
    name: 'db (local)',
    engine: 'postgresql',
    is_scoped: true,
    repository_id: 'repo-a',
  },
]

const edges: RepositoryGraphEdge[] = [
  {
    id: 'provides:api-1',
    source: 'repo:repo-a',
    target: 'api:api-1',
    kind: 'provides',
    provenance: 'manifest',
    confidence: 1,
  },
  {
    id: 'link-1',
    source: 'repo:repo-a',
    target: 'resource:res-1',
    kind: 'uses',
    provenance: 'config',
    confidence: 0.7,
    derivation_key: 'resource:v1:repo/repo-a',
  },
]

describe('RepoGraph', () => {
  // The registry is the extension point the typed graph needed. A kind missing
  // from it renders nothing at all, which on the real canvas is an invisible node
  // with visible edges pointing at it.
  it('registers a component for all three node kinds', () => {
    render(<RepoGraph nodes={nodes} edges={edges} />)
    expect(screen.getByTestId('canvas')).toHaveAttribute('data-node-types', 'api,repo,resource')
  })

  it('routes each node to the component for its kind', () => {
    render(<RepoGraph nodes={nodes} edges={edges} />)
    expect(screen.getByTestId('node-repo')).toBeInTheDocument()
    expect(screen.getByTestId('node-api')).toBeInTheDocument()
    expect(screen.getByTestId('node-resource')).toBeInTheDocument()
    expect(screen.queryByTestId('unrendered-node')).not.toBeInTheDocument()
  })

  // The shape and the label are how a person tells inventory from topology without
  // opening the drawer.
  it('renders the resource scope on the node itself', () => {
    render(<RepoGraph nodes={nodes} edges={edges} />)
    expect(screen.getByText('local')).toBeInTheDocument()
    expect(screen.getByText('postgresql')).toBeInTheDocument()
  })

  it('renders the api spec kind on the node itself', () => {
    render(<RepoGraph nodes={nodes} edges={edges} />)
    expect(screen.getByText('OpenAPI')).toBeInTheDocument()
  })
})
