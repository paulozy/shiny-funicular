import { T } from '@/lib/tokens'

export interface SeverityMeta {
  label: string
  color: string
  order: number
}

const MAP: Record<string, SeverityMeta> = {
  critical: { label: 'Crítico', color: T.danger, order: 0 },
  error: { label: 'Erro', color: T.danger, order: 1 },
  warning: { label: 'Aviso', color: T.warn, order: 2 },
  info: { label: 'Info', color: T.ink3, order: 3 },
}

export function severityMeta(severity: string): SeverityMeta {
  return MAP[severity] ?? { label: severity, color: T.ink3, order: 4 }
}
