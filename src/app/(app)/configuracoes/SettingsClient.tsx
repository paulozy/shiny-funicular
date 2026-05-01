'use client'

import { MFIcon } from '@/components/icons/MFIcon'
import { AppShell } from '@/components/shell/AppShell'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { Toggle } from '@/components/ui/Toggle'
import { apiFetch } from '@/lib/api/client'
import { T } from '@/lib/tokens'
import { UserInfo } from '@/lib/types/auth'
import { OrganizationConfigResponse, UpdateOrganizationConfigRequest } from '@/lib/types/organization'
import { CSSProperties, useId, useState } from 'react'

interface SettingsClientProps {
  user: UserInfo
  initialConfig: OrganizationConfigResponse | null
}

type SecretKey =
  | 'anthropic_api_key'
  | 'github_token'
  | 'voyage_api_key'
  | 'github_client_id'
  | 'github_client_secret'
  | 'gitlab_client_id'
  | 'gitlab_client_secret'

type SecretState = Record<SecretKey, string>

const SECRET_LABELS: Record<SecretKey, string> = {
  anthropic_api_key: 'Anthropic API key',
  github_token: 'GitHub token',
  voyage_api_key: 'Voyage API key',
  github_client_id: 'GitHub client ID',
  github_client_secret: 'GitHub client secret',
  gitlab_client_id: 'GitLab client ID',
  gitlab_client_secret: 'GitLab client secret',
}

const EMPTY_SECRETS: SecretState = {
  anthropic_api_key: '',
  github_token: '',
  voyage_api_key: '',
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
    github_pr_review_enabled: config?.github_pr_review_enabled ?? false,
    webhook_base_url: config?.webhook_base_url ?? '',
    embeddings_provider: config?.embeddings_provider ?? 'voyage',
    voyage_api_key_configured: config?.voyage_api_key_configured ?? false,
    embeddings_model: config?.embeddings_model ?? 'voyage-code-3',
    embeddings_dimensions: config?.embeddings_dimensions ?? 1024,
    github_client_id_configured: config?.github_client_id_configured ?? false,
    github_client_secret_configured: config?.github_client_secret_configured ?? false,
    github_callback_url: config?.github_callback_url ?? '',
    gitlab_client_id_configured: config?.gitlab_client_id_configured ?? false,
    gitlab_client_secret_configured: config?.gitlab_client_secret_configured ?? false,
    gitlab_callback_url: config?.gitlab_callback_url ?? '',
  }
}

function configured(config: OrganizationConfigResponse, key: SecretKey): boolean {
  switch (key) {
    case 'anthropic_api_key':
      return config.anthropic_api_key_configured
    case 'github_token':
      return config.github_token_configured
    case 'voyage_api_key':
      return config.voyage_api_key_configured
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
    marginBottom: 14,
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

type Tab = 'ia' | 'github' | 'search' | 'oauth'

export function SettingsClient({ user, initialConfig }: SettingsClientProps) {
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
    { label: 'Voyage', ready: config.voyage_api_key_configured },
    { label: 'Review de PR', ready: config.github_pr_review_enabled },
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
    if (config.github_pr_review_enabled !== baseline.github_pr_review_enabled) {
      body.github_pr_review_enabled = config.github_pr_review_enabled
    }
    if ((config.webhook_base_url ?? '') !== (baseline.webhook_base_url ?? '')) {
      body.webhook_base_url = config.webhook_base_url ?? ''
    }
    if (config.embeddings_provider !== baseline.embeddings_provider) {
      body.embeddings_provider = config.embeddings_provider
    }
    if (config.embeddings_model !== baseline.embeddings_model) {
      body.embeddings_model = config.embeddings_model
    }
    if (config.embeddings_dimensions !== baseline.embeddings_dimensions) {
      body.embeddings_dimensions = config.embeddings_dimensions
    }
    if ((config.github_callback_url ?? '') !== (baseline.github_callback_url ?? '')) {
      body.github_callback_url = config.github_callback_url ?? ''
    }
    if ((config.gitlab_callback_url ?? '') !== (baseline.gitlab_callback_url ?? '')) {
      body.gitlab_callback_url = config.gitlab_callback_url ?? ''
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

    if (config.anthropic_tokens_per_hour <= 0 || config.embeddings_dimensions <= 0) {
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
      setError(err instanceof Error ? err.message : 'Não foi possível salvar as configurações.')
    } finally {
      setSaving(false)
    }
  }

  const SelectField = ({
    label,
    value,
    onChange,
    options,
    disabled = false,
    hint,
  }: {
    label: string
    value: string
    onChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    disabled?: boolean
    hint?: string
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
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    }

    const hintStyle: CSSProperties = {
      marginTop: '4px',
      fontSize: '11.5px',
      color: T.faint,
      display: 'block',
    }

    return (
      <div style={containerStyle}>
        <label htmlFor={selectId} style={labelStyle}>
          {label}
        </label>
        <select
          id={selectId}
          style={selectStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && <span style={hintStyle}>{hint}</span>}
      </div>
    )
  }

  const FieldGroup = ({ title, children }: { title: string; children: React.ReactNode }) => {
    const groupStyle: CSSProperties = {
      marginBottom: 20,
    }

    const groupTitleStyle: CSSProperties = {
      fontSize: 12,
      fontWeight: 600,
      color: T.ink3,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      marginBottom: 10,
      paddingBottom: 8,
      borderBottom: `1px solid ${T.border}`,
    }

    return (
      <div style={groupStyle}>
        <div style={groupTitleStyle}>{title}</div>
        {children}
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
    paddingBottom: 12,
    marginBottom: 16,
    borderBottom: `1px solid ${T.border}`,
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
  }

  const toggleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  }

  const oauthGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px 24px',
  }

  if (!isAdmin) {
    return (
      <AppShell user={user} activeHub="settings" breadcrumb={['Configurações']}>
        <div style={pageStyle}>
          <Alert variant="danger">Apenas administradores podem alterar configurações da organização.</Alert>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={user} activeHub="settings" breadcrumb={['Configurações', user.organization?.name || 'Organização']}>
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>Organização</div>
            <h1 style={titleStyle}>Configurações</h1>
          </div>
          <div style={{ flex: 1 }} />
          <div style={headerButtonGroupStyle}>
            {isDirty && <span style={dirtyIndicatorStyle}>Alterações não salvas</span>}
            <Button variant="primary" size="md" loading={saving} onClick={save} disabled={!isDirty && !saving}>
              <MFIcon name="check" size={12} />
              Salvar
            </Button>
          </div>
        </div>

        <div style={tabBarStyle}>
          <button style={tabStyle(activeTab === 'ia')} onClick={() => setActiveTab('ia')}>
            IA
          </button>
          <button style={tabStyle(activeTab === 'github')} onClick={() => setActiveTab('github')}>
            GitHub
          </button>
          <button style={tabStyle(activeTab === 'search')} onClick={() => setActiveTab('search')}>
            Busca semântica
          </button>
          <button style={tabStyle(activeTab === 'oauth')} onClick={() => setActiveTab('oauth')}>
            OAuth
          </button>
        </div>

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
              <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MFIcon name="sparkles" size={15} color={T.ai} />
                  <span style={sectionTitleStyle}>IA</span>
                </div>
                <Tag variant={configured(config, 'anthropic_api_key') ? 'ok' : 'warn'}>
                  {configured(config, 'anthropic_api_key') ? '✓ Configurado' : 'Pendente'}
                </Tag>
              </div>
              <FieldGroup title="Chave de API">
                <SecretField
                  name="anthropic_api_key"
                  value={secrets.anthropic_api_key}
                  isConfigured={configured(config, 'anthropic_api_key')}
                  onChange={(value) => setSecret('anthropic_api_key', value)}
                  onClear={() => clearSecret('anthropic_api_key')}
                />
              </FieldGroup>
              <FieldGroup title="Limites">
                <Input
                  label="Tokens por hora"
                  type="number"
                  min={1}
                  value={config.anthropic_tokens_per_hour}
                  onChange={(event) => setConfig((prev) => ({ ...prev, anthropic_tokens_per_hour: Number(event.target.value) }))}
                />
              </FieldGroup>
            </section>
          )}

          {activeTab === 'github' && (
            <section style={sectionStyle}>
              <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MFIcon name="branch" size={15} color={T.accent} />
                  <span style={sectionTitleStyle}>GitHub</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag variant={configured(config, 'github_token') ? 'ok' : 'warn'}>
                    Token {configured(config, 'github_token') ? '✓' : '✗'}
                  </Tag>
                  <Tag variant={config.github_pr_review_enabled ? 'ok' : 'default'}>
                    Review {config.github_pr_review_enabled ? '✓' : '✗'}
                  </Tag>
                </div>
              </div>
              <FieldGroup title="Acesso">
                <SecretField
                  name="github_token"
                  value={secrets.github_token}
                  isConfigured={configured(config, 'github_token')}
                  onChange={(value) => setSecret('github_token', value)}
                  onClear={() => clearSecret('github_token')}
                />
              </FieldGroup>
              <FieldGroup title="Revisão de Pull Requests">
                <div style={toggleRowStyle}>
                  <Toggle
                    checked={config.github_pr_review_enabled}
                    onChange={(checked) => setConfig((prev) => ({ ...prev, github_pr_review_enabled: checked }))}
                    label="Revisão automática"
                  />
                </div>
                <Input
                  label="Webhook base URL"
                  value={config.webhook_base_url ?? ''}
                  onChange={(event) => setConfig((prev) => ({ ...prev, webhook_base_url: event.target.value }))}
                  placeholder="https://idp.example.com"
                  hint="URL base para receber webhooks de eventos do GitHub"
                />
              </FieldGroup>
            </section>
          )}

          {activeTab === 'search' && (
            <section style={sectionStyle}>
              <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MFIcon name="search" size={15} color={T.ok} />
                  <span style={sectionTitleStyle}>Busca semântica</span>
                </div>
                <Tag variant={configured(config, 'voyage_api_key') ? 'ok' : 'warn'}>
                  {configured(config, 'voyage_api_key') ? '✓ Configurado' : 'Pendente'}
                </Tag>
              </div>
              <FieldGroup title="Provider">
                <SelectField
                  label="Serviço de embeddings"
                  value={config.embeddings_provider}
                  onChange={(value) => setConfig((prev) => ({ ...prev, embeddings_provider: value }))}
                  options={[{ value: 'voyage', label: 'Voyage' }]}
                  disabled={true}
                  hint="Somente Voyage disponível atualmente"
                />
              </FieldGroup>
              <FieldGroup title="Chave de API">
                <SecretField
                  name="voyage_api_key"
                  value={secrets.voyage_api_key}
                  isConfigured={configured(config, 'voyage_api_key')}
                  onChange={(value) => setSecret('voyage_api_key', value)}
                  onClear={() => clearSecret('voyage_api_key')}
                />
              </FieldGroup>
              <FieldGroup title="Modelo">
                <Input
                  label="Nome do modelo"
                  value={config.embeddings_model}
                  onChange={(event) => setConfig((prev) => ({ ...prev, embeddings_model: event.target.value }))}
                  hint="Exemplo: voyage-code-3"
                />
                <Input
                  label="Dimensões do vetor"
                  type="number"
                  min={1}
                  value={config.embeddings_dimensions}
                  onChange={(event) => setConfig((prev) => ({ ...prev, embeddings_dimensions: Number(event.target.value) }))}
                  hint="Número de dimensões para os embeddings"
                />
              </FieldGroup>
            </section>
          )}

          {activeTab === 'oauth' && (
            <section style={sectionStyle}>
              <div style={{ ...sectionHeaderStyle, justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MFIcon name="lock" size={15} color={T.ink3} />
                  <span style={sectionTitleStyle}>OAuth 2.0</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Tag variant={config.github_client_id_configured && configured(config, 'github_client_secret') ? 'ok' : 'warn'}>
                    GitHub {config.github_client_id_configured && configured(config, 'github_client_secret') ? '✓' : '✗'}
                  </Tag>
                  <Tag variant={config.gitlab_client_id_configured && configured(config, 'gitlab_client_secret') ? 'ok' : 'warn'}>
                    GitLab {config.gitlab_client_id_configured && configured(config, 'gitlab_client_secret') ? '✓' : '✗'}
                  </Tag>
                </div>
              </div>
              <div style={oauthGridStyle}>
                <div>
                  <FieldGroup title="GitHub">
                    <Input
                      label="Callback URL"
                      value={config.github_callback_url ?? ''}
                      onChange={(event) => setConfig((prev) => ({ ...prev, github_callback_url: event.target.value }))}
                      hint="URL para redirecionar após autenticação"
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
                  </FieldGroup>
                </div>
                <div>
                  <FieldGroup title="GitLab">
                    <Input
                      label="Callback URL"
                      value={config.gitlab_callback_url ?? ''}
                      onChange={(event) => setConfig((prev) => ({ ...prev, gitlab_callback_url: event.target.value }))}
                      hint="URL para redirecionar após autenticação"
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
                  </FieldGroup>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  )
}
