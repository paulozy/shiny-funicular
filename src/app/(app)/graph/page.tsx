import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetGraph } from '@/lib/api/graph'
import { GraphClient } from './GraphClient'
import { getSessionUser } from '@/lib/api/request-cache'

export default async function GraphPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await getSessionUser(accessToken)
  if (!user) {
    redirect('/login')
  }

  const graph = await backendGetGraph(accessToken, { include_metadata: true }).catch(() => ({
    nodes: [],
    edges: [],
  }))

  return <GraphClient user={user} initialGraph={graph} />
}
