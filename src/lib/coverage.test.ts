import {
  coverageStatusLabel,
  coverageStatusVariant,
  coverageWasMeasured,
  syncStatusLabel,
  syncStatusVariant,
} from './coverage'

describe('coverage helpers', () => {
  it.each([
    ['ok', 'Cobertura medida', 'ok', true],
    ['partial', 'Parcial', 'warn', true],
    ['failed', 'Falha ao parsear', 'danger', false],
    ['not_configured', 'Não medido', 'default', false],
    ['', 'Não medido', 'default', false],
    [undefined, 'Não medido', 'default', false],
  ] as const)(
    'maps coverage status %p → label %p / variant %p / measured %p',
    (status, label, variant, measured) => {
      expect(coverageStatusLabel(status as any)).toBe(label)
      expect(coverageStatusVariant(status as any)).toBe(variant)
      expect(coverageWasMeasured(status as any)).toBe(measured)
    }
  )

  it.each([
    ['synced', 'Sincronizado', 'ok'],
    ['syncing', 'Sincronizando', 'accent'],
    ['error', 'Erro', 'danger'],
    ['idle', 'Aguardando', 'default'],
    [undefined, 'Aguardando', 'default'],
  ] as const)('maps sync status %p → label %p / variant %p', (status, label, variant) => {
    expect(syncStatusLabel(status as any)).toBe(label)
    expect(syncStatusVariant(status as any)).toBe(variant)
  })
})
