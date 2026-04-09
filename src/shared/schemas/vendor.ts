import { z } from 'zod'
import { NonEmptyString, UrlField, EmailField, IdString, emptyOr, LenientUrl } from './_common'

export const CreateVendorInput = z
  .object({
    name: NonEmptyString,
    security_contact_name: z.string().optional(),
    security_contact_email: EmailField,
    security_contact_other: z.string().optional(),
    is_cna: z.boolean().optional(),
    has_bounty_program: z.boolean().optional(),
    bounty_program_url: UrlField,
    url: UrlField,
    notes: z.string().optional()
  })
  .strict()

export type CreateVendorInput = z.infer<typeof CreateVendorInput>

export const UpdateVendorInput = z
  .object({
    name: NonEmptyString.optional(),
    security_contact_name: z.string().nullable().optional(),
    security_contact_email: EmailField,
    security_contact_other: z.string().nullable().optional(),
    is_cna: z.boolean().optional(),
    has_bounty_program: z.boolean().optional(),
    bounty_program_url: UrlField,
    url: UrlField,
    notes: z.string().nullable().optional()
  })
  .strict()

export type UpdateVendorInput = z.infer<typeof UpdateVendorInput>

export const VendorIdArg = IdString

// ──────────────────────────────────────────────────────────────────────────
// Form schema for VendorForm.tsx (renderer-side, used by react-hook-form).
// ──────────────────────────────────────────────────────────────────────────

export const VendorFormValues = z.object({
  name: NonEmptyString,
  security_contact_name: z.string(),
  security_contact_email: emptyOr(z.string().email('Must be a valid email address')),
  security_contact_other: z.string(),
  is_cna: z.boolean(),
  has_bounty_program: z.boolean(),
  bounty_program_url: LenientUrl,
  url: LenientUrl,
  notes: z.string()
})

export type VendorFormValues = z.infer<typeof VendorFormValues>

export const VENDOR_FORM_DEFAULTS: VendorFormValues = {
  name: '',
  security_contact_name: '',
  security_contact_email: '',
  security_contact_other: '',
  is_cna: false,
  has_bounty_program: false,
  bounty_program_url: '',
  url: '',
  notes: ''
}
