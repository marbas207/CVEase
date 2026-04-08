import { z } from 'zod'
import { NonEmptyString, IdString } from './_common'

export const TemplateCreateArgs = z.tuple([NonEmptyString /* text */, z.number().int() /* sortOrder */])
export const TemplateUpdateArgs = z.tuple([IdString, NonEmptyString])
export const TemplateDeleteArg = IdString
export const TemplateReorderInput = z.array(
  z.object({ id: IdString, sort_order: z.number().int() }).strict()
)
