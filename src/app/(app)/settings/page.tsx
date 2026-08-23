import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { SettingsClient } from './SettingsClient'
import { getSessionUser, listRepositories } from '@/lib/api/request-cache'

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

async function getOrganizationConfig(accessToken: string) {
  try {
    return await backendGetOrganizationConfig(accessToken)
  } catch {
    return null
  }
}

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const [orgConfig, repos] = await Promise.all([
    accessToken && user.role === 'admin' ? getOrganizationConfig(accessToken) : Promise.resolve(null),
    accessToken ? listRepositories(accessToken) : Promise.resolve(null),
  ])

  return <SettingsClient user={user} initialConfig={orgConfig} repos={repos} />
}
