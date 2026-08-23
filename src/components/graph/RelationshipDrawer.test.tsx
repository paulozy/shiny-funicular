import { render, screen } from '@testing-library/react'
import { RelationshipDrawer } from './RelationshipDrawer'
import { RepositoryGraphEdge, RepositoryGraphNode } from '@/lib/types/graph'

// Node ids arrive prefixed from the backend, so the fixtures use the real shape.
const nodeA: RepositoryGraphNode = {
  id: 'repo:repo-a',
  kind: 'repo',
  name: 'web',
  url: 'https://github.com/org/web',
  type: 'github',
}

const nodeB: RepositoryGraphNode = {
  id: 'repo:repo-b',
  kind: 'repo',
  name: 'api',
  url: 'https://github.com/org/api',
  type: 'github',
}

const edge: RepositoryGraphEdge = {
  id: 'edge-1',
  source: 'repo:repo-a',
  target: 'repo:repo-b',
  kind: 'http',
  provenance: 'manual',
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

// ── the typed graph detail ───────────────────────────────────────────────────

const derivedEdge: RepositoryGraphEdge = {
  id: 'edge-derived',
  source: 'repo:repo-a',
  target: 'repo:repo-b',
  kind: 'library',
  provenance: 'manifest',
  confidence: 1,
  derivation_key: 'libdep:v1:org/org-1',
  metadata: {
    rule_id: 'libdep.gomod',
    manifest_path: 'go.mod',
    declared_version: 'v1.2.0',
  },
}

const consumeEdge: RepositoryGraphEdge = {
  id: 'edge-consume',
  source: 'repo:repo-a',
  target: 'repo:repo-b',
  kind: 'http',
  provenance: 'config',
  confidence: 0.85,
  derivation_key: 'apiconsume:v1:org/org-1',
  metadata: {
    rule_id: 'consume.k8s_service_host',
    evidence_path: 'k8s/deployment.yaml',
    env_var_name: 'ORDERS_URL',
  },
}

const apiNode: RepositoryGraphNode = {
  id: 'api:api-1',
  kind: 'api',
  name: 'Orders API',
  spec_kind: 'openapi',
  spec_path: 'openapi.yaml',
  repository_id: 'repo-a',
  title: 'Orders API',
  version: '1.4.0',
  operation_count: 3,
  rule_id: 'api.root_marker',
}

const scopedResourceNode: RepositoryGraphNode = {
  id: 'resource:res-1',
  kind: 'resource',
  name: 'db (local)',
  engine: 'postgresql',
  is_scoped: true,
  repository_id: 'repo-a',
  rule_id: 'resource.compose_image',
  evidence: ['docker-compose.yml'],
}

const sharedResourceNode: RepositoryGraphNode = {
  id: 'resource:res-2',
  kind: 'resource',
  name: 'postgresql @ db.prod.internal/orders',
  engine: 'postgresql',
  is_scoped: false,
  host: 'db.prod.internal',
  port: 5432,
  namespace: 'orders',
  rule_id: 'resource.dsn',
}

describe('RelationshipDrawer typed detail', () => {
  // Not being able to tell an assertion from a guess is what makes people stop
  // trusting a catalog, so the badge is not decoration.
  it('marks a derived edge as derived and a declared one as declared', () => {
    renderDrawer({ selectedEdge: derivedEdge, nodes: [nodeA, nodeB] })
    expect(screen.getByLabelText('Aresta derivada')).toBeInTheDocument()
  })

  it('labels a human-declared edge as declared', () => {
    renderDrawer({ selectedEdge: edge, nodes: [nodeA, nodeB] })
    expect(screen.getByLabelText('Aresta declarada')).toBeInTheDocument()
  })

  // The evidence is what lets a person judge the edge in two seconds — and for the
  // consumption edges it is the only available defence against a repository that
  // mocks its dependency in tests.
  it('shows the rule and the evidence path of a derived edge', () => {
    renderDrawer({ selectedEdge: derivedEdge, nodes: [nodeA, nodeB] })
    expect(screen.getByText('libdep.gomod')).toBeInTheDocument()
    expect(screen.getByText(/go\.mod/)).toBeInTheDocument()
    expect(screen.getByText('v1.2.0')).toBeInTheDocument()
  })

  it('shows the env var behind a consumption edge', () => {
    renderDrawer({ selectedEdge: consumeEdge, nodes: [nodeA, nodeB] })
    expect(screen.getByText('consume.k8s_service_host')).toBeInTheDocument()
    expect(screen.getByText(/k8s\/deployment\.yaml/)).toBeInTheDocument()
    expect(screen.getByText(/ORDERS_URL/)).toBeInTheDocument()
  })

  it('renders the api detail for an api node', () => {
    renderDrawer({ selectedNode: apiNode, nodes: [nodeA, apiNode] })
    expect(screen.getByRole('complementary', { name: 'Detalhes da API' })).toBeInTheDocument()
    expect(screen.getByText(/1\.4\.0/)).toBeInTheDocument()
    expect(screen.getByText('openapi.yaml')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  // A dash, never a zero: the count is withdrawn when `$ref` made it unreliable, and
  // a confident zero for a service with thirty operations looks measured.
  it('renders a dash when the operation count is unavailable', () => {
    const withoutCount: RepositoryGraphNode = { ...apiNode, operation_count: undefined }
    renderDrawer({ selectedNode: withoutCount, nodes: [nodeA, withoutCount] })
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  // Implying a shared database that does not exist is exactly the failure this label
  // prevents.
  it('says a scoped resource is local to its repository', () => {
    renderDrawer({ selectedNode: scopedResourceNode, nodes: [nodeA, scopedResourceNode] })
    expect(screen.getByRole('complementary', { name: 'Detalhes do recurso' })).toBeInTheDocument()
    expect(screen.getByText('Local a este repositório')).toBeInTheDocument()
    expect(screen.getByText('docker-compose.yml')).toBeInTheDocument()
  })

  it('shows the locator of a shared resource', () => {
    renderDrawer({ selectedNode: sharedResourceNode, nodes: [nodeA, sharedResourceNode] })
    expect(screen.getByText('Compartilhado na organização')).toBeInTheDocument()
    expect(screen.getByText('db.prod.internal:5432/orders')).toBeInTheDocument()
  })

  // Declaring a relationship starts from a repository: an API or a resource is
  // derived from a repository's own files, so there is nothing to declare from one.
  it('hides the new-relationship button on an api node', () => {
    renderDrawer({ selectedNode: apiNode, nodes: [nodeA, apiNode], canManage: true })
    expect(screen.queryByText(/Nova relação a partir daqui/)).not.toBeInTheDocument()
  })
})
