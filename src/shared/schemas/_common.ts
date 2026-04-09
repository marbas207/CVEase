/**
 * Shared validation primitives used across every domain schema.
 *
 * These live in `src/shared/` so the same definitions can be imported by
 * the main process (where they validate IPC inputs) and by the renderer
 * (where the inferred types feed React form code).
 */
import { z } from 'zod'

// ──────────────────────────────────────────────────────────────────────────
// Enums — mirror the CHECK constraints in the SQLite schema. Keeping these
// in one place means a typo in the renderer can't slip past either layer.
// ──────────────────────────────────────────────────────────────────────────

export const Severity = z.enum(['Critical', 'High', 'Medium', 'Low'])
export type Severity = z.infer<typeof Severity>

export const Stage = z.enum([
  'Discovery',
  'Vendor Contacted',
  'Negotiating',
  'CVE Requested',
  'Published'
])
export type Stage = z.infer<typeof Stage>

export const PatchStatus = z.enum(['unknown', 'no_patch', 'patch_available', 'wont_fix'])
export type PatchStatus = z.infer<typeof PatchStatus>

export const BountyStatus = z.enum(['none', 'submitted', 'approved', 'paid', 'rejected'])
export type BountyStatus = z.infer<typeof BountyStatus>

export const ActivityType = z.enum([
  'Email Sent',
  'Email Received',
  'Phone Call',
  'Meeting',
  'CVE Requested',
  'Note'
])
export type ActivityType = z.infer<typeof ActivityType>

// ──────────────────────────────────────────────────────────────────────────
// Field validators — reused across CVE / vendor / swimlane schemas.
// ──────────────────────────────────────────────────────────────────────────

/**
 * Canonical CVE identifier. Spec format is `CVE-YYYY-NNNN+` with at least
 * four digits in the sequence portion. We don't try to enforce a year
 * range — historical IDs go back to 1999, future ones are unbounded.
 */
export const CVE_ID_REGEX = /^CVE-\d{4}-\d{4,7}$/

export const CveIdString = z
  .string()
  .regex(CVE_ID_REGEX, 'CVE ID must look like CVE-2024-12345 (4–7 digit suffix)')

/**
 * Used by IPC payloads where the field is optional and can be cleared.
 * Accepts: omitted, null, or a valid CVE-formatted string.
 */
export const CveIdField = CveIdString.nullable().optional()

/**
 * Permissive URL validator. Accepts any well-formed absolute URL (http,
 * https, ftp, mailto, etc.). Empty strings should be normalised to null
 * by the caller before reaching the IPC boundary — we don't accept '' here.
 */
export const UrlField = z.string().url('Must be a valid URL').nullable().optional()

/**
 * Email validator with the same nullable/optional rules as UrlField.
 */
export const EmailField = z.string().email('Must be a valid email address').nullable().optional()

/**
 * Non-empty trimmed string — used for required free-text fields like
 * `title`, `software_name`, `vendor.name` where the renderer is supposed
 * to have already trimmed and rejected empties.
 */
export const NonEmptyString = z.string().trim().min(1, 'Cannot be empty')

/**
 * ISO date or datetime string. We don't pin to a strict format because
 * the renderer mixes date-only (`YYYY-MM-DD`) and full ISO timestamps
 * depending on the field. We just refuse outright junk.
 */
export const DateString = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), 'Must be a valid date')

export const DateField = DateString.nullable().optional()

/**
 * UUID string — used for `id`, `swimlane_id`, `vendor_id` etc. We don't
 * use `z.string().uuid()` because some legacy IDs predate the migration
 * to uuidv4 and may not match strictly. A non-empty string is enough at
 * the IPC boundary; the foreign key checks in SQLite catch real mismatches.
 */
export const IdString = NonEmptyString

/**
 * Helper for renderer form schemas: HTML inputs default to '' rather than
 * undefined/null, so every "optional formatted" field has to accept an
 * empty string in addition to a valid one. Use this in form schemas:
 *
 *     patch_url: emptyOr(z.string().url(...))
 */
export const emptyOr = <T extends z.ZodTypeAny>(schema: T) => z.literal('').or(schema)

/**
 * Lenient URL validator for renderer form fields. Accepts:
 *   - bare hostnames like `google.com` or `www.google.com`
 *   - full URLs with `http://` or `https://`
 *   - URLs with paths like `example.com/path`
 *
 * Auto-prefixes `https://` when the user omits the scheme — it's almost
 * always what they meant. The transformed (canonical) value is what flows
 * through to the form's submit handler and the IPC layer.
 *
 * The IPC schemas deliberately stay strict (`UrlField`) — auto-prefixing
 * is a UX nicety for forms, not a contract for the IPC boundary.
 */
export const LenientUrl = z
  .string()
  .trim()
  .transform((val, ctx) => {
    if (val === '') return ''
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(val) ? val : `https://${val}`
    try {
      // Reject single-token strings with no dot (e.g. "foo") — those almost
      // always mean a typo, not a hostname.
      const parsed = new URL(withScheme)
      if (!parsed.hostname.includes('.')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be a valid URL or domain (e.g. example.com)' })
        return z.NEVER
      }
      return withScheme
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Must be a valid URL or domain (e.g. example.com)' })
      return z.NEVER
    }
  })
