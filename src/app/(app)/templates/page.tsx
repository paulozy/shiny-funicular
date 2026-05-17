import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'
import { backendListTemplates } from '@/lib/api/templates'
import { TemplatesClient } from './TemplatesClient'

export default async function TemplatesPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    redirect('/login')
  }

  const user = await backendGetMe(accessToken).catch(() => null)
  if (!user) {
    redirect('/login')
  }

  const initialTemplates = await backendListTemplates(accessToken, { limit: 50, offset: 0 }).catch(() => ({
    templates: [],
    total: 0,
    limit: 50,
    offset: 0,
  }))

  return <TemplatesClient user={user} initialTemplates={initialTemplates} />
}
