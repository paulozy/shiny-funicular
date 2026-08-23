import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { backendListContributors } from '@/lib/api/contributors'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'
import { ContributorsClient } from './ContributorsClient'

interface ContributorsPageProps {
  params: Promise<{ id: string }>
}

export default async function ContributorsPage({ params }: ContributorsPageProps) {
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

  const [repos, contributorsResponse] = await Promise.all([
    listRepositories(accessToken),
    backendListContributors(accessToken, id).catch((err) => ({ error: err as Error })),
  ])

  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  const items = 'items' in contributorsResponse ? contributorsResponse.items : []
  const loadError = 'error' in contributorsResponse ? contributorsResponse.error.message : null

  return <ContributorsClient items={items} loadError={loadError} />
}
