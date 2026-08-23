import { render, screen, waitFor } from '@testing-library/react'
import { DocPullRequestBanner } from './DocPullRequestBanner'
import { apiFetch } from '@/lib/api/client'

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
}))

/**
 * The banner asks the host whether the pull request is still open, because
 * `doc_generations` records the url and number at creation and nothing ever
 * revisits them. `state` is only ever `open` or `closed` — both hosts report a
 * merged pull request as closed with `merged_at` set — so these fixtures mirror
 * that rather than the `merged` variant the type allows but the API never sends.
 */
function mockPR(pr: { state: string; merged_at?: string } | Error) {
  if (pr instanceof Error) {
    ;(apiFetch as jest.Mock).mockRejectedValue(pr)
    return
  }
  ;(apiFetch as jest.Mock).mockResolvedValue(pr)
}

describe('DocPullRequestBanner', () => {
  const base = {
    repoId: 'repo-1',
    pullRequestNumber: 17,
    pullRequestUrl: 'https://github.com/owner/repo/pull/17',
    branch: 'docs/auto-generated-1787455402',
  }

  beforeEach(() => {
    ;(apiFetch as jest.Mock).mockReset()
    // An open pull request is the state the pre-existing assertions describe.
    mockPR({ state: 'open' })
  })

  // Reviewing the diff happens in the app now — the PR page renders it and
  // carries the approve / request-changes actions.
  it('leads with the in-app review link', () => {
    render(<DocPullRequestBanner {...base} provider="github" />)

    const inApp = screen.getByRole('link', { name: /Revisar aqui/ })
    expect(inApp).toHaveAttribute('href', '/code/repositories/repo-1/pull-requests/17')
  })

  // The provider link stays because the platform cannot merge — there is no
  // merge capability on scm.Provider, so the last step only exists on the host.
  it('keeps the provider link for what the app cannot do', () => {
    render(<DocPullRequestBanner {...base} provider="github" />)

    expect(screen.getByRole('link', { name: /Abrir no provedor/ })).toHaveAttribute(
      'href',
      base.pullRequestUrl
    )
  })

  it('shows the number and the generated branch', () => {
    render(<DocPullRequestBanner {...base} provider="github" />)

    expect(screen.getByText(/PR #17/)).toBeInTheDocument()
    expect(screen.getByText(/docs\/auto-generated-1787455402/)).toBeInTheDocument()
  })

  // It said "aberta no GitHub" unconditionally, which was wrong for every
  // GitLab repository.
  it('names the actual host', () => {
    const { rerender } = render(<DocPullRequestBanner {...base} provider="github" />)
    expect(screen.getByText(/aberto no GitHub/)).toBeInTheDocument()

    rerender(<DocPullRequestBanner {...base} provider="gitlab" />)
    expect(screen.getByText(/aberto no GitLab/)).toBeInTheDocument()
    expect(screen.queryByText(/GitHub/)).not.toBeInTheDocument()
  })

  it('falls back to a host-neutral phrase that still reads as Portuguese', () => {
    render(<DocPullRequestBanner {...base} />)
    expect(screen.getByText(/aberto no provedor/)).toBeInTheDocument()
  })

  // A generation from before the number was recorded still deserves the
  // provider link; it just cannot be routed to in-app.
  it('offers only the provider link when the number is unknown', () => {
    render(<DocPullRequestBanner repoId="repo-1" pullRequestUrl={base.pullRequestUrl} />)

    expect(screen.queryByRole('link', { name: /Revisar aqui/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir no provedor/ })).toBeInTheDocument()
  })

  it('renders nothing without a pull request', () => {
    const { container } = render(<DocPullRequestBanner repoId="repo-1" />)
    expect(container).toBeEmptyDOMElement()
  })

  // ── state, which the row cannot know ───────────────────────────────────────

  // The bug this fixes: `doc_generations` never learns that the pull request
  // landed — the webhook processor ignores `pull_request` events entirely — so
  // the banner asked people to review something already merged, forever.
  it('disappears once the pull request is merged', async () => {
    mockPR({ state: 'closed', merged_at: '2026-08-23T22:31:29Z' })
    const { container } = render(<DocPullRequestBanner {...base} provider="github" />)

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  // Both hosts report a merged pull request as `closed` with `merged_at` set, so
  // reading the state alone would call it "fechada sem merge" — the opposite of
  // what happened.
  it('does not mistake a merged pull request for an abandoned one', async () => {
    mockPR({ state: 'closed', merged_at: '2026-08-23T22:31:29Z' })
    render(<DocPullRequestBanner {...base} provider="github" />)

    await waitFor(() => {
      expect(screen.queryByText(/fechada sem merge/)).not.toBeInTheDocument()
    })
  })

  // Closed without merging means the documentation never landed. Hiding that
  // would hide a failure; the old banner made it look still-pending.
  it('says so when the pull request was closed without merging', async () => {
    mockPR({ state: 'closed' })
    render(<DocPullRequestBanner {...base} provider="github" />)

    expect(await screen.findByText(/fechada sem merge/)).toBeInTheDocument()
    expect(screen.getByText(/não foi aplicada/)).toBeInTheDocument()
    // The links stay: the diff is still worth reading, and re-opening happens
    // on the host.
    expect(screen.getByRole('link', { name: /Abrir no provedor/ })).toBeInTheDocument()
  })

  // Defensive: the type allows `merged` even though the API does not send it.
  it('also hides on an explicit merged state', async () => {
    mockPR({ state: 'merged' })
    const { container } = render(<DocPullRequestBanner {...base} provider="github" />)

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('keeps showing an open pull request', async () => {
    mockPR({ state: 'open' })
    render(<DocPullRequestBanner {...base} provider="github" />)

    expect(await screen.findByText(/aberto no GitHub/)).toBeInTheDocument()
  })

  // Never hide on uncertainty. Hiding a pull request that is genuinely still
  // waiting is worse than showing one that has already landed.
  it('keeps the banner when the state cannot be determined', async () => {
    mockPR(new Error('provider unavailable'))
    render(<DocPullRequestBanner {...base} provider="github" />)

    expect(await screen.findByText(/PR #17/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Abrir no provedor/ })).toBeInTheDocument()
  })

  // Without a number there is nothing to ask about, so it must not fire a
  // request that would 404.
  it('asks nothing when there is no pull request number', async () => {
    render(<DocPullRequestBanner repoId="repo-1" pullRequestUrl={base.pullRequestUrl} />)

    await waitFor(() => expect(screen.getByText(/Pull request/)).toBeInTheDocument())
    expect(apiFetch).not.toHaveBeenCalled()
  })
})
