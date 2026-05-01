import { RepositoryAnalysisStatus, RepositoryResponse, RepositoryStats } from '@/lib/types/repository'

export function getRepositoryStats(repo: Pick<RepositoryResponse, 'stats'>): RepositoryStats {
  return {
    total_analyses: Number(repo.stats?.total_analyses || 0),
    latest_quality_score: Number(repo.stats?.latest_quality_score || 0),
    has_analysis: Boolean(repo.stats?.has_analysis),
    last_analyzed_at: repo.stats?.last_analyzed_at || null,
  }
}

export function normalizeAnalysisStatus(status?: RepositoryResponse['analysis_status']): RepositoryAnalysisStatus | 'none' {
  if (status === 'pending' || status === 'in_progress' || status === 'completed' || status === 'failed') {
    return status
  }
  return 'none'
}

export function analysisStatusLabel(status?: RepositoryResponse['analysis_status']): string {
  const normalized = normalizeAnalysisStatus(status)
  const labels: Record<ReturnType<typeof normalizeAnalysisStatus>, string> = {
    pending: 'Pendente',
    in_progress: 'Em análise',
    completed: 'Concluída',
    failed: 'Falhou',
    none: 'Sem análise',
  }
  return labels[normalized]
}

export function analysisStatusVariant(status?: RepositoryResponse['analysis_status']): 'default' | 'accent' | 'ok' | 'warn' | 'danger' {
  const normalized = normalizeAnalysisStatus(status)
  if (normalized === 'completed') return 'ok'
  if (normalized === 'in_progress') return 'accent'
  if (normalized === 'pending') return 'warn'
  if (normalized === 'failed') return 'danger'
  return 'default'
}

export function analysisStatusTone(status: RepositoryResponse['analysis_status'] | undefined, tokens: { ink3: string; accent: string; ok: string; warn: string; danger: string }): string {
  const normalized = normalizeAnalysisStatus(status)
  if (normalized === 'completed') return tokens.ok
  if (normalized === 'in_progress') return tokens.accent
  if (normalized === 'pending') return tokens.warn
  if (normalized === 'failed') return tokens.danger
  return tokens.ink3
}

export function qualityTone(score: number, tokens: { ok: string; warn: string; danger: string }): string {
  if (score < 60) return tokens.danger
  if (score < 80) return tokens.warn
  return tokens.ok
}
