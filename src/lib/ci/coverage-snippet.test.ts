import {
  buildGithubEditorURL,
  buildSnippet,
  GITHUB_WORKFLOW_FILENAME,
} from './coverage-snippet'
import { CoverageSetup } from '@/lib/types/coverage'

// js-yaml ships no bundled types and is not a declared dependency here, so it is
// required rather than imported. The parser check is worth the awkwardness: it
// caught a snippet that looked correctly indented and failed to load, because a
// colon-space inside a plain scalar is a mapping key to YAML.
const { load } = require('js-yaml') as { load: (input: string) => unknown }

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

describe('buildSnippet', () => {
  // The rule the whole feature turns on. Of the three inputs, only the token is
  // sensitive; the URL is public and the id is a UUID. Treating all three as
  // secrets is what turned a one-step setup into a three-step one nobody finished.
  it('references exactly one secret and inlines the rest', () => {
    const snippet = buildSnippet({ setup: makeSetup() })!

    const secretRefs = snippet.content.match(/secrets\./g) ?? []
    expect(secretRefs).toHaveLength(1)
    expect(snippet.content).toContain('secrets.IDP_COVERAGE_TOKEN')
    // URL and repository id are literals, so there is nothing else to create.
    expect(snippet.content).toContain('https://idp.example.com/api/v1/repositories/repo-1/coverage')
    expect(snippet.content).not.toContain('secrets.IDP_BASE_URL')
    expect(snippet.content).not.toContain('secrets.IDP_REPOSITORY_ID')
  })

  // Header names come from the payload, which comes from the endpoint's own
  // constants — a snippet naming a header the endpoint does not read fails on
  // every run with a 400.
  it('takes the header names from the payload rather than hardcoding them', () => {
    const setup = makeSetup({
      headers: { format: 'X-Fmt', commit: 'X-Sha', branch: 'X-Br' },
    })
    const snippet = buildSnippet({ setup })!

    expect(snippet.content).toContain('-H "X-Fmt: go"')
    expect(snippet.content).toContain('-H "X-Sha: $GITHUB_SHA"')
    expect(snippet.content).toContain('-H "X-Br: ${GITHUB_REF#refs/heads/}"')
  })

  // The previous snippet was GitHub-only and hardcoded Go, so a GitLab or JS repo
  // got instructions that were silently wrong. The commit/branch variables are
  // where that breaks first.
  it('uses each CI system own commit and branch variables', () => {
    const github = buildSnippet({ setup: makeSetup() })!
    expect(github.content).toContain('$GITHUB_SHA')
    expect(github.content).not.toContain('$CI_COMMIT_SHA')

    const gitlab = buildSnippet({ setup: makeSetup({ provider: 'gitlab' }) })!
    expect(gitlab.content).toContain('$CI_COMMIT_SHA')
    expect(gitlab.content).toContain('$CI_COMMIT_REF_NAME')
    expect(gitlab.content).not.toContain('$GITHUB_SHA')

    const generic = buildSnippet({ setup: makeSetup({ provider: 'gitea' }) })!
    expect(generic.content).toContain('$COMMIT_SHA')
    expect(generic.language).toBe('bash')
  })

  it('honours the selected format and edited report path', () => {
    const snippet = buildSnippet({
      setup: makeSetup(),
      format: 'lcov',
      reportPath: 'packages/web/coverage/lcov.info',
    })!

    expect(snippet.content).toContain('-H "X-Coverage-Format: lcov"')
    expect(snippet.content).toContain('--data-binary @packages/web/coverage/lcov.info')
    // The suggestion must not leak through once overridden.
    expect(snippet.content).not.toContain('coverage.out')
  })

  // `has_ci === false` is a measured "no CI"; undefined means the tree could not
  // be fully inspected. Only the measured case gets a whole file — generating one
  // next to an existing pipeline invites replacing what works.
  it('emits a step when CI exists and a full file only when measured absent', () => {
    const withCI = buildSnippet({ setup: makeSetup({ has_ci: true }) })!
    expect(withCI.kind).toBe('step')
    expect(withCI.filename).toBeUndefined()
    // It points at the file the person has to edit.
    expect(withCI.instruction).toContain('.github/workflows/ci.yml')

    const withoutCI = buildSnippet({ setup: makeSetup({ has_ci: false }) })!
    expect(withoutCI.kind).toBe('file')
    expect(withoutCI.filename).toBe(GITHUB_WORKFLOW_FILENAME)
    expect(withoutCI.content).toContain('actions/checkout@v4')

    // Unknown behaves like "has CI": the conservative choice, because a step is
    // additive and a generated file is not.
    const unknown = buildSnippet({ setup: makeSetup({ has_ci: undefined }) })!
    expect(unknown.kind).toBe('step')
  })

  // A stack with no conventional command must not get an invented one — a blank
  // the person fills in beats a command that does not exist.
  it('leaves a placeholder when there is no test command to suggest', () => {
    const setup = makeSetup({
      has_ci: false,
      suggestion: { format: 'lcov', report_path: 'lcov.info' },
    })
    const snippet = buildSnippet({ setup })!

    expect(snippet.content).toContain('rode seus testes aqui')
    expect(snippet.content).toContain('lcov.info')
  })

  // A repository can carry a config for a CI it does not run — a GitHub-hosted repo
  // with a leftover .gitlab-ci.yml. Naming that file while emitting Actions YAML
  // would send the person to edit the wrong one.
  it('ignores a detected CI config that belongs to another CI system', () => {
    const github = buildSnippet({
      setup: makeSetup({ ci_system: 'ci.gitlab', ci_config_path: '.gitlab-ci.yml' }),
    })!
    expect(github.instruction).not.toContain('.gitlab-ci.yml')

    const gitlab = buildSnippet({
      setup: makeSetup({
        provider: 'gitlab',
        ci_system: 'ci.github_actions',
        ci_config_path: '.github/workflows/ci.yml',
      }),
    })!
    expect(gitlab.instruction).not.toContain('.github/workflows')
    expect(gitlab.instruction).toContain('.gitlab-ci.yml')
  })

  // The most important case. A CI runner cannot reach loopback, so any snippet we
  // emitted would fail on every run. Returning null forces the caller to explain
  // instead of handing out something broken.
  it('returns null when the platform is not reachable', () => {
    expect(buildSnippet({ setup: makeSetup({ reachable: false, ingest_url: undefined }) })).toBeNull()
    // Defensive: reachable but no URL is also unusable.
    expect(buildSnippet({ setup: makeSetup({ ingest_url: undefined }) })).toBeNull()
  })

  // Indentation assertions only approximate the thing that matters. This parses
  // the output with a real YAML parser, so a snippet that looks right and does not
  // load fails here instead of in someone's pipeline.
  it('emits YAML that actually parses', () => {
    const cases: Array<{ name: string; setup: CoverageSetup }> = [
      { name: 'github step', setup: makeSetup({ has_ci: true }) },
      { name: 'github file', setup: makeSetup({ has_ci: false }) },
      { name: 'gitlab job', setup: makeSetup({ provider: 'gitlab', has_ci: true }) },
      { name: 'gitlab file', setup: makeSetup({ provider: 'gitlab', has_ci: false }) },
    ]
    for (const { name, setup } of cases) {
      const snippet = buildSnippet({ setup })!
      expect(snippet.language).toBe('yaml')
      expect(() => load(snippet.content)).not.toThrow()
    }
    void cases
  })

  // The structural half of the same guarantee, with no parser needed: the curl
  // must sit inside a literal block scalar, which is what makes its colons safe.
  it('wraps the GitLab curl in a block scalar', () => {
    const snippet = buildSnippet({ setup: makeSetup({ provider: 'gitlab', has_ci: true }) })!

    const lines = snippet.content.split('\n')
    const curlStart = lines.findIndex((l) => l.includes('curl'))
    expect(lines[curlStart - 1].trim()).toBe('- |')
  })

  it('parses the GitLab job into the expected structure', () => {
    const snippet = buildSnippet({ setup: makeSetup({ provider: 'gitlab', has_ci: true }) })!

    const doc = load(snippet.content) as Record<string, { stage: string; script: string[] }>
    expect(doc['upload-coverage'].stage).toBe('test')
    // The curl folds into a single script entry, which is what makes the
    // continuations legal in the first place.
    const curlEntry = doc['upload-coverage'].script.find((line) => line.includes('curl'))
    expect(curlEntry).toContain('https://idp.example.com/api/v1/repositories/repo-1/coverage')
    expect(curlEntry).toContain('$CI_COMMIT_SHA')
  })

  it('parses the GitHub step into a usable job entry', () => {
    const snippet = buildSnippet({ setup: makeSetup({ has_ci: true }) })!

    // A step is a YAML list item, so it loads as a one-element array.
    const steps = load(snippet.content) as Array<Record<string, unknown>>
    expect(Array.isArray(steps)).toBe(true)
    expect(steps[0].name).toBe('Upload coverage to IDP')
    expect(steps[0].if).toBe('always()')
    expect(String(steps[0].run)).toContain('$GITHUB_SHA')
  })

})

describe('buildGithubEditorURL', () => {
  // No token and no permission: the commit is made by the viewer's own GitHub
  // session, with their own attribution. This is Dependabot's mechanism.
  it('pre-fills the GitHub editor when there is no CI', () => {
    const setup = makeSetup({ has_ci: false })
    const snippet = buildSnippet({ setup })!

    const url = buildGithubEditorURL(setup, snippet, 'org/web')!

    expect(url).toContain('https://github.com/org/web/new/main?')
    expect(url).toContain(`filename=${encodeURIComponent(GITHUB_WORKFLOW_FILENAME)}`)
    // The content rides in the query string, which is what makes the editor open
    // pre-filled rather than blank.
    expect(decodeURIComponent(url)).toContain('actions/checkout@v4')
  })

  // With an existing pipeline the honest action is "paste this step". Offering a
  // whole file invites running the tests twice or replacing what works.
  it('offers no editor link when the repository already has CI', () => {
    const setup = makeSetup({ has_ci: true })
    const snippet = buildSnippet({ setup })!

    expect(buildGithubEditorURL(setup, snippet, 'org/web')).toBeNull()
  })

  // GitLab's editor ignores the content parameter (gitlab-org/gitlab#594214), so
  // the button would open an empty file and look broken.
  it('offers no editor link on GitLab', () => {
    const setup = makeSetup({ provider: 'gitlab', has_ci: false })
    const snippet = buildSnippet({ setup })!

    expect(buildGithubEditorURL(setup, snippet, 'org/web')).toBeNull()
  })

  it('refuses a full name that is not owner/repo', () => {
    const setup = makeSetup({ has_ci: false })
    const snippet = buildSnippet({ setup })!

    expect(buildGithubEditorURL(setup, snippet, 'web')).toBeNull()
  })
})
