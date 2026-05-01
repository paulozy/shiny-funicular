import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { backendGetRepositories } from '@/lib/api/repositories'
import { SettingsClient } from './SettingsClient'

async function getUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    return null
  }

  try {
    return await backendGetMe(accessToken)
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
    accessToken ? backendGetRepositories(accessToken, { limit: 100, offset: 0 }).catch(() => null) : Promise.resolve(null),
  ])

  return <SettingsClient user={user} initialConfig={orgConfig} repos={repos} />
}
