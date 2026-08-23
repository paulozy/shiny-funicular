'use client'

/**
 * The admin's platform setup checklist, shown on an empty home: configure the
 * organization's keys, import the first repository.
 *
 * Not to be confused with the member onboarding in `@/components/onboarding` —
 * different audience (the person setting the platform up, not the person
 * learning the company) and different content.
 */

import { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { T } from '@/lib/tokens'
import { Button } from '@/components/ui/Button'

interface SetupChecklistProps {
  orgConfig?: OrganizationConfigResponse | null
  canConfigure?: boolean
  canImport?: boolean
  onImportRepo: () => void
}

const NEXT_STEPS = [
  'Gerar ADRs e documentação de arquitetura',
  'Definir o time responsável por cada repositório',
  'Convidar membros e atribuir fluxos de onboarding',
  'Ativar revisão de código com IA',
]

export function SetupChecklist({
  orgConfig,
  canConfigure = false,
  canImport = false,
  onImportRepo,
}: SetupChecklistProps) {
  const router = useRouter()

  const containerStyle: CSSProperties = { maxWidth: 720 }

  const cardStyle: CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: T.radius.card,
    padding: 20,
    display: 'flex',
    gap: 16,
  }

  const stepNumberStyle: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: T.accent,
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 13,
    flexShrink: 0,
  }

  const stepTitleStyle: CSSProperties = { fontSize: 16, margin: '0 0 8px', fontWeight: 600 }

  const bodyStyle: CSSProperties = {
    fontSize: 13.5,
    color: T.ink3,
    margin: '0 0 14px',
    lineHeight: 1.55,
  }

  const showConfigStep = Boolean(orgConfig || canConfigure)

  const statusRows = orgConfig
    ? [
        { label: 'GitHub token configurado', ok: orgConfig.github_token_configured },
        { label: 'Chave Anthropic configurada', ok: orgConfig.anthropic_api_key_configured },
      ]
    : []

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 30, margin: '0 0 8px' }}>Bem-vindo ao Code Hub</h1>
      <p style={{ fontSize: 15, color: T.ink3, margin: '0 0 28px', lineHeight: 1.6 }}>
        Configure a organização e importe o primeiro repositório. A partir daí a plataforma sincroniza
        PRs, issues, cobertura e documentação.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {showConfigStep && (
          <div style={cardStyle}>
            <span style={stepNumberStyle}>1</span>
            <div style={{ flex: 1 }}>
              <h2 style={stepTitleStyle}>Status da organização</h2>
              {orgConfig ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    fontSize: 13.5,
                    color: T.ink2,
                    marginBottom: 14,
                  }}
                >
                  {statusRows.map((row) => (
                    <div key={row.label}>
                      <span style={{ color: row.ok ? T.ok : T.warn }}>{row.ok ? '✓' : '!'}</span>{' '}
                      {row.label}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={bodyStyle}>
                  Configure as chaves e integrações da organização antes de importar repositórios.
                </p>
              )}
              <Button variant="default" size="md" onClick={() => router.push('/settings')}>
                Configurar organização
              </Button>
            </div>
          </div>
        )}

        <div style={cardStyle}>
          <span style={stepNumberStyle}>{showConfigStep ? '2' : '1'}</span>
          <div style={{ flex: 1 }}>
            <h2 style={stepTitleStyle}>Importar o primeiro repositório</h2>
            <p style={bodyStyle}>
              Cole a URL de um repositório GitHub, GitLab ou Gitea. A sincronização começa em seguida.
            </p>
            {canImport ? (
              <Button variant="primary" size="md" onClick={onImportRepo}>
                Importar repositório
              </Button>
            ) : (
              <div style={{ ...bodyStyle, margin: 0, fontStyle: 'italic' }}>
                Seu papel na organização não permite importar repositórios. Peça a um desenvolvedor ou
                admin.
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3
          style={{
            fontSize: 13,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
            color: T.faint,
            margin: '0 0 10px',
            fontWeight: 600,
          }}
        >
          Próximos passos
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13.5, color: T.ink2 }}>
          {NEXT_STEPS.map((step) => (
            <div key={step}>{step}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
