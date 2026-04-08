import type { CVE, Vendor, Swimlane } from '../types/cve'
import { formatDate } from './utils'

export interface DisclosureEmail {
  to: string
  subject: string
  body: string
}

/**
 * Build a draft initial-disclosure email from a CVE + its vendor + swimlane.
 *
 * Same pattern as `linkedinPost.ts`: a pure function the user invokes via a
 * modal, edits as needed, and copies to their real mail client. The point is
 * not "send the email for the user" — it's "you don't have to remember how
 * to write a good first-contact email at 11pm."
 *
 * Tone is intentionally professional and respectful, and intentionally
 * channel-neutral: at first contact we don't yet know whether this becomes
 * a CVE, a bug bounty submission, or an internal advisory. The wording lets
 * the vendor pick the track that fits their process.
 */
export function generateDisclosureEmail(
  cve: CVE,
  swimlane: Swimlane,
  vendor: Vendor | undefined
): DisclosureEmail {
  const product = swimlane.software_name
  const vendorName = vendor?.name ?? swimlane.vendor
  const version = cve.affected_versions ? ` ${cve.affected_versions}` : ''

  const subject = `Security vulnerability report: ${product}${version}`

  // Greeting: prefer the contact's actual name if we have it; fall back to
  // a polite generic.
  const greetingName = (cve.vendor_contact_name?.trim() || vendor?.security_contact_name?.trim() || '').trim()
  const greeting = greetingName
    ? `Hello ${greetingName},`
    : `Hello ${vendorName} security team,`

  const lines: string[] = []
  lines.push(greeting)
  lines.push('')
  lines.push(
    `I'm reaching out to report a security vulnerability I've identified in ${product}${version}. ` +
      `I'd like to coordinate with your team on next steps, and I'm happy to follow whatever process works best on your end ` +
      `(internal advisory, bug bounty program, public CVE, or some combination).`
  )
  lines.push('')

  // Summary section
  lines.push('── Summary ──')
  lines.push(`Product:           ${product}${version}`)
  if (cve.affected_component) lines.push(`Affected component: ${cve.affected_component}`)
  lines.push(`Severity:          ${cve.severity}`)
  if (cve.cvss_vector) lines.push(`CVSS:              ${cve.cvss_vector}`)
  if (cve.cwe_id) lines.push(`CWE:               ${cve.cwe_id}`)
  lines.push('')

  // Title / one-liner
  lines.push('── Issue ──')
  lines.push(cve.title)
  lines.push('')

  // Description / repro — only if present. We strip leading/trailing whitespace
  // but preserve the user's line breaks since they may have written real steps.
  if (cve.description?.trim()) {
    lines.push('── Technical detail ──')
    lines.push(cve.description.trim())
    lines.push('')
  } else {
    lines.push('── Technical detail ──')
    lines.push('[Add a brief technical description and reproduction steps here.]')
    lines.push('')
  }

  // Proof of concept placeholder
  lines.push('── Proof of concept ──')
  lines.push('A proof of concept is available on request, or attached to this message.')
  lines.push('')

  // Proposed timeline — the user's suggested 90-day clock as a starting
  // point for negotiation, not a demand. Channel-neutral framing so this
  // works for CVE, bug bounty, or internal-advisory tracks.
  lines.push('── Proposed timeline ──')
  if (cve.date_discovered) {
    lines.push(`Discovered:         ${formatDate(cve.date_discovered)}`)
  }
  lines.push(`Reported to vendor: ${formatDate(new Date().toISOString().slice(0, 10))}`)
  if (cve.disclosure_deadline) {
    lines.push(`Public disclosure:  on or after ${formatDate(cve.disclosure_deadline)}, happy to negotiate`)
  } else {
    lines.push('Public disclosure:  proposed ~90 days from this report, happy to negotiate')
  }
  lines.push('')

  // Closing — open-ended questions that don't presume any particular
  // remediation track.
  lines.push(`I'd appreciate hearing back on a few things when you have time:`)
  lines.push('  • Acknowledgement of receipt')
  lines.push('  • Whether you can reproduce the issue')
  lines.push('  • Your expected remediation timeline')
  lines.push('  • Your preferred channel for tracking and credit (advisory, bug bounty, CVE, etc.)')
  lines.push('')
  lines.push("Thank you for maintaining a security contact and for your time on this.")
  lines.push('')
  lines.push('Best regards,')
  lines.push('[Your name]')

  // To: prefer the per-CVE contact email, fall back to the vendor's general
  // security email. Empty string is fine — the modal will show it as blank.
  const to = (cve.vendor_contact_email?.trim() || vendor?.security_contact_email?.trim() || '').trim()

  return {
    to,
    subject,
    body: lines.join('\n')
  }
}
