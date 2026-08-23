import { RepoProvider, RepositoryMetadata, SyncStatus } from '@/lib/types/repository'

export type RelationshipKind =
  | 'http'
  | 'async'
  | 'library'
  | 'data'
  | 'infra'
  | 'manual'
  | 'other'
  // repo → api (phase 2) and repo → resource (phase 3). Reusing `other` would
  // make the graph unable to say what an edge means, which is the whole point of
  // typing it.
  | 'provides'
  | 'uses'

export const RELATIONSHIP_KINDS: RelationshipKind[] = [
  'http',
  'async',
  'library',
  'data',
  'infra',
  'manual',
  'other',
  'provides',
  'uses',
]

export const RELATIONSHIP_KIND_LABELS: Record<RelationshipKind, string> = {
  http: 'HTTP',
  async: 'Async',
  library: 'Biblioteca',
  data: 'Dados',
  infra: 'Infra',
  manual: 'Manual',
  other: 'Outro',
  provides: 'Expõe',
  uses: 'Usa',
}

/**
 * Kinds a person may declare by hand. `provides` and `uses` are absent on
 * purpose: both are synthesized from the API and resource tables, so offering
 * them in the "new relationship" form would let someone hand-write a second,
 * competing copy of a fact the platform already derives.
 */
export const DECLARABLE_RELATIONSHIP_KINDS: RelationshipKind[] = [
  'http',
  'async',
  'library',
  'data',
  'infra',
  'manual',
  'other',
]

export type RelationshipSource =
  | 'manual'
  | 'analysis'
  | 'manifest'
  | 'import'
  | 'webhook'
  | 'legacy_dependency'
  // Derived from configuration committed in the repository — a compose file, a
  // Kubernetes manifest, a Helm values file.
  | 'config'

export const RELATIONSHIP_SOURCE_LABELS: Record<RelationshipSource, string> = {
  manual: 'Declarada',
  analysis: 'Análise',
  manifest: 'Manifest',
  import: 'Importada',
  webhook: 'Webhook',
  legacy_dependency: 'Dependência legada',
  config: 'Configuração',
}

/** Node kinds, the discriminator of the union below. */
export type GraphNodeKind = 'repo' | 'api' | 'resource'

export const GRAPH_NODE_KINDS: GraphNodeKind[] = ['repo', 'api', 'resource']

export const GRAPH_NODE_KIND_LABELS: Record<GraphNodeKind, string> = {
  repo: 'Repositórios',
  api: 'APIs',
  resource: 'Recursos',
}

/**
 * Node ids arrive prefixed — `repo:<uuid>`, `api:<uuid>`, `resource:<uuid>` —
 * so three tables can share one id namespace without colliding and a click knows
 * where to route. Use `nodeUUID` when the bare id is needed for an API call.
 */
export interface GraphNodeBase {
  id: string
  kind: GraphNodeKind
  name: string
}

export interface RepoGraphNode extends GraphNodeBase {
  kind: 'repo'
  url: string
  type: RepoProvider
  // Optional because the Go side sends these with `omitempty`. Matching the two
  // sides matters: a required TS field against an omitted Go one renders as a
  // silent empty state, which is the bug FOLLOWUPS.md records.
  description?: string
  metadata?: RepositoryMetadata
  sync_status?: SyncStatus
}

export interface ApiGraphNode extends GraphNodeBase {
  kind: 'api'
  spec_kind: 'openapi' | 'asyncapi' | 'graphql' | 'grpc'
  spec_path: string
  repository_id: string
  title?: string
  version?: string
  /**
   * Absent when `$ref` to an external file made the count unreliable. Render a
   * dash for that, never a zero — a confident zero for a service with thirty
   * operations is worse than no number, because it looks measured.
   */
  operation_count?: number
  rule_id?: string
}

export interface ResourceGraphNode extends GraphNodeBase {
  kind: 'resource'
  engine: string
  /**
   * True when the resource belongs to a single repository because the evidence
   * identified an engine and not an instance — a compose image, a Helm subchart.
   * The UI must say "local a este repositório" for these: implying a shared
   * database that does not exist is the failure this flag prevents.
   */
  is_scoped: boolean
  host?: string
  port?: number
  namespace?: string
  repository_id?: string
  rule_id?: string
  evidence?: string[]
}

export type RepositoryGraphNode = RepoGraphNode | ApiGraphNode | ResourceGraphNode

/** Strips the `repo:` / `api:` / `resource:` prefix off a node id. */
export function nodeUUID(id: string): string {
  const separator = id.indexOf(':')
  return separator < 0 ? id : id.slice(separator + 1)
}

export interface RepositoryGraphEdge {
  id: string
  /** Prefixed node ids, not repository ids — an edge can end on an api or a resource. */
  source: string
  target: string
  kind: RelationshipKind
  /**
   * Where the edge came from. Named `provenance` rather than `source` because
   * `source` now means an endpoint; leaving one word meaning two things is how a
   * contract becomes a trap.
   */
  provenance: RelationshipSource
  confidence: number
  label?: string
  description?: string
  /**
   * Present only on a derived edge. The cut between the two visual buckets is
   * exactly whether this is set: a derived edge must never render like a
   * declaration.
   */
  derivation_key?: string
  metadata?: Record<string, unknown>
}

/** True when a person declared this edge rather than a deriver producing it. */
export function isDeclaredEdge(edge: RepositoryGraphEdge): boolean {
  return !edge.derivation_key
}

export interface RepositoryGraphResponse {
  nodes: RepositoryGraphNode[]
  edges: RepositoryGraphEdge[]
}

export interface CreateRepositoryRelationshipRequest {
  source_repository_id: string
  target_repository_id: string
  kind: RelationshipKind
  label?: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface UpdateRepositoryRelationshipRequest {
  kind?: RelationshipKind
  label?: string
  description?: string
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface GetGraphParams {
  repository_id?: string
  kind?: RelationshipKind
  source?: RelationshipSource
  /**
   * Which node types the payload should carry. Omitted means the server's
   * default (repo + api). Resources are off by default because they are the most
   * numerous and least precise layer.
   */
  node_kinds?: GraphNodeKind[]
  /** Hides edges below this confidence. */
  min_confidence?: number
  include_metadata?: boolean
}
