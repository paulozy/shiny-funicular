import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { backendGetMe } from '@/lib/api/auth'

async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  if (!accessToken) {
    return false
  }

  try {
    await backendGetMe(accessToken)
    return true
  } catch {
    return false
  }
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (await hasValidSession()) {
    redirect('/')
  }

  return <>{children}</>
}
