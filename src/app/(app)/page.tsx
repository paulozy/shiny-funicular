import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendGetRepositories } from '@/lib/api/repositories'
import { backendGetOrganizationConfig } from '@/lib/api/organization'
import { HomeClient } from './HomeClient'

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

export default async function HomePage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  const [repos, orgConfig] = await Promise.all([
    accessToken ? getRepositories(accessToken) : Promise.resolve(null),
    accessToken ? getOrganizationConfig(accessToken, user.role === 'admin') : Promise.resolve(null),
  ])

  return <HomeClient user={user} initialRepos={repos} orgConfig={orgConfig} />
}
