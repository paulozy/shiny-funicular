'use client'

import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { T } from '@/lib/tokens'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { MFIcon } from '@/components/icons/MFIcon'
import { apiFetch } from '@/lib/api/client'
import { copyText } from '@/lib/clipboard'
import { CoverageSetup } from '@/lib/types/coverage'
import { RepositoryResponse } from '@/lib/types/repository'
import { buildGithubEditorURL, buildSnippet } from '@/lib/ci/coverage-snippet'

interface CoverageSetupPanelProps {
  repo: RepositoryResponse
  /** True when the repository has at least one usable upload token. */
  hasToken: boolean
  /** Bumped by the parent after a token is created, to refetch the facts. */
  refreshKey?: number
}

/**
 * The permanent "how to configure your CI" panel.
 *
 * It exists because the instructions used to live only in the modal shown once at
 * token creation — and that modal printed the *names* of three environment
 * variables while never showing the one value only the platform knows, its own
 * base URL. The feature shipped and stayed off.
 *
 * Everything shown here is resolved server-side (see CoverageSetup): the reachable
 * base URL, which CI the repository already uses, and whether any upload has ever
 * arrived. The panel only renders and lets two fields be corrected.
 */
export function CoverageSetupPanel({ repo, hasToken, refreshKey = 0 }: CoverageSetupPanelProps) {
  const [setup, setSetup] = useState<CoverageSetup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [format, setFormat] = useState<string>('')
  const [reportPath, setReportPath] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const facts = await apiFetch<CoverageSetup>(
          `/api/repositories/${repo.id}/coverage/setup`
        )
        if (cancelled) return
        // The panel reads several nested fields, so a payload that is not the
        // shape we expect has to become an error state rather than a thrown
        // TypeError that blanks the whole settings section around it.
        if (!isCoverageSetup(facts)) {
          setError('As instruções de configuração vieram num formato inesperado.')
          return
        }
        setSetup(facts)
        // Seed the editable fields from the suggestion, but only once — retyping
        // the path and then having a refetch overwrite it would be maddening.
        setFormat((current) => current || facts.suggestion.format)
        setReportPath((current) => current || facts.suggestion.report_path)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar as instruções.')
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [repo.id, refreshKey])

  const snippet = useMemo(() => {
    if (!setup) return null
    return buildSnippet({ setup, format, reportPath })
  }, [setup, format, reportPath])

  const editorURL = useMemo(() => {
    if (!setup) return null
    return buildGithubEditorURL(setup, snippet, repo.full_name)
  }, [setup, snippet, repo.full_name])

  const handleCopy = async () => {
    if (!snippet) return
    if (await copyText(snippet.content)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    }
  }

  const labelStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
  }
  const valueRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: '6px 10px',
    marginTop: 4,
  }
  const codeStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11.5,
    flex: 1,
    overflow: 'auto',
    whiteSpace: 'nowrap',
    color: T.ink,
  }
  const preStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 12,
    margin: '6px 0 0',
    overflow: 'auto',
    whiteSpace: 'pre',
    maxHeight: 260,
    color: T.ink,
  }
  const inputStyle: CSSProperties = {
    fontFamily: T.mono,
    fontSize: 11.5,
    padding: '6px 8px',
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    background: T.surface,
    color: T.ink,
    width: '100%',
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>
  }
  if (!setup) {
    return <p style={{ fontSize: 12, color: T.ink2 }}>Carregando instruções…</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <MFIcon name="settings" size={14} color={T.accent} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Como configurar o CI</span>
      </div>

      {/* The honest empty state. A CI runner cannot resolve loopback, so emitting a
          snippet here would produce a step that fails on every run — the exact
          silent breakage this panel exists to end. */}
      {!setup.reachable ? (
        <Alert variant="warn">
          A plataforma não tem uma URL pública configurada (
          <code style={{ fontFamily: T.mono }}>WEBHOOK_BASE_URL</code>), então o runner do
          seu CI não conseguiria alcançá-la. Configure-a para gerar as instruções.
        </Alert>
      ) : (
        <>
          <div>
            <div style={labelStyle}>URL do IDP</div>
            <div style={valueRowStyle}>
              <code style={codeStyle}>{setup.base_url}</code>
              <CopyButton value={setup.base_url ?? ''} />
            </div>
          </div>

          <div>
            <div style={labelStyle}>Secret a criar no repositório</div>
            <div style={valueRowStyle}>
              <code style={codeStyle}>{setup.secret_env_name}</code>
            </div>
            {/* The point worth stating out loud: the other two values are not
                sensitive, so they are already in the snippet. */}
            <p style={{ fontSize: 11.5, color: T.ink3, margin: '4px 0 0' }}>
              É o único secret necessário. A URL e o ID do repositório não são sensíveis e já
              vão no snippet.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 140px' }}>
              <span style={labelStyle}>Formato</span>
              <select
                aria-label="Formato do relatório"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }}
              >
                {setup.formats.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {setup.suggestion.language && (
                <span style={{ fontSize: 11, color: T.faint }}>
                  Detectado: {setup.suggestion.language}
                </span>
              )}
            </label>
            <label style={{ flex: '2 1 220px' }}>
              <span style={labelStyle}>Arquivo do relatório</span>
              <input
                aria-label="Caminho do relatório"
                value={reportPath}
                onChange={(e) => setReportPath(e.target.value)}
                style={{ ...inputStyle, marginTop: 4 }}
              />
              {/* Stated as a suggestion because no heuristic survives a monorepo. */}
              <span style={{ fontSize: 11, color: T.faint }}>
                Sugestão — ajuste se seu projeto gera em outro caminho.
              </span>
            </label>
          </div>

          {snippet && (
            <div>
              <div style={labelStyle}>{snippet.filename ?? 'Snippet'}</div>
              <p style={{ fontSize: 11.5, color: T.ink3, margin: '4px 0 0' }}>
                {snippet.instruction}
              </p>
              <pre style={preStyle}>{snippet.content}</pre>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
                <Button variant="default" onClick={handleCopy}>
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
                {/* No token, no permission: the commit is made by the viewer's own
                    GitHub session, with their own attribution. */}
                {editorURL && (
                  <a href={editorURL} target="_blank" rel="noreferrer">
                    <Button variant="primary">Abrir editor no GitHub ↗</Button>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* The feedback loop that did not exist anywhere: a token nobody has used
              means the CI is not wired up, and the upload step is guarded to skip
              silently when a secret is missing. */}
          {!hasToken ? (
            <Alert variant="warn">Crie um token acima para usar no snippet.</Alert>
          ) : setup.last_upload_at ? (
            <p style={{ fontSize: 11.5, color: T.ok, margin: 0 }}>
              Último upload recebido em {new Date(setup.last_upload_at).toLocaleString()}.
            </p>
          ) : (
            <Alert variant="warn">
              O token existe mas nunca foi usado — o CI ainda não enviou nada.
            </Alert>
          )}
        </>
      )}
    </div>
  )
}

/**
 * isCoverageSetup checks the fields this panel actually dereferences.
 *
 * Not a full schema — just the nested reads that would throw. The panel sits
 * inside the settings page, so an unexpected payload crashing it would take the
 * token list down with it.
 */
function isCoverageSetup(value: unknown): value is CoverageSetup {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CoverageSetup>
  return (
    typeof candidate.reachable === 'boolean' &&
    typeof candidate.secret_env_name === 'string' &&
    Array.isArray(candidate.formats) &&
    !!candidate.suggestion &&
    typeof candidate.suggestion.format === 'string' &&
    !!candidate.headers &&
    typeof candidate.headers.format === 'string'
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    if (await copyText(value)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    }
  }
  return (
    <Button variant="default" onClick={handle}>
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  )
}
