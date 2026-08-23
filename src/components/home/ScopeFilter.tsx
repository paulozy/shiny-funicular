'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Segmented } from '@/components/ui/Segmented'
import { HomeScope, SCOPE_PARAM } from '@/lib/home-scope'

interface ScopeFilterProps {
  scope: HomeScope
}

/**
 * The dashboard's scope: the whole organization, or only the teams the viewer
 * belongs to.
 *
 * Admins default to the whole organization; everyone else to their own teams.
 *
 * It lives at page level rather than inside the repository card because it
 * governs everything below it — the catalog, the decisions and the review
 * queue all answer to it. A control that sat inside one card while silently
 * moving the contents of another would be lying about its reach.
 *
 * State is a URL parameter, not React state, for one load-bearing reason: the
 * review queue is assembled on the server and capped at a handful of
 * repositories. Filtering it in the browser would filter *after* that cap, so
 * "Meus times" could hide pull requests that were simply never fetched. Putting
 * the scope in the URL lets the server narrow the catalog before it picks which
 * repositories to ask about — and makes the view shareable and reload-safe.
 */
export function ScopeFilter({ scope }: ScopeFilterProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Segmented
      name="home-scope"
      ariaLabel="Escopo do painel"
      value={scope}
      onChange={(next) => {
        startTransition(() => {
          // Always explicit: the default depends on the viewer's role, so an
          // absent parameter would mean different things to different people
          // and a shared link would not show what the sender saw.
          router.push(`/?${SCOPE_PARAM}=${next}`)
        })
      }}
      style={pending ? { opacity: 0.6 } : undefined}
      // Narrowest first: it is the default for everyone except admins, and the
      // one most people want.
      options={[
        { value: 'mine', label: 'Meus times' },
        { value: 'all', label: 'Toda a organização' },
      ]}
    />
  )
}
