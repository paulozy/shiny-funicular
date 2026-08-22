'use client'

import { CSSProperties, ReactNode, useState, useId } from 'react'
import { UserInfo } from '@/lib/types/auth'
import { OrganizationConfigResponse, UpdateOrganizationConfigRequest } from '@/lib/types/organization'
import { RepositoryListResponse } from '@/lib/types/repository'
import { apiFetch } from '@/lib/api/client'
import { T } from '@/lib/tokens'
import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { MembersSection } from '@/components/organization/MembersSection'
import { TeamsSection } from '@/components/organization/TeamsSection'
import { OnboardingFlowsSection } from '@/components/organization/OnboardingFlowsSection'
import { GlossarySection } from '@/components/organization/GlossarySection'
import { Tag } from '@/components/ui/Tag'
import { Toggle } from '@/components/ui/Toggle'
import { Tooltip } from '@/components/ui/Tooltip'
import { MFIcon } from '@/components/icons/MFIcon'
import { canManageGlossary, canManageOnboarding } from '@/lib/permissions'

interface SettingsClientProps {
  user: UserInfo
  initialConfig: OrganizationConfigResponse | null
  repos?: RepositoryListResponse | null
}

type SecretKey =
  | 'anthropic_api_key'
  | 'github_token'
  | 'gitlab_token'
  | 'github_client_id'
  | 'github_client_secret'
  | 'gitlab_client_id'
  | 'gitlab_client_secret'

type SecretState = Record<SecretKey, string>

const SECRET_LABELS: Record<SecretKey, string> = {
  anthropic_api_key: 'Anthropic API key',
  github_token: 'GitHub token',
  gitlab_token: 'GitLab token',
  github_client_id: 'GitHub client ID',
  github_client_secret: 'GitHub client secret',
  gitlab_client_id: 'GitLab client ID',
  gitlab_client_secret: 'GitLab client secret',
}

const LANGUAGE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'en', label: 'English (padrão)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'ja', label: '日本語' },
  { value: 'zh-CN', label: '中文 (简体)' },
]

const EMPTY_SECRETS: SecretState = {
  anthropic_api_key: '',
  github_token: '',
  gitlab_token: '',
  github_client_id: '',
  github_client_secret: '',
  gitlab_client_id: '',
  gitlab_client_secret: '',
}

function defaultConfig(config: OrganizationConfigResponse | null): OrganizationConfigResponse {
  return {
    anthropic_api_key_configured: config?.anthropic_api_key_configured ?? false,
    anthropic_tokens_per_hour: config?.anthropic_tokens_per_hour ?? 20000,
    github_token_configured: config?.github_token_configured ?? false,
    gitlab_token_configured: config?.gitlab_token_configured ?? false,
    github_client_id_configured: config?.github_client_id_configured ?? false,
    github_client_secret_configured: config?.github_client_secret_configured ?? false,
    github_callback_url: config?.github_callback_url ?? '',
    gitlab_client_id_configured: config?.gitlab_client_id_configured ?? false,
    gitlab_client_secret_configured: config?.gitlab_client_secret_configured ?? false,
    gitlab_callback_url: config?.gitlab_callback_url ?? '',
    output_language: config?.output_language ?? 'en',
  }
}

function configured(config: OrganizationConfigResponse, key: SecretKey): boolean {
  switch (key) {
    case 'anthropic_api_key':
      return config.anthropic_api_key_configured
    case 'github_token':
      return config.github_token_configured
    case 'gitlab_token':
      return config.gitlab_token_configured
    case 'github_client_id':
      return config.github_client_id_configured
    case 'github_client_secret':
      return config.github_client_secret_configured
    case 'gitlab_client_id':
      return config.gitlab_client_id_configured
    case 'gitlab_client_secret':
      return config.gitlab_client_secret_configured
  }
}

function SecretField({
  name,
  value,
  isConfigured,
  onChange,
  onClear,
  secret = true,
}: {
  name: SecretKey
  value: string
  isConfigured: boolean
  onChange: (value: string) => void
  onClear: () => void
  secret?: boolean
}) {
  const rowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 8,
    alignItems: 'end',
  }

  return (
    <div style={rowStyle}>
      <Input
        label={SECRET_LABELS[name]}
        type={secret ? 'password' : 'text'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={isConfigured ? 'Configurado. Digite para substituir.' : 'Não configurado'}
        hint={isConfigured ? 'Deixe vazio para manter o valor atual.' : 'Digite um valor para configurar.'}
      />
      <Button type="button" variant="default" size="md" onClick={onClear} disabled={!isConfigured && value === ''}>
        Remover
      </Button>
    </div>
  )
}

const tokenCodeStyle: CSSProperties = {
  fontFamily: T.mono,
  fontSize: 11,
  background: T.bg,
  border: `1px solid ${T.border}`,
  borderRadius: 4,
  padding: '1px 4px',
}

// Step-by-step tutorial shown inside the GitHub token tooltip. The token is
// used by the backend for repo sync, private clones, PR operations, and
// documentation PRs — all covered by the classic `repo` scope.
function GitHubTokenTutorial() {
  const linkStyle: CSSProperties = { color: T.accent, fontWeight: 500, textDecoration: 'none' }
  return (
    <div>
      <div style={{ fontWeight: 600, color: T.ink, marginBottom: 6, fontSize: 12.5 }}>
        Como gerar um GitHub token
      </div>
      <ol style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
        <li>
          Abra{' '}
          <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer noopener" style={linkStyle}>
            github.com/settings/tokens
          </a>{' '}
          e clique em <strong>Generate new token (classic)</strong>.
        </li>
        <li>
          Dê um nome (ex.: <span style={tokenCodeStyle}>IDP</span>) e defina uma expiração.
        </li>
        <li>
          Marque o escopo <span style={tokenCodeStyle}>repo</span> — cobre repositórios privados, conteúdos e pull requests.
        </li>
        <li>
          Clique em <strong>Generate token</strong> e copie o valor (começa com <span style={tokenCodeStyle}>ghp_</span>).
        </li>
        <li>Cole no campo abaixo. O GitHub não mostra o token novamente.</li>
      </ol>
      <a
        href="https://github.com/settings/tokens/new?scopes=repo&description=IDP"
        target="_blank"
        rel="noreferrer noopener"
        style={{ ...linkStyle, display: 'inline-block', marginTop: 8 }}
      >
        Abrir criação do token →
      </a>
    </div>
  )
}

function GitLabTokenTutorial() {
  const linkStyle: CSSProperties = { color: T.accent, fontWeight: 500, textDecoration: 'none' }
  return (
    <div>
      <div style={{ fontWeight: 600, color: T.ink, marginBottom: 6, fontSize: 12.5 }}>
        Como gerar um GitLab token
      </div>
      <ol style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
        <li>
          Abra{' '}
          <a
            href="https://gitlab.com/-/user_settings/personal_access_tokens"
            target="_blank"
            rel="noreferrer noopener"
            style={linkStyle}
          >
            gitlab.com/-/user_settings/personal_access_tokens
          </a>{' '}
          e clique em <strong>Add new token</strong>.
        </li>
        <li>
          Dê um nome (ex.: <span style={tokenCodeStyle}>IDP</span>) e defina uma expiração.
        </li>
        <li>
          Marque o escopo <span style={tokenCodeStyle}>api</span> — cobre leitura do projeto, merge
          requests, webhooks e a criação dos MRs de documentação.
        </li>
        <li>
          Clique em <strong>Create personal access token</strong> e copie o valor (começa com{' '}
          <span style={tokenCodeStyle}>glpat-</span>).
        </li>
        <li>Cole no campo abaixo. O GitLab não mostra o token novamente.</li>
      </ol>
      <a
        href="https://gitlab.com/-/user_settings/personal_access_tokens"
        target="_blank"
        rel="noreferrer noopener"
        style={{ ...linkStyle, display: 'inline-block', marginTop: 8 }}
      >
        Abrir criação do token →
      </a>
    </div>
  )
}

// Small helper trigger that opens a Tooltip with step-by-step guidance,
// rendered above the related input. Keeps the "how do I fill this?" affordance
// consistent across the settings tabs.
function HelpHint({ label, content, width = 320 }: { label: string; content: ReactNode; width?: number }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <Tooltip content={content} triggerLabel={label} width={width}>
        <MFIcon name="lightbulb" size={13} color={T.accent} />
        <span style={{ fontSize: 12, color: T.accent, fontWeight: 500 }}>{label}</span>
      </Tooltip>
    </div>
  )
}

function GitHubCallbackTutorial() {
  const linkStyle: CSSProperties = { color: T.accent, fontWeight: 500, textDecoration: 'none' }
  return (
    <div>
      <div style={{ fontWeight: 600, color: T.ink, marginBottom: 6, fontSize: 12.5 }}>
        Callback URL do GitHub
      </div>
      <ol style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
        <li>
          Crie um OAuth App em{' '}
          <a href="https://github.com/settings/developers" target="_blank" rel="noreferrer noopener" style={linkStyle}>
            github.com/settings/developers
          </a>{' '}
          (OAuth Apps → New).
        </li>
        <li>
          Em <strong>Authorization callback URL</strong>, use a URL de callback do IDP:{' '}
          <span style={tokenCodeStyle}>https://SEU-BACKEND/api/v1/auth/github/callback</span>
        </li>
        <li>Cole a <strong>mesma</strong> URL no campo ao lado — as duas precisam ser idênticas.</li>
        <li>Copie o <strong>Client ID</strong>, gere um <strong>Client Secret</strong> e cole abaixo.</li>
      </ol>
    </div>
  )
}

function GitLabCallbackTutorial() {
  const linkStyle: CSSProperties = { color: T.accent, fontWeight: 500, textDecoration: 'none' }
  return (
    <div>
      <div style={{ fontWeight: 600, color: T.ink, marginBottom: 6, fontSize: 12.5 }}>
        Callback URL do GitLab
      </div>
      <ol style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
        <li>
          Crie uma aplicação em{' '}
          <a href="https://gitlab.com/-/profile/applications" target="_blank" rel="noreferrer noopener" style={linkStyle}>
            GitLab → Preferences → Applications
          </a>.
        </li>
        <li>
          Em <strong>Redirect URI</strong>, use a URL de callback do IDP:{' '}
          <span style={tokenCodeStyle}>https://SEU-BACKEND/api/v1/auth/gitlab/callback</span>
        </li>
        <li>
          Marque os scopes <span style={tokenCodeStyle}>read_user</span> e <span style={tokenCodeStyle}>read_api</span>.
        </li>
        <li>Cole a mesma URL ao lado + o <strong>Application ID</strong> e <strong>Secret</strong> abaixo.</li>
      </ol>
    </div>
  )
}

type Tab = 'ia' | 'github' | 'gitlab' | 'oauth' | 'members' | 'teams' | 'onboarding' | 'glossary'

export function SettingsClient({ user, initialConfig, repos }: SettingsClientProps) {
  const [baseline, setBaseline] = useState(() => defaultConfig(initialConfig))
  const [config, setConfig] = useState(baseline)
  const [secrets, setSecrets] = useState<SecretState>(EMPTY_SECRETS)
  const [dirtySecrets, setDirtySecrets] = useState<Set<SecretKey>>(new Set())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('ia')

  const isAdmin = user.role === 'admin'
  const summaryItems = [
    { label: 'Anthropic', ready: config.anthropic_api_key_configured },
    { label: 'GitHub token', ready: config.github_token_configured },
    { label: 'GitLab token', ready: config.gitlab_token_configured },
    { label: 'OAuth GitHub', ready: config.github_client_id_configured && config.github_client_secret_configured },
    { label: 'OAuth GitLab', ready: config.gitlab_client_id_configured && config.gitlab_client_secret_configured },
  ]
  const readyCount = summaryItems.filter((item) => item.ready).length

  const setSecret = (key: SecretKey, value: string) => {
    setSecrets((prev) => ({ ...prev, [key]: value }))
    setDirtySecrets((prev) => new Set(prev).add(key))
  }

  const clearSecret = (key: SecretKey) => {
    setSecret(key, '')
  }

  const payload = (): UpdateOrganizationConfigRequest => {
    const body: UpdateOrganizationConfigRequest = {}

    if (config.anthropic_tokens_per_hour !== baseline.anthropic_tokens_per_hour) {
      body.anthropic_tokens_per_hour = config.anthropic_tokens_per_hour
    }
    if ((config.github_callback_url ?? '') !== (baseline.github_callback_url ?? '')) {
      body.github_callback_url = config.github_callback_url ?? ''
    }
    if ((config.gitlab_callback_url ?? '') !== (baseline.gitlab_callback_url ?? '')) {
      body.gitlab_callback_url = config.gitlab_callback_url ?? ''
    }
    if (config.output_language !== baseline.output_language) {
      body.output_language = config.output_language
    }

    dirtySecrets.forEach((key) => {
      body[key] = secrets[key]
    })

    return body
  }

  const isDirty = Object.keys(payload()).length > 0 || dirtySecrets.size > 0

  const save = async () => {
    setError(null)
    setMessage(null)

    if (config.anthropic_tokens_per_hour <= 0) {
      setError('Limites numéricos precisam ser maiores que zero.')
      return
    }

    const body = payload()
    if (Object.keys(body).length === 0) {
      setMessage('Nenhuma alteração para salvar.')
      return
    }

    setSaving(true)
    try {
      const updated = await apiFetch<OrganizationConfigResponse>('/api/organization/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const nextConfig = defaultConfig(updated)
      setBaseline(nextConfig)
      setConfig(nextConfig)
      setSecrets(EMPTY_SECRETS)
      setDirtySecrets(new Set())
      setMessage('Configurações salvas.')
    } catch (err) {
      const code = err instanceof Error ? (err as { errorResponse?: { error?: string } }).errorResponse?.error : undefined
      if (code === 'invalid_output_language') {
        setError('Idioma inválido. Selecione uma das opções da lista.')
      } else {
        setError(err instanceof Error ? err.message : 'Não foi possível salvar as configurações.')
      }
    } finally {
      setSaving(false)
    }
  }

  const SelectField = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
  }) => {
    const selectId = useId()
    const containerStyle: CSSProperties = {
      marginBottom: 14,
    }

    const labelStyle: CSSProperties = {
      display: 'block',
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 6,
      color: T.ink2,
    }

    const selectStyle: CSSProperties = {
      width: '100%',
      padding: '7px 10px',
      fontSize: 13,
      fontFamily: T.font,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius.input,
      background: T.surface,
      color: T.ink,
      cursor: 'pointer',
    }

    return (
      <div style={containerStyle}>
        <label htmlFor={selectId} style={labelStyle}>
          {label}
        </label>
        <select id={selectId} style={selectStyle} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  const pageStyle: CSSProperties = {
    padding: '0 24px 28px',
    width: '100%',
    boxSizing: 'border-box',
  }

  const headerStyle: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    margin: '0 -24px 0',
    padding: '14px 24px',
    borderBottom: `1px solid ${T.border}`,
    background: T.bg,
  }

  const headerButtonGroupStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  const dirtyIndicatorStyle: CSSProperties = {
    fontSize: 12,
    color: T.faint,
    fontStyle: 'italic',
  }

  const tabBarStyle: CSSProperties = {
    position: 'sticky',
    top: 54,
    zIndex: 2,
    display: 'flex',
    gap: 0,
    borderBottom: `1px solid ${T.border}`,
    background: T.bg,
    paddingLeft: 0,
    margin: '0 -24px 0',
  }

  const tabStyle = (isActive: boolean): CSSProperties => ({
    padding: '12px 16px',
    fontSize: 13,
    fontWeight: 500,
    color: isActive ? T.ink : T.ink3,
    borderBottom: isActive ? `2px solid ${T.accent}` : `2px solid transparent`,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 200ms ease-in-out',
  })

  const titleStyle: CSSProperties = {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: 0,
  }

  const eyebrowStyle: CSSProperties = {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: T.faint,
    marginBottom: 4,
  }

  const tabContentStyle: CSSProperties = {
    paddingTop: 16,
    paddingBottom: 24,
  }

  const contentBelowTabsStyle: CSSProperties = {
    paddingTop: 16,
  }

  const sectionStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 16,
  }

  const overviewStyle: CSSProperties = {
    ...sectionStyle,
    marginBottom: 14,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
    alignItems: 'center',
  }

  const overviewNumberStyle: CSSProperties = {
    fontSize: 30,
    fontWeight: 650,
    letterSpacing: 0,
    lineHeight: 1,
    marginBottom: 4,
  }

  const overviewDescriptionStyle: CSSProperties = {
    fontSize: 12,
    color: T.ink3,
    marginBottom: 8,
  }

  const overviewTagsStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  }

  const sectionHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
  }

  const statusRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  }

  const toggleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0 16px',
  }

  const oauthGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
  }

  const providerCardStyle: CSSProperties = {
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 14,
  }

  const providerHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  }

  const providerNameStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 13,
    fontWeight: 600,
    color: T.ink,
  }

  if (!isAdmin) {
    return (
      <AppShell
        user={user}
        activeHub="settings"
        breadcrumb={[{ label: 'Configurações' }]}
      >
        <div style={pageStyle}>
          <Alert variant="danger">Apenas administradores podem alterar configurações da organização.</Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      user={user}
      activeHub="settings"
      breadcrumb={[{ label: 'Configurações' }, { label: user.organization?.name || 'Organização' }]}
    >
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Organização</div>
            <h1 style={titleStyle}>Configurações</h1>
          </div>
          <div style={{ flex: 1 }} />
          {activeTab !== 'members' && activeTab !== 'teams' && (
            <div style={headerButtonGroupStyle}>
              {isDirty && <span style={dirtyIndicatorStyle}>Alterações não salvas</span>}
              <Button variant="primary" size="md" loading={saving} onClick={save} disabled={!isDirty && !saving}>
                <MFIcon name="check" size={12} />
                Salvar
              </Button>
            </div>
          )}
        </div>

        <div style={tabBarStyle}>
          <button style={tabStyle(activeTab === 'ia')} onClick={() => setActiveTab('ia')}>
            IA
          </button>
          <button style={tabStyle(activeTab === 'github')} onClick={() => setActiveTab('github')}>
            GitHub
          </button>
          <button style={tabStyle(activeTab === 'gitlab')} onClick={() => setActiveTab('gitlab')}>
            GitLab
          </button>
          <button style={tabStyle(activeTab === 'oauth')} onClick={() => setActiveTab('oauth')}>
            OAuth
          </button>
          <button style={tabStyle(activeTab === 'members')} onClick={() => setActiveTab('members')}>
            Membros
          </button>
          <button style={tabStyle(activeTab === 'onboarding')} onClick={() => setActiveTab('onboarding')}>
            Onboarding
          </button>
          <button style={tabStyle(activeTab === 'glossary')} onClick={() => setActiveTab('glossary')}>
            Glossário
          </button>
          <button style={tabStyle(activeTab === 'teams')} onClick={() => setActiveTab('teams')}>
            Times
          </button>
        </div>

        <div style={contentBelowTabsStyle}>
          {message && <Alert variant="ok">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <section style={overviewStyle}>
            <div>
              <div style={eyebrowStyle}>Status</div>
              <div style={overviewNumberStyle}>
                {readyCount}/{summaryItems.length}
              </div>
              <div style={overviewDescriptionStyle}>itens configurados</div>
            </div>
            <div style={overviewTagsStyle}>
              {summaryItems.map((item) => (
                <Tag key={item.label} variant={item.ready ? 'ok' : 'warn'}>
                  {item.label}
                </Tag>
              ))}
            </div>
          </section>

          <div style={tabContentStyle}>
            {activeTab === 'ia' && (
              <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <MFIcon name="sparkles" size={15} color={T.ai} />
                <span style={sectionTitleStyle}>IA</span>
              </div>
              <div style={statusRowStyle}>
                <Tag variant={configured(config, 'anthropic_api_key') ? 'ok' : 'warn'}>
                  Anthropic {configured(config, 'anthropic_api_key') ? 'configurado' : 'pendente'}
                </Tag>
              </div>
              <SecretField
                name="anthropic_api_key"
                value={secrets.anthropic_api_key}
                isConfigured={configured(config, 'anthropic_api_key')}
                onChange={(value) => setSecret('anthropic_api_key', value)}
                onClear={() => clearSecret('anthropic_api_key')}
              />
              <Input
                label="Tokens por hora"
                type="number"
                min={1}
                value={config.anthropic_tokens_per_hour}
                onChange={(event) => setConfig((prev) => ({ ...prev, anthropic_tokens_per_hour: Number(event.target.value) }))}
              />
              <SelectField
                label="Idioma das saídas de IA"
                value={config.output_language}
                onChange={(value) => setConfig((prev) => ({ ...prev, output_language: value }))}
                options={LANGUAGE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              />
            </section>
          )}

          {activeTab === 'github' && (
            <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <MFIcon name="branch" size={15} color={T.accent} />
                <span style={sectionTitleStyle}>GitHub</span>
              </div>
              <div style={statusRowStyle}>
                <Tag variant={configured(config, 'github_token') ? 'ok' : 'warn'}>
                  Token {configured(config, 'github_token') ? 'configurado' : 'pendente'}
                </Tag>
              </div>
              <HelpHint label="Como gerar um GitHub token?" content={<GitHubTokenTutorial />} />
              <SecretField
                name="github_token"
                value={secrets.github_token}
                isConfigured={configured(config, 'github_token')}
                onChange={(value) => setSecret('github_token', value)}
                onClear={() => clearSecret('github_token')}
              />
            </section>
          )}

          {activeTab === 'gitlab' && (
            <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <MFIcon name="branch" size={15} color={T.accent} />
                <span style={sectionTitleStyle}>GitLab</span>
              </div>
              <div style={statusRowStyle}>
                <Tag variant={configured(config, 'gitlab_token') ? 'ok' : 'warn'}>
                  Token {configured(config, 'gitlab_token') ? 'configurado' : 'pendente'}
                </Tag>
              </div>
              <HelpHint label="Como gerar um GitLab token?" content={<GitLabTokenTutorial />} />
              <SecretField
                name="gitlab_token"
                value={secrets.gitlab_token}
                isConfigured={configured(config, 'gitlab_token')}
                onChange={(value) => setSecret('gitlab_token', value)}
                onClear={() => clearSecret('gitlab_token')}
              />
            </section>
          )}

          {activeTab === 'members' && (
            <section style={sectionStyle}>
              <MembersSection user={user} />
            </section>
          )}

          {activeTab === 'teams' && (
            <section style={sectionStyle}>
              <TeamsSection />
            </section>
          )}

          {activeTab === 'onboarding' && (
            <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <MFIcon name="flag" size={15} color={T.accent} />
                <span style={sectionTitleStyle}>Fluxos de onboarding</span>
              </div>
              <OnboardingFlowsSection canEdit={canManageOnboarding(user)} />
            </section>
          )}

          {activeTab === 'glossary' && (
            <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <MFIcon name="doc" size={15} color={T.accent} />
                <span style={sectionTitleStyle}>Glossário</span>
              </div>
              <GlossarySection canEdit={canManageGlossary(user)} />
            </section>
          )}

          {activeTab === 'oauth' && (
            <section style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <MFIcon name="lock" size={15} color={T.ink3} />
                <span style={sectionTitleStyle}>OAuth</span>
              </div>
              <div style={{ fontSize: 12.5, color: T.ink3, lineHeight: 1.5, marginBottom: 14 }}>
                Cada organização usa seu próprio OAuth App. Registre o app no provedor, cole aqui o Client ID e o Secret, e use a mesma callback URL nos dois lados.
              </div>
              <div style={oauthGridStyle}>
                <div style={providerCardStyle}>
                  <div style={providerHeaderStyle}>
                    <span style={providerNameStyle}>
                      <MFIcon name="branch" size={14} color={T.accent} />
                      GitHub
                    </span>
                    <Tag variant={config.github_client_id_configured && configured(config, 'github_client_secret') ? 'ok' : 'warn'}>
                      {config.github_client_id_configured && configured(config, 'github_client_secret') ? 'Configurado' : 'Pendente'}
                    </Tag>
                  </div>
                  <HelpHint label="Como configurar a callback URL?" content={<GitHubCallbackTutorial />} />
                  <Input
                    label="Callback URL"
                    value={config.github_callback_url ?? ''}
                    onChange={(event) => setConfig((prev) => ({ ...prev, github_callback_url: event.target.value }))}
                    placeholder="https://seu-backend/api/v1/auth/github/callback"
                  />
                  <SecretField
                    name="github_client_id"
                    value={secrets.github_client_id}
                    isConfigured={configured(config, 'github_client_id')}
                    onChange={(value) => setSecret('github_client_id', value)}
                    onClear={() => clearSecret('github_client_id')}
                    secret={false}
                  />
                  <SecretField
                    name="github_client_secret"
                    value={secrets.github_client_secret}
                    isConfigured={configured(config, 'github_client_secret')}
                    onChange={(value) => setSecret('github_client_secret', value)}
                    onClear={() => clearSecret('github_client_secret')}
                  />
                </div>
                <div style={providerCardStyle}>
                  <div style={providerHeaderStyle}>
                    <span style={providerNameStyle}>
                      <MFIcon name="branch" size={14} color={T.ai} />
                      GitLab
                    </span>
                    <Tag variant={config.gitlab_client_id_configured && configured(config, 'gitlab_client_secret') ? 'ok' : 'warn'}>
                      {config.gitlab_client_id_configured && configured(config, 'gitlab_client_secret') ? 'Configurado' : 'Pendente'}
                    </Tag>
                  </div>
                  <HelpHint label="Como configurar a callback URL?" content={<GitLabCallbackTutorial />} />
                  <Input
                    label="Callback URL"
                    value={config.gitlab_callback_url ?? ''}
                    onChange={(event) => setConfig((prev) => ({ ...prev, gitlab_callback_url: event.target.value }))}
                    placeholder="https://seu-backend/api/v1/auth/gitlab/callback"
                  />
                  <SecretField
                    name="gitlab_client_id"
                    value={secrets.gitlab_client_id}
                    isConfigured={configured(config, 'gitlab_client_id')}
                    onChange={(value) => setSecret('gitlab_client_id', value)}
                    onClear={() => clearSecret('gitlab_client_id')}
                    secret={false}
                  />
                  <SecretField
                    name="gitlab_client_secret"
                    value={secrets.gitlab_client_secret}
                    isConfigured={configured(config, 'gitlab_client_secret')}
                    onChange={(value) => setSecret('gitlab_client_secret', value)}
                    onClear={() => clearSecret('gitlab_client_secret')}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
      </div>
    </AppShell>
  )
}
