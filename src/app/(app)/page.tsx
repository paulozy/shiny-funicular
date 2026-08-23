import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetRepositories } from '@/lib/api/repositories'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { backendListPullRequests } from '@/lib/api/pull_requests'
import { RepositoryListResponse } from '@/lib/types/repository'
import { ReviewQueue, ReviewQueueItem } from '@/components/home/ReviewQueue'
import { canReviewPullRequest, hasRole } from '@/lib/permissions'
import { backendListTeams } from '@/lib/api/teams'
import { HomeScope, SCOPE_PARAM, resolveScope, scopeRepositories } from '@/lib/home-scope'
import { T } from '@/lib/tokens'
import { HomeClient } from './HomeClient'
import { getSessionUser } from '@/lib/api/request-cache'

/**
 * How many repositories the review queue is allowed to fan out to.
 *
 * The backend only lists pull requests per repository, so the org-wide queue
 * on the home page costs one request per repository. The cap keeps a large
 * catalog from turning the dashboard into a fan-out of dozens of calls; the
 * repositories touched most recently are the ones people are reviewing.
 */
const REVIEW_QUEUE_REPO_LIMIT = 5
const REVIEW_QUEUE_SIZE = 6

async function getReviewQueue(
  token: string,
  repos: RepositoryListResponse | null
): Promise<ReviewQueueItem[]> {
  const candidates = (repos?.repositories ?? [])
    .filter((repo) => (repo.metadata?.pr_count ?? 0) > 0)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, REVIEW_QUEUE_REPO_LIMIT)

  const lists = await Promise.all(
    candidates.map(async (repo) => {
      const list = await backendListPullRequests(token, repo.id).catch(() => null)
      return (list?.items ?? []).map(({ pull_request: pr }) => ({
        repoId: repo.id,
        repoName: repo.name,
        provider: repo.provider ?? repo.type,
        number: pr.number,
        title: pr.title,
        author: pr.author_login,
        updatedAt: pr.updated_at,
        additions: pr.additions_count,
        deletions: pr.deletions_count,
        changedFiles: pr.changed_files,
        draft: pr.draft,
        reviewDecision: pr.review_decision,
        approvedBy: pr.approved_by,
        changesRequestedBy: pr.changes_requested_by,
      }))
    })
  )

  return lists
    .flat()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, REVIEW_QUEUE_SIZE)
}

/**
 * The queue as its own streamed subtree. Everything above it — the catalog, the
 * decisions, the onboarding card — is already in the first flush; this fills in
 * when the provider answers.
 */
async function ReviewQueueSection({
  token,
  repos,
  canReview,
}: {
  token: string
  repos: RepositoryListResponse | null
  canReview: boolean
}) {
  const items = await getReviewQueue(token, repos)
  return <ReviewQueue items={items} canReview={canReview} />
}

function ReviewQueueFallback() {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${T.border}`,
        borderRadius: T.radius.card,
      }}
    >
      <div
        style={{
          padding: '16px 18px',
          borderBottom: `1px solid ${T.border}`,
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Aguardando sua revisão
      </div>
      <div style={{ padding: '26px 18px', fontSize: 13.5, color: T.faint }}>
        Consultando os provedores…
      </div>
    </section>
  )
}

async function getUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    return null
  }

  try {
    return await getSessionUser(accessToken)
  } catch {
    return null
  }
}

async function getRepositories(token: string) {
  try {
    return await backendGetRepositories(token, { limit: 20, offset: 0 })
  } catch {
    return null
  }
}

async function getOrganizationConfig(token: string, isAdmin: boolean) {
  if (!isAdmin) return null

  try {
    return await backendGetOrganizationConfig(token)
  } catch {
    return null
  }
}

interface HomePageProps {
  // Next 15 hands search params in as a promise.
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const [repos, orgConfig, teams] = await Promise.all([
    accessToken ? getRepositories(accessToken) : Promise.resolve(null),
    accessToken ? getOrganizationConfig(accessToken, user.role === 'admin') : Promise.resolve(null),
    // The catalog filter needs to know which teams are the viewer's. A failure
    // here costs the filter, not the dashboard — it degrades to "Todos".
    accessToken ? backendListTeams(accessToken).catch(() => null) : Promise.resolve(null),
  ])

  const myTeamIds = (teams?.items ?? [])
    .filter((team) => team.viewer_is_member)
    .map((team) => team.id)

  // Role decides the default, not team membership: an admin on no team must
  // still be able to ask for "Meus times" and get an honest empty answer.
  const scope: HomeScope = resolveScope((await searchParams)[SCOPE_PARAM], hasRole(user, 'admin'))
  // Narrowed before anything derives from it — including the review queue,
  // whose per-repository cap must be spent inside the chosen scope.
  const scopedRepos = scopeRepositories(repos, scope, myTeamIds)

  return (
    <HomeClient
      user={user}
      initialRepos={scopedRepos}
      orgConfig={orgConfig}
      scope={scope}
      hasTeams={myTeamIds.length > 0}
      orgIsEmpty={repos === null || repos.total === 0}
      reviewSlot={
        accessToken ? (
          <Suspense fallback={<ReviewQueueFallback />}>
            <ReviewQueueSection
              token={accessToken}
              repos={scopedRepos}
              canReview={canReviewPullRequest(user)}
            />
          </Suspense>
        ) : null
      }
    />
  )
}
