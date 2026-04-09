import { z } from 'zod'
import { Stage, NonEmptyString, IdString } from './_common'

export const CompleteTodoInput = z
  .object({
    completion_note: z.string().optional()
  })
  .strict()

export type CompleteTodoInput = z.infer<typeof CompleteTodoInput>

export const TodoListArg = IdString // cveId
export const TodoCreateDefaultArg = IdString // cveId
export const TodoCreateArgs = z.tuple([
  IdString, // cveId
  NonEmptyString, // text
  Stage.optional() // triggerStage
])
export const TodoCompleteArgs = z.tuple([IdString, CompleteTodoInput])
export const TodoIdArg = IdString
