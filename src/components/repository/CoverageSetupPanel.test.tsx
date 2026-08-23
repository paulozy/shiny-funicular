import { render, screen, waitFor } from '@testing-library/react'
import { CoverageSetupPanel } from './CoverageSetupPanel'
import { apiFetch } from '@/lib/api/client'
import { CoverageSetup } from '@/lib/types/coverage'
import { RepositoryResponse } from '@/lib/types/repository'

jest.mock('@/lib/api/client', () => ({
  apiFetch: jest.fn(),
}))

const repo: RepositoryResponse = {
  id: 'repo-1',
  name: 'web',
  full_name: 'org/web',
  url: 'https://github.com/org/web',
  provider: 'github',
  is_private: false,
  organization_id: 'org-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

function makeSetup(overrides: Partial<CoverageSetup> = {}): CoverageSetup {
  return {
    base_url: 'https://idp.example.com',
    ingest_url: 'https://idp.example.com/api/v1/repositories/repo-1/coverage',
    repository_id: 'repo-1',
    reachable: true,
    provider: 'github',
    has_ci: true,
    ci_system: 'ci.github_actions',
    ci_config_path: '.github/workflows/ci.yml',
    default_branch: 'main',
    suggestion: {
      language: 'go',
      format: 'go',
      report_path: 'coverage.out',
      test_command: 'go test ./... -coverprofile=coverage.out',
    },
    formats: ['go', 'lcov', 'cobertura', 'jacoco'],
    secret_env_name: 'IDP_COVERAGE_TOKEN',
    headers: {
      format: 'X-Coverage-Format',
      commit: 'X-Commit-SHA',
      branch: 'X-Coverage-Branch',
    },
    has_active_token: true,
    ...overrides,
  }
}

function mockSetup(setup: unknown) {
  ;(apiFetch as jest.Mock).mockResolvedValue(setup)
}

function renderPanel(props: Partial<React.ComponentProps<typeof CoverageSetupPanel>> = {}) {
  return render(<CoverageSetupPanel repo={repo} hasToken={true} {...props} />)
}

beforeEach(() => {
  ;(apiFetch as jest.Mock).mockReset()
})

describe('CoverageSetupPanel', () => {
  // The value the old panel never showed. It printed the *name* `IDP_BASE_URL` and
  // left the person to guess what to put in it, which is why the whole coverage
  // feature shipped and stayed off.
  it('shows the resolved IDP URL and names the single secret', async () => {
    mockSetup(makeSetup())
    renderPanel()

    expect(await screen.findByText('https://idp.example.com')).toBeInTheDocument()
    expect(screen.getByText('IDP_COVERAGE_TOKEN')).toBeInTheDocument()
    expect(screen.getByText(/único secret necessário/i)).toBeInTheDocument()
  })

  it('renders the snippet with the URL and repository id already filled in', async () => {
    mockSetup(makeSetup())
    renderPanel()

    const snippet = await screen.findByText(/curl --fail-with-body/)
    expect(snippet.textContent).toContain(
      'https://idp.example.com/api/v1/repositories/repo-1/coverage'
    )
    expect(snippet.textContent).toContain('secrets.IDP_COVERAGE_TOKEN')
  })

  // The most important state. A CI runner cannot resolve loopback, so a snippet
  // pointing at it fails on every run — and the person has no way to know why.
  // No snippet at all, plus the reason.
  it('renders no snippet and explains why when the platform is unreachable', async () => {
    mockSetup(makeSetup({ reachable: false, ingest_url: undefined, base_url: undefined }))
    renderPanel()

    expect(await screen.findByText(/não tem uma URL pública configurada/i)).toBeInTheDocument()
    expect(screen.getByText(/WEBHOOK_BASE_URL/)).toBeInTheDocument()
    expect(screen.queryByText(/curl --fail-with-body/)).not.toBeInTheDocument()
  })

  // The feedback loop that existed nowhere: the upload step is guarded to skip
  // silently when a secret is missing, so a botched setup was invisible.
  it('says the token was never used', async () => {
    mockSetup(makeSetup({ last_upload_at: null }))
    renderPanel()

    expect(await screen.findByText(/nunca foi usado/i)).toBeInTheDocument()
  })

  it('confirms when an upload has arrived', async () => {
    mockSetup(makeSetup({ last_upload_at: '2026-08-23T12:00:00Z' }))
    renderPanel()

    expect(await screen.findByText(/Último upload recebido/i)).toBeInTheDocument()
    expect(screen.queryByText(/nunca foi usado/i)).not.toBeInTheDocument()
  })

  it('asks for a token first when there is none', async () => {
    mockSetup(makeSetup({ has_active_token: false }))
    renderPanel({ hasToken: false })

    expect(await screen.findByText(/Crie um token acima/i)).toBeInTheDocument()
  })

  // No token and no permission: the commit is made by the viewer's own GitHub
  // session. Offered only where creating a file is safe.
  it('offers the GitHub editor link only when no CI was detected', async () => {
    mockSetup(makeSetup({ has_ci: false }))
    const { unmount } = renderPanel()

    const link = await screen.findByRole('link', { name: /Abrir editor no GitHub/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('github.com/org/web/new/main'))
    unmount()

    mockSetup(makeSetup({ has_ci: true }))
    renderPanel()
    await screen.findByText(/curl --fail-with-body/)
    expect(screen.queryByRole('link', { name: /Abrir editor no GitHub/i })).not.toBeInTheDocument()
  })

  // GitLab's editor ignores the content parameter, so the button would open an
  // empty file and look broken.
  it('offers no editor link on GitLab but still renders a snippet', async () => {
    mockSetup(makeSetup({ provider: 'gitlab', has_ci: false }))
    renderPanel()

    await screen.findByText(/upload-coverage:/)
    expect(screen.queryByRole('link', { name: /Abrir editor/i })).not.toBeInTheDocument()
  })

  it('offers only formats the endpoint accepts', async () => {
    mockSetup(makeSetup())
    renderPanel()

    const select = (await screen.findByLabelText('Formato do relatório')) as HTMLSelectElement
    expect([...select.options].map((o) => o.value)).toEqual([
      'go',
      'lcov',
      'cobertura',
      'jacoco',
    ])
    expect(select.value).toBe('go')
  })

  // The report path is a suggestion, and monorepos are why it has to stay
  // editable rather than being presented as fact.
  it('presents the report path as an editable suggestion', async () => {
    mockSetup(makeSetup())
    renderPanel()

    const input = (await screen.findByLabelText('Caminho do relatório')) as HTMLInputElement
    expect(input.value).toBe('coverage.out')
    expect(screen.getByText(/Sugestão/i)).toBeInTheDocument()
    // And it says why it guessed that, rather than appearing to know.
    expect(screen.getByText(/Detectado: go/i)).toBeInTheDocument()
  })

  // The panel sits inside the settings page; an unexpected payload crashing it
  // would take the token list down with it.
  it('shows an error instead of throwing on a malformed payload', async () => {
    mockSetup({ nonsense: true })
    renderPanel()

    expect(await screen.findByText(/formato inesperado/i)).toBeInTheDocument()
  })

  it('shows an error when the request fails', async () => {
    ;(apiFetch as jest.Mock).mockRejectedValue(new Error('boom'))
    renderPanel()

    await waitFor(() => expect(screen.getByText('boom')).toBeInTheDocument())
  })
})
