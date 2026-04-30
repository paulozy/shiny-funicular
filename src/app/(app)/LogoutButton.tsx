'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  return (
    <Button variant="default" onClick={handleLogout}>
      Sair
    </Button>
  )
}
