/**
 * Tags are stored as a comma-separated string in the DB column. The renderer
 * is the only consumer; everything that needs to display or filter on tags
 * goes through these helpers so the parse/serialize round-trip is consistent.
 *
 * Tags are case-sensitive (so the user can have "Critical-Path" without it
 * colliding with "critical-path") but compared with normal string equality
 * — no folding or normalization. Trim whitespace, dedupe, drop empties.
 */

export function tagsFromString(input: string | null | undefined): string[] {
  if (!input) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input.split(',')) {
    const t = raw.trim()
    if (!t) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

export function tagsToString(tags: string[]): string {
  return tags.join(', ')
}

/**
 * Collect every unique tag across a list of CVEs (already-parsed CVE rows
 * with a `tags: string | null` field). Used by the TopBar tag filter to
 * populate its dropdown.
 */
export function collectAllTags(cves: { tags: string | null }[]): string[] {
  const seen = new Set<string>()
  for (const cve of cves) {
    for (const t of tagsFromString(cve.tags)) seen.add(t)
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b))
}
