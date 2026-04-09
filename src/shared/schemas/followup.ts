import { z } from 'zod'
import { ActivityType, NonEmptyString, IdString, DateField } from './_common'

export const CreateFollowUpInput = z
  .object({
    type: ActivityType.optional(),
    note: NonEmptyString,
    occurred_at: DateField
  })
  .strict()

export type CreateFollowUpInput = z.infer<typeof CreateFollowUpInput>

export const FollowUpListArg = IdString // cveId
export const FollowUpCreateArgs = z.tuple([IdString, CreateFollowUpInput])
export const FollowUpDeleteArg = IdString
