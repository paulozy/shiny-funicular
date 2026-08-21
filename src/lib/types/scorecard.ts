export type CheckStatus = 'pass' | 'fail' | 'not_applicable'

export interface CheckVerdict {
  check_id: string
  version: number
  title: string
  status: CheckStatus
  /** What to do about it, in the user's language. */
  reason: string
}

/**
 * Deliberately a count, not a ratio. `total` excludes checks that did not
 * apply, so a repository is never marked down for something it could not have
 * satisfied. There is no score and no level by design — a percentage over a
 * handful of checks reads as a grade rather than a to-do list.
 */
export interface Scorecard {
  passing: number
  failing: number
  not_applicable: number
  total: number
  verdicts: CheckVerdict[]
}
