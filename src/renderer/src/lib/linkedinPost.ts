import type { CVE, Swimlane } from '../types/cve'
import { formatDate } from './utils'

const SEVERITY_HEADLINE: Record<string, string> = {
  Critical: 'a Critical-severity',
  High: 'a High-severity',
  Medium: 'a Medium-severity',
  Low: 'a Low-severity'
}

function excerptDescription(description: string | null, maxChars = 280): string {
  if (!description) return ''
  const clean = description.trim().replace(/\r?\n+/g, ' ')
  if (clean.length <= maxChars) return clean
  return clean.slice(0, maxChars).replace(/\s\S*$/, '') + '…'
}

export function generateLinkedInPost(cve: CVE, swimlane: Swimlane): string {
  const cveLabel = cve.cve_id ?? 'Security Vulnerability'
  const severityDesc = SEVERITY_HEADLINE[cve.severity] ?? 'a'
  const product = swimlane.software_name
  const vendor = swimlane.vendor
  const version = cve.affected_versions ? ` (v${cve.affected_versions})` : ''

  const discovered = cve.date_discovered ? `📅 Discovered:       ${formatDate(cve.date_discovered)}` : null
  const notified = cve.date_vendor_notified ? `📧 Vendor Notified:  ${formatDate(cve.date_vendor_notified)}` : null
  const cveReq = cve.date_cve_requested ? `🔖 CVE Requested:    ${formatDate(cve.date_cve_requested)}` : null
  const published = cve.date_disclosed ? `✅ Published:        ${formatDate(cve.date_disclosed)}` : null

  const timeline = [discovered, notified, cveReq, published]
    .filter(Boolean)
    .join('\n')

  const excerpt = excerptDescription(cve.description)

  const lines: string[] = [
    `🔒 Security Research: ${cveLabel}`,
    '',
    `I'm excited to share ${severityDesc} vulnerability I disclosed in ${product}${version} by ${vendor}.`,
    '',
  ]

  if (excerpt) {
    lines.push(excerpt)
    lines.push('')
  }

  if (timeline) {
    lines.push('📆 Timeline')
    lines.push(timeline)
    lines.push('')
  }

  // Patch status + closing
  if (cve.patch_status === 'patch_available') {
    lines.push(`🛡️ A patch is available${cve.patch_url ? `: ${cve.patch_url}` : '. Users should update immediately.'}`)
    lines.push('')
    lines.push(`Thanks to everyone who helped get this one closed up. Happy to answer questions about the process.`)
  } else if (cve.patch_status === 'no_patch') {
    lines.push('⚠️ No patch is currently available. Users are urged to contact the vendor for a fix or consider upgrading to a supported version.')
    lines.push('')
    lines.push('Happy to answer questions about the disclosure process.')
  } else if (cve.patch_status === 'wont_fix') {
    lines.push('⚠️ The vendor has indicated they will not fix this issue. Users should evaluate the risk and consider alternative mitigations.')
    lines.push('')
    lines.push('Happy to answer questions about the disclosure process.')
  } else {
    lines.push('Happy to answer questions about the disclosure process.')
  }

  lines.push(
    '',
    '#CyberSecurity #CVE #VulnerabilityDisclosure #VulnerabilityResearch #BugBounty #SecurityResearch #InfoSec'
  )

  return lines.join('\n')
}
