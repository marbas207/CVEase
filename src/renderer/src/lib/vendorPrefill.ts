import type { CVE, Swimlane, Vendor, UpdateCVEInput } from '../types/cve'

/**
 * When a CVE moves into Vendor Contacted stage via a path that bypasses the
 * form (drag-drop on the kanban board, todo completion that triggers the
 * stage change), the contact fields on the CVE may still be empty even
 * though the vendor record knows them. This helper produces the partial
 * update needed to fill the gaps.
 *
 * Rules:
 *   - Only fills fields that are *empty* on the CVE — never overwrites
 *     anything the user has manually set.
 *   - Returns an empty object when there's nothing to do (no vendor wired
 *     up, no info on the vendor record, or the CVE already has all three).
 *   - Caller is responsible for deciding *when* to invoke this; the helper
 *     is shape-only and doesn't gate on stage.
 */
export function vendorContactPrefill(
  cve: CVE,
  swimlanes: Swimlane[],
  vendors: Vendor[]
): Partial<UpdateCVEInput> {
  const lane = swimlanes.find((s) => s.id === cve.swimlane_id)
  if (!lane?.vendor_id) return {}
  const vendor = vendors.find((v) => v.id === lane.vendor_id)
  if (!vendor) return {}

  const out: Partial<UpdateCVEInput> = {}
  if (!cve.vendor_contact_name && vendor.security_contact_name) {
    out.vendor_contact_name = vendor.security_contact_name
  }
  if (!cve.vendor_contact_email && vendor.security_contact_email) {
    out.vendor_contact_email = vendor.security_contact_email
  }
  if (!cve.vendor_contact_other && vendor.security_contact_other) {
    out.vendor_contact_other = vendor.security_contact_other
  }
  return out
}
