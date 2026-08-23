import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendListDocsForRepo } from '@/lib/api/docs'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'
import { canGenerateDocs } from '@/lib/permissions'
import { RepositoryDocsClient } from './RepositoryDocsClient'

interface RepositoryDocsPageProps {
  params: Promise<{ id: string }>
}

export default async function RepositoryDocsPage({ params }: RepositoryDocsPageProps) {
  const { id } = await params
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await getSessionUser(accessToken)
  if (!user) {
    redirect('/login')
  }

  // `listRepositories` is memoised per request, so this shares the layout's call.
  const [repos, docs] = await Promise.all([
    listRepositories(accessToken),
    backendListDocsForRepo(accessToken, id).catch(() => ({ items: [], total: 0 })),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  return (
    <RepositoryDocsClient
      repo={repo}
      initialDocs={docs.items}
      canGenerate={canGenerateDocs(user)}
    />
  )
}
