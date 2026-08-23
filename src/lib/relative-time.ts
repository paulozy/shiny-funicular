/**
 * Short "how long ago" labels, in the compact form the v3 dashboard uses next
 * to pull requests and repositories ("há 2h", "há 3d").
 *
 * Deliberately not `Intl.RelativeTimeFormat`: the mockup abbreviates the unit
 * ("2h", not "2 horas"), and the rows it lives in are dense enough that the
 * long form wraps.
 */
export function timeAgo(value: string | Date | null | undefined, now: Date = new Date()): string {
  if (!value) return '—'

  const then = value instanceof Date ? value : new Date(value)
  const ms = then.getTime()
  if (Number.isNaN(ms)) return '—'

  const seconds = Math.round((now.getTime() - ms) / 1000)

  // Clock skew between the backend and the browser can put "updated_at" a few
  // seconds into the future; that should read as "agora", not "há -1min".
  if (seconds < 60) return 'agora'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `há ${minutes}min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days}d`

  const months = Math.floor(days / 30)
  if (months < 12) return months === 1 ? 'há 1 mês' : `há ${months} meses`

  const years = Math.floor(days / 365)
  return `há ${years}a`
}
