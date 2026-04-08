import type { CVE, Vendor, Swimlane } from '../types/cve'
import { formatDate } from './utils'

/**
 * Build a draft publication-ready advisory in Markdown from the CVE +
 * its vendor + swimlane. Same shape as `linkedinPost.ts` and
 * `disclosureEmail.ts` — a pure generator the user invokes via a modal,
 * edits, and copies into their publishing destination (blog, GitHub
 * security advisory, gist, vendor portal, whatever).
 *
 * The output uses standard CommonMark + GitHub-flavoured headings so it
 * pastes cleanly into nearly any markdown destination. Sections without
 * data are filled with bracketed placeholders so the user knows what to
 * write — explicit empty sections are more useful than missing ones.
 */
export function generateAdvisoryMarkdown(
  cve: CVE,
  swimlane: Swimlane,
  vendor: Vendor | undefined
): string {
  const product = swimlane.software_name
  const vendorName = vendor?.name ?? swimlane.vendor
  const version = cve.affected_versions?.trim() || 'all versions'
  const cveLabel = cve.cve_id?.trim() || 'CVE pending'

  const lines: string[] = []

  // ── Title ──
  lines.push(`# ${cve.title}`)
  lines.push('')

  // ── Quick-reference table ──
  // Markdown table renders nicely on GitHub / blog platforms and gives the
  // reader the at-a-glance fields most security articles open with.
  lines.push('| | |')
  lines.push('|--|--|')
  lines.push(`| **Identifier** | ${cveLabel} |`)
  lines.push(`| **Severity** | ${cve.severity} |`)
  if (cve.cvss_vector?.trim()) {
    lines.push(`| **CVSS** | \`${cve.cvss_vector}\` |`)
  }
  if (cve.cwe_id?.trim()) {
    lines.push(`| **CWE** | ${cve.cwe_id} |`)
  }
  lines.push(`| **Vendor** | ${vendorName} |`)
  lines.push(`| **Product** | ${product} |`)
  lines.push(`| **Affected** | ${version} |`)
  if (cve.affected_component?.trim()) {
    lines.push(`| **Component** | ${cve.affected_component} |`)
  }
  if (cve.date_disclosed) {
    lines.push(`| **Disclosed** | ${formatDate(cve.date_disclosed)} |`)
  }
  lines.push('')

  // ── Description / details ──
  lines.push('## Description')
  lines.push('')
  if (cve.description?.trim()) {
    lines.push(cve.description.trim())
  } else {
    lines.push('[Describe the vulnerability in plain language: what is broken, why it matters, who is affected.]')
  }
  lines.push('')

  // ── Impact ──
  // Always a placeholder — the user knows their impact analysis better
  // than we do, but the heading prompts them to write it.
  lines.push('## Impact')
  lines.push('')
  lines.push('[Describe the security impact: confidentiality / integrity / availability, ' +
    'attacker prerequisites, what an exploiter could achieve.]')
  lines.push('')

  // ── Proof of concept ──
  lines.push('## Proof of concept')
  lines.push('')
  lines.push('```')
  lines.push('[Add reproduction steps, code, or curl commands here.]')
  lines.push('```')
  lines.push('')

  // ── Remediation ──
  lines.push('## Remediation')
  lines.push('')
  switch (cve.patch_status) {
    case 'patch_available':
      if (cve.patch_url?.trim()) {
        lines.push(`A patch is available. See the vendor advisory: <${cve.patch_url}>`)
      } else {
        lines.push('A patch is available. Update to the latest supported version of ' +
          `${product}.`)
      }
      break
    case 'no_patch':
      lines.push(`**No patch is available at the time of publication.** Users should ` +
        `evaluate exposure and consider mitigations such as [add workarounds here].`)
      break
    case 'wont_fix':
      lines.push(`The vendor has indicated this issue **will not be fixed**. Users should ` +
        `evaluate alternative products or compensating controls.`)
      break
    case 'unknown':
    default:
      lines.push('[Describe the available fix or mitigations.]')
      break
  }
  lines.push('')

  // ── Timeline ──
  // Pull every date we have, in chronological order. Skip rows we don't
  // know — better to omit than to print a placeholder for a date.
  lines.push('## Timeline')
  lines.push('')
  const timelineRows: string[] = []
  if (cve.date_discovered) {
    timelineRows.push(`- **${formatDate(cve.date_discovered)}**: Vulnerability discovered`)
  }
  if (cve.date_vendor_notified) {
    timelineRows.push(`- **${formatDate(cve.date_vendor_notified)}**: Vendor notified`)
  }
  if (cve.date_cve_requested) {
    timelineRows.push(`- **${formatDate(cve.date_cve_requested)}**: CVE requested`)
  }
  if (cve.escalated_to_vince === 1 && cve.vince_case_id?.trim()) {
    timelineRows.push(`- Escalated to CERT/CC VINCE (case ${cve.vince_case_id})`)
  }
  if (cve.date_disclosed) {
    timelineRows.push(`- **${formatDate(cve.date_disclosed)}**: Publicly disclosed`)
  }
  if (timelineRows.length === 0) {
    lines.push('[Add the discovery → disclosure timeline.]')
  } else {
    lines.push(...timelineRows)
  }
  lines.push('')

  // ── Credit ──
  lines.push('## Credit')
  lines.push('')
  lines.push('Discovered and reported by [Your name].')
  if (cve.bounty_status === 'paid') {
    lines.push('')
    lines.push(
      `This issue was reported through ${vendorName}'s bug bounty program` +
        (cve.bounty_amount ? ` (${cve.bounty_amount}).` : '.')
    )
  }
  lines.push('')

  // ── References ──
  // Pull whatever URLs we know. The user can add more after copying.
  lines.push('## References')
  lines.push('')
  const refs: string[] = []
  if (cve.cve_id?.trim()) {
    refs.push(`- [${cve.cve_id} on MITRE](https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cve.cve_id})`)
    refs.push(`- [${cve.cve_id} on NVD](https://nvd.nist.gov/vuln/detail/${cve.cve_id})`)
  }
  if (cve.patch_url?.trim()) {
    refs.push(`- [Vendor advisory / patch](${cve.patch_url})`)
  }
  if (cve.bounty_url?.trim()) {
    refs.push(`- [Bounty report](${cve.bounty_url})`)
  }
  if (refs.length === 0) {
    lines.push('[Add links to vendor advisories, NVD, related discussions, or PoC repositories.]')
  } else {
    lines.push(...refs)
  }
  lines.push('')

  return lines.join('\n')
}
