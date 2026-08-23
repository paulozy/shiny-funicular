import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { canAssignRepositoryOwner, canConfigureOrganization, canManageCoverageTokens } from '@/lib/permissions'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { RepositorySettingsClient } from './RepositorySettingsClient'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'

interface RepositorySettingsPageProps {
  params: Promise<{ id: string }>
}

export default async function RepositorySettingsPage({ params }: RepositorySettingsPageProps) {
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

  const [repos, orgConfig] = await Promise.all([
    listRepositories(accessToken),
    canConfigureOrganization(user) ? backendGetOrganizationConfig(accessToken).catch(() => null) : Promise.resolve(null),
  ])
  const repo = repos?.repositories.find((item) => item.id === id)
  if (!repo) {
    notFound()
  }

  return (
    <RepositorySettingsClient
      repo={repo}
      orgConfig={orgConfig}
      canManageCoverageTokens={canManageCoverageTokens(user)}
      canAssignOwner={canAssignRepositoryOwner(user)}
    />
  )
}
