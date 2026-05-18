import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetRepositories } from '@/lib/api/repositories'
import {
  backendListDocsForRepo,
  backendListOrgDocs,
  backendGetDoc,
} from '@/lib/api/docs'
import { DocsRepoClient } from './DocsRepoClient'
import { DocsOrgClient } from './DocsOrgClient'
import {
  DocGenerationDetail,
  DocGenerationListResponse,
} from '@/lib/types/docs'

interface DocsPageProps {
  searchParams: Promise<{ scope?: string; repo?: string; doc?: string }>
}

export default async function DocsPage({ searchParams }: DocsPageProps) {
  const { scope, repo, doc } = await searchParams
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  // Tab dispatcher: ?scope=org renders the org view, anything else (default)
  // renders the per-repo view to preserve the legacy URL semantics.
  if (scope === 'org') {
    const orgDocs = await backendListOrgDocs(accessToken).catch(
      () => ({ items: [], total: 0 } as DocGenerationListResponse)
    )

    // Pick the doc to focus by query param OR fall back to the first item.
    const focusID = doc || orgDocs.items[0]?.id || null
    let initialDocDetail: DocGenerationDetail | null = null
    if (focusID) {
      initialDocDetail = await backendGetDoc(accessToken, focusID).catch(() => null)
    }

    return (
      <DocsOrgClient
        user={user}
        initialDocs={orgDocs}
        initialDocDetail={initialDocDetail}
      />
    )
  }

  const repos = await backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => ({
    repositories: [],
    total: 0,
    limit: 100,
    offset: 0,
  }))
  const selectedRepoId = repo || repos.repositories[0]?.id || null

  let initialDocs: DocGenerationListResponse = { items: [], total: 0 }
  if (selectedRepoId) {
    initialDocs = await backendListDocsForRepo(accessToken, selectedRepoId).catch(() => ({
      items: [],
      total: 0,
    }))
  }

  return (
    <DocsRepoClient
      user={user}
      repos={repos.repositories}
      initialSelectedRepoId={selectedRepoId}
      initialDocs={initialDocs}
    />
  )
}
