import { CoverageSetup } from '@/lib/types/coverage'

/**
 * Generates the CI snippet that uploads a coverage report to the platform.
 *
 * Three rules govern everything here.
 *
 * **One secret.** Of the three inputs the upload needs, only the token is
 * sensitive. The ingest URL is public and the repository id is a UUID, so both go
 * in as literals. Treating all three as secrets is what turned a one-step setup
 * into a three-step one that nobody finished.
 *
 * **Per provider, or not at all.** The commit SHA and branch come from different
 * variables on every CI (`GITHUB_SHA` vs `CI_COMMIT_SHA`), so a single snippet is
 * silently wrong somewhere. The previous one was GitHub-only and hardcoded Go.
 *
 * **Never invent the parts we do not know.** The test command and report path are
 * suggestions the caller can edit; the header names come from the API payload, so
 * a snippet cannot name a header the endpoint does not read.
 */

export type SnippetKind = 'step' | 'file' | 'script'

export interface Snippet {
  kind: SnippetKind
  /** For syntax highlighting and the copy button's label. */
  language: 'yaml' | 'bash'
  content: string
  /** Set only for `kind: 'file'` — where the file should be created. */
  filename?: string
  /** A one-line instruction for what to do with this. */
  instruction: string
}

export interface SnippetOptions {
  setup: CoverageSetup
  /** The selected format; defaults to the suggestion. */
  format?: string
  /** The edited report path; defaults to the suggestion. */
  reportPath?: string
}

/** The workflow file the GitHub path creates when a repository has no CI yet. */
export const GITHUB_WORKFLOW_FILENAME = '.github/workflows/coverage.yml'

/**
 * buildSnippet returns null when no correct snippet can be produced.
 *
 * That happens when the platform has no publicly reachable URL: a CI runner could
 * not resolve it, so any snippet we emitted would fail on every run. Returning
 * null forces the caller to explain instead of handing out something broken —
 * which is exactly the failure mode that left this feature switched off.
 */
export function buildSnippet(options: SnippetOptions): Snippet | null {
  const { setup } = options
  if (!setup.reachable || !setup.ingest_url) return null

  const format = options.format || setup.suggestion.format
  const reportPath = options.reportPath || setup.suggestion.report_path
  const parts: UploadParts = {
    ingestURL: setup.ingest_url,
    secretEnvName: setup.secret_env_name,
    headers: setup.headers,
    format,
    reportPath,
    testCommand: setup.suggestion.test_command,
  }

  switch (setup.provider) {
    case 'github':
      // `has_ci === false` is a measured "no CI here"; undefined means the tree
      // could not be fully inspected. Only the measured case gets a whole file —
      // generating one for a repository that already has a pipeline risks talking
      // someone into replacing theirs.
      return setup.has_ci === false ? githubWorkflowFile(parts) : githubStep(parts, setup)
    case 'gitlab':
      return gitlabJob(parts, setup)
    default:
      // gitea and custom. Not a second-class fallback: the upload is a plain HTTP
      // POST, so a provider-neutral script is the correct answer for a host whose
      // CI we cannot know.
      return genericScript(parts)
  }
}

interface UploadParts {
  ingestURL: string
  secretEnvName: string
  headers: { format: string; commit: string; branch: string }
  format: string
  reportPath: string
  testCommand?: string
}

/** The commit and branch expressions, which are what differ per CI. */
interface CIVars {
  commit: string
  branch: string
}

/**
 * curlLines renders the upload command.
 *
 * `firstIndent` differs from `indent` so the same builder serves a YAML block
 * scalar (both the same) and a YAML list item (`    - ` then `      `). Doing it
 * here beats post-processing the string with a regex, which was the first attempt
 * and broke the moment a header value contained the pattern.
 */
function curlLines(parts: UploadParts, vars: CIVars, indent: string, firstIndent = indent): string {
  const lines = [
    `curl --fail-with-body -X POST \\`,
    `  "${parts.ingestURL}" \\`,
    `  -H "Authorization: Bearer $${parts.secretEnvName}" \\`,
    `  -H "${parts.headers.format}: ${parts.format}" \\`,
    `  -H "${parts.headers.commit}: ${vars.commit}" \\`,
    `  -H "${parts.headers.branch}: ${vars.branch}" \\`,
    `  -H "Content-Type: application/octet-stream" \\`,
    `  --data-binary @${parts.reportPath}`,
  ]
  return lines.map((line, i) => (i === 0 ? firstIndent : indent) + line).join('\n')
}

const GITHUB_VARS: CIVars = { commit: '$GITHUB_SHA', branch: '${GITHUB_REF#refs/heads/}' }
const GITLAB_VARS: CIVars = { commit: '$CI_COMMIT_SHA', branch: '$CI_COMMIT_REF_NAME' }
const GENERIC_VARS: CIVars = { commit: '$COMMIT_SHA', branch: '$BRANCH' }

/**
 * configPathFor returns the detected CI config path only when it belongs to the
 * CI system we are generating for.
 *
 * A repository can carry a config for a CI it does not run — a GitHub-hosted repo
 * with a leftover `.gitlab-ci.yml`, say. Naming that file while emitting GitHub
 * Actions YAML sends the person to edit the wrong file, so an unrelated detection
 * is treated as no detection.
 */
function configPathFor(setup: CoverageSetup, expectedSystem: string): string | undefined {
  if (setup.ci_system !== expectedSystem) return undefined
  return setup.ci_config_path || undefined
}

function githubStep(parts: UploadParts, setup: CoverageSetup): Snippet {
  const configPath = configPathFor(setup, 'ci.github_actions')
  const where = configPath ? ` em \`${configPath}\`` : ''
  return {
    kind: 'step',
    language: 'yaml',
    instruction: `Cole este step no job que roda seus testes${where}, depois do passo de teste.`,
    content: [
      `- name: Upload coverage to IDP`,
      // The upload is worth attempting even when the test step failed: partial
      // coverage from a red build is still the truth about that commit.
      `  if: always()`,
      `  env:`,
      `    ${parts.secretEnvName}: \${{ secrets.${parts.secretEnvName} }}`,
      `  run: |`,
      curlLines(parts, GITHUB_VARS, '    '),
    ].join('\n'),
  }
}

function githubWorkflowFile(parts: UploadParts): Snippet {
  const testCommand = parts.testCommand || '# rode seus testes aqui, gerando ' + parts.reportPath
  return {
    kind: 'file',
    language: 'yaml',
    filename: GITHUB_WORKFLOW_FILENAME,
    instruction: 'Nenhum CI detectado. Crie este arquivo no repositório.',
    content: [
      `name: Coverage`,
      ``,
      `on:`,
      `  push:`,
      `  pull_request:`,
      ``,
      `jobs:`,
      `  coverage:`,
      `    runs-on: ubuntu-latest`,
      `    steps:`,
      `      - uses: actions/checkout@v4`,
      ``,
      `      - name: Test with coverage`,
      `        run: ${testCommand}`,
      ``,
      `      - name: Upload coverage to IDP`,
      `        if: always()`,
      `        env:`,
      `          ${parts.secretEnvName}: \${{ secrets.${parts.secretEnvName} }}`,
      `        run: |`,
      curlLines(parts, GITHUB_VARS, '          '),
    ].join('\n'),
  }
}

function gitlabJob(parts: UploadParts, setup: CoverageSetup): Snippet {
  const hasCI = setup.has_ci === true
  const testCommand = parts.testCommand || `# rode seus testes aqui, gerando ${parts.reportPath}`
  return {
    kind: hasCI ? 'step' : 'file',
    language: 'yaml',
    filename: hasCI ? undefined : '.gitlab-ci.yml',
    instruction: hasCI
      ? `Cole este job em \`${configPathFor(setup, 'ci.gitlab') || '.gitlab-ci.yml'}\`.`
      : 'Nenhum CI detectado. Crie o `.gitlab-ci.yml` com este job.',
    content: [
      `upload-coverage:`,
      `  stage: test`,
      `  script:`,
      `    - ${testCommand}`,
      // `- |` and not a plain multi-line entry. The curl contains
      // `-H "Authorization: Bearer …"`, and a colon-space inside a plain scalar is
      // a mapping key to YAML — the file fails to parse before the job ever runs.
      // A literal block scalar makes the whole command opaque, which is also how
      // multi-line commands are conventionally written in GitLab CI. GitHub avoids
      // this for free because `run: |` is already a block.
      `    - |`,
      curlLines(parts, GITLAB_VARS, '      '),
    ].join('\n'),
  }
}

function genericScript(parts: UploadParts): Snippet {
  return {
    kind: 'script',
    language: 'bash',
    instruction:
      'Rode isto no seu CI depois dos testes. ' +
      `Defina ${parts.secretEnvName}, COMMIT_SHA e BRANCH conforme o seu runner.`,
    content: curlLines(parts, GENERIC_VARS, ''),
  }
}

/**
 * buildGithubEditorURL builds a link that opens GitHub's new-file editor
 * pre-filled with the generated workflow.
 *
 * The point is that it needs no token and no permission: the commit is made by the
 * viewer's own GitHub session, with their own attribution. It is the mechanism
 * behind Dependabot's "Create config file" button.
 *
 * `fullName` (`owner/repo`) is passed in rather than inferred — the setup payload
 * does not carry it and guessing it from the base URL would be wrong.
 *
 * Returns null unless this is a GitHub repository with no CI detected. With an
 * existing pipeline the honest action is "paste this step", because dropping a
 * whole generated file next to someone's CI invites running the tests twice.
 *
 * GitLab is deliberately absent: its editor ignores the content parameter
 * (gitlab-org/gitlab#594214), so the button would open an empty file and look
 * broken.
 */
export function buildGithubEditorURL(
  setup: CoverageSetup,
  snippet: Snippet | null,
  fullName: string
): string | null {
  if (setup.provider !== 'github' || setup.has_ci !== false) return null
  if (!snippet || snippet.kind !== 'file' || !snippet.filename) return null
  if (!fullName.includes('/')) return null

  const branch = setup.default_branch || 'main'
  const params = new URLSearchParams({ filename: snippet.filename, value: snippet.content })
  return `https://github.com/${fullName}/new/${encodeURIComponent(branch)}?${params.toString()}`
}
