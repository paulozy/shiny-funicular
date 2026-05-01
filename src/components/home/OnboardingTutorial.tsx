'use client'

import { CSSProperties } from 'react'
import { OrganizationConfigResponse } from '@/lib/types/organization'
import { T } from '@/lib/tokens'
import { MFIcon } from '@/components/icons/MFIcon'
import { Button } from '@/components/ui/Button'

interface OnboardingTutorialProps {
  orgConfig?: OrganizationConfigResponse | null
  onImportRepo: () => void
}

export function OnboardingTutorial({ orgConfig, onImportRepo }: OnboardingTutorialProps) {
  const containerStyle: CSSProperties = {
    padding: '40px 60px',
    maxWidth: 600,
    margin: '0 auto',
    paddingTop: 60,
  }

  const titleStyle: CSSProperties = {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 8,
    letterSpacing: '-0.01em',
  }

  const subtitleStyle: CSSProperties = {
    fontSize: 14,
    color: T.ink3,
    marginBottom: 32,
    lineHeight: 1.5,
  }

  const stepStyle: CSSProperties = {
    display: 'flex',
    gap: 16,
    marginBottom: 24,
    padding: '16px',
    borderRadius: 8,
    background: T.surfaceAlt,
    border: `1px solid ${T.border}`,
  }

  const stepNumberStyle: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: T.accent,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 14,
    flexShrink: 0,
  }

  const stepContentStyle: CSSProperties = {
    flex: 1,
  }

  const stepTitleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  }

  const stepTextStyle: CSSProperties = {
    fontSize: 12.5,
    color: T.ink3,
    lineHeight: 1.5,
    marginBottom: 8,
  }

  const configKeyStyle = (set: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    marginBottom: 4,
  })

  const ctaStyle: CSSProperties = {
    marginTop: 32,
    paddingTop: 24,
    borderTop: `1px solid ${T.border}`,
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Bem-vindo ao Code Hub</h1>
      <p style={subtitleStyle}>Configure sua organização e adicione seus primeiros repositórios para começar.</p>

      {/* Step 1: Organization Config */}
      {orgConfig && (
        <div style={stepStyle}>
          <div style={stepNumberStyle}>1</div>
          <div style={stepContentStyle}>
            <div style={stepTitleStyle}>Status da Organização</div>
            <div style={stepTextStyle}>
              {[
                { key: 'GitHub Token', value: orgConfig.github_token },
                { key: 'Chave Anthropic', value: orgConfig.anthropic_key },
                { key: 'Chave Voyage', value: orgConfig.voyage_key },
                { key: 'Webhook Base URL', value: orgConfig.webhook_base_url },
              ].map((item) => (
                <div key={item.key} style={configKeyStyle(!!item.value)}>
                  <MFIcon name={item.value ? 'check' : 'x'} size={12} color={item.value ? T.ok : T.danger} />
                  <span>
                    {item.key}: <strong>{item.value ? '✓ Configurado' : '✗ Não configurado'}</strong>
                  </span>
                </div>
              ))}
            </div>
            <Button variant="default" size="sm">
              Configurar Organização
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Import First Repo */}
      <div style={stepStyle}>
        <div style={stepNumberStyle}>{orgConfig ? '2' : '1'}</div>
        <div style={stepContentStyle}>
          <div style={stepTitleStyle}>Adicionar Primeiro Repositório</div>
          <div style={stepTextStyle}>
            Importe um repositório GitHub, GitLab ou Gitea. Cole a URL do repositório e ele será sincronizado automaticamente.
          </div>
          <Button variant="primary" size="sm" onClick={onImportRepo}>
            Importar Repositório
          </Button>
        </div>
      </div>

      {/* Next Steps */}
      <div style={ctaStyle}>
        <div style={stepTitleStyle}>Próximos Passos</div>
        <ul style={{ fontSize: 12.5, color: T.ink3, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>Sincronize análise de código e métricas</li>
          <li>Configure webhooks para atualizações em tempo real</li>
          <li>Convide membros da equipe</li>
          <li>Ative inteligência IA para code review</li>
        </ul>
      </div>
    </div>
  )
}
