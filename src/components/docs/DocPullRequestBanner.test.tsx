import { render, screen } from '@testing-library/react'
import { DocPullRequestBanner } from './DocPullRequestBanner'

describe('DocPullRequestBanner', () => {
  const base = {
    repoId: 'repo-1',
    pullRequestNumber: 17,
    pullRequestUrl: 'https://github.com/owner/repo/pull/17',
    branch: 'docs/auto-generated-1787455402',
  }

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
})
