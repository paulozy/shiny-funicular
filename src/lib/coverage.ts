import { CoverageStatus, SyncStatus } from './types/repository'

type TagVariant = 'default' | 'ok' | 'warn' | 'danger' | 'accent'

export function coverageStatusLabel(status: CoverageStatus | '' | undefined): string {
  switch (status) {
    case 'ok':
      return 'Cobertura medida'
    case 'partial':
      return 'Parcial'
    case 'failed':
      return 'Falha ao parsear'
    case 'not_configured':
    case '':
    case undefined:
    default:
      return 'Não medido'
  }
}

export function coverageStatusVariant(status: CoverageStatus | '' | undefined): TagVariant {
  switch (status) {
    case 'ok':
      return 'ok'
    case 'partial':
      return 'warn'
    case 'failed':
      return 'danger'
    default:
      return 'default'
  }
}

// True when the status comes from a real measurement (ok or partial); false
// when the repo simply hasn't uploaded a report yet (not_configured/empty)
// or the parse failed. Drives whether to render the percentage at all.
export function coverageWasMeasured(status: CoverageStatus | '' | undefined): boolean {
  return status === 'ok' || status === 'partial'
}

export function syncStatusLabel(status: SyncStatus | undefined): string {
  switch (status) {
    case 'synced':
      return 'Sincronizado'
    case 'syncing':
      return 'Sincronizando'
    case 'error':
      return 'Erro'
    case 'idle':
    case undefined:
    default:
      return 'Aguardando'
  }
}

export function syncStatusVariant(status: SyncStatus | undefined): TagVariant {
  switch (status) {
    case 'synced':
      return 'ok'
    case 'syncing':
      return 'accent'
    case 'error':
      return 'danger'
    case 'idle':
    case undefined:
    default:
      return 'default'
  }
}
