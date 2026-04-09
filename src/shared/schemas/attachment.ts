import { z } from 'zod'
import { NonEmptyString, IdString } from './_common'

export const AttachmentListArg = IdString // cveId
export const AttachmentImportArgs = z.tuple([IdString /* cveId */, NonEmptyString /* sourcePath */])
// `attachment:openPath` and `attachment:delete` deliberately stay loose at
// the schema layer — the openPath handler does its own filesystem-bound
// path-traversal check, and delete only takes an opaque ID.
export const AttachmentOpenPathArg = NonEmptyString
export const AttachmentDeleteArg = IdString
