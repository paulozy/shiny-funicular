import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetMyOnboarding } from '@/lib/api/onboarding'
import { OnboardingClient } from './OnboardingClient'
import { getSessionUser } from '@/lib/api/request-cache'

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  if (!accessToken) {
    redirect('/login')
  }

  const user = await getSessionUser(accessToken)
  if (!user) {
    redirect('/login')
  }

  // An empty list is a normal state — nobody assigned a flow — and the client
  // renders that case rather than treating it as an error.
  const runs = await backendGetMyOnboarding(accessToken).catch(() => ({ items: [], total: 0 }))

  return <OnboardingClient user={user} initialRuns={runs.items ?? []} />
}
