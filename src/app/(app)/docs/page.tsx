import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetRepositories } from '@/lib/api/repositories'
import { backendListDocsForRepo } from '@/lib/api/docs'
import { DocsClient } from './DocsClient'
import { DocGenerationListResponse } from '@/lib/types/docs'

interface DocsPageProps {
  searchParams: Promise<{ repo?: string }>
}

export default async function DocsPage({ searchParams }: DocsPageProps) {
  const { repo } = await searchParams
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  const repos = await backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => ({
    repositories: [],
    total: 0,
    limit: 100,
    offset: 0,
  }))

  // Pick a default repo if the query param is missing.
  const selectedRepoId = repo || repos.repositories[0]?.id || null

  let initialDocs: DocGenerationListResponse = { items: [], total: 0 }
  if (selectedRepoId) {
    initialDocs = await backendListDocsForRepo(accessToken, selectedRepoId).catch(() => ({
      items: [],
      total: 0,
    }))
  }

  return (
    <DocsClient
      user={user}
      repos={repos.repositories}
      initialSelectedRepoId={selectedRepoId}
      initialDocs={initialDocs}
    />
  )
}
