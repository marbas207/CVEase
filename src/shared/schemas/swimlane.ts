import { z } from 'zod'
import { NonEmptyString, UrlField, IdString, LenientUrl } from './_common'

export const CreateSwimlaneInput = z
  .object({
    software_name: NonEmptyString,
    vendor: NonEmptyString,
    vendor_id: IdString.optional(),
    version_affected: z.string().optional(),
    url: UrlField,
    vendor_is_cna: z.boolean().optional(),
    bounty_in_scope: z.boolean().optional()
  })
  .strict()

export type CreateSwimlaneInput = z.infer<typeof CreateSwimlaneInput>

export const UpdateSwimlaneInput = z
  .object({
    software_name: NonEmptyString.optional(),
    vendor: NonEmptyString.optional(),
    vendor_id: IdString.optional(),
    version_affected: z.string().nullable().optional(),
    url: UrlField,
    vendor_is_cna: z.boolean().optional(),
    bounty_in_scope: z.boolean().optional()
  })
  .strict()

export type UpdateSwimlaneInput = z.infer<typeof UpdateSwimlaneInput>

export const SwimlaneIdArg = IdString
export const SetCollapsedArgs = z.tuple([IdString, z.boolean()])

// ──────────────────────────────────────────────────────────────────────────
// Form schema for SwimLaneForm.tsx (renderer-side, used by react-hook-form).
// ──────────────────────────────────────────────────────────────────────────

export const SwimlaneFormValues = z.object({
  software_name: NonEmptyString,
  vendor_id: z.string(), // required at submit time, starts empty
  url: LenientUrl,
  bounty_in_scope: z.boolean()
})

export type SwimlaneFormValues = z.infer<typeof SwimlaneFormValues>

export const SWIMLANE_FORM_DEFAULTS: SwimlaneFormValues = {
  software_name: '',
  vendor_id: '',
  url: '',
  bounty_in_scope: false
}
