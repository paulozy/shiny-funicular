import { cookies } from 'next/headers'
import { COOKIE_SIDEBAR_STATE } from '@/lib/auth/edge-cookies'
import { CoPensadorScopeProvider } from '@/components/shell/CoPensadorScopeProvider'
import {
  SidebarMode,
  SidebarPreferenceProvider,
} from '@/components/shell/SidebarPreferenceProvider'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Read the sidebar preference cookie on the server so SSR and the first
  // client render emit the same markup (no hydration mismatch).
  const cookieStore = await cookies()
  const stored = cookieStore.get(COOKIE_SIDEBAR_STATE)?.value
  const initialMode: SidebarMode = stored === 'collapsed' ? 'collapsed' : 'expanded'

  return (
    <SidebarPreferenceProvider initialMode={initialMode}>
      <CoPensadorScopeProvider>{children}</CoPensadorScopeProvider>
    </SidebarPreferenceProvider>
  )
}
