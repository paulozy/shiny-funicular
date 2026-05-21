// Lists of items that come from the AI (analysis issues, search results) often
// arrive without a stable `id` — sometimes the field is missing, sometimes it's
// the empty string. The naive pattern `key={item.id ?? \`fallback-${idx}\`}`
// fails for the empty-string case (`??` only triggers on null/undefined), which
// leaves React with several keys equal to `""` and produces the
// `Encountered two children with the same key` warning, plus subtle bugs where
// React mismatches local state across items on reorder.
//
// `stableKey` builds a deterministic hash from whatever identifying fields we
// have available and falls back to the row index only when nothing else is
// usable. djb2 is plenty for the cardinality we deal with (a few hundred items
// at most per list) and has no dependencies.

export function stableKey(parts: Array<string | number | undefined | null>, idx: number): string {
  const filtered = parts
    .filter((p) => p !== undefined && p !== null && p !== '')
    .map(String)
    .join(':')

  if (!filtered) {
    return `row-${idx}`
  }

  let h = 5381
  for (let i = 0; i < filtered.length; i++) {
    h = ((h * 33) ^ filtered.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}
