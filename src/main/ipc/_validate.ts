import { z } from 'zod'

/**
 * Validate an IPC payload against a zod schema. On failure throws an Error
 * with a flat, human-readable message — the existing handler try/catch then
 * forwards it to the renderer via `{ success: false, error: String(e) }`,
 * which means form code can surface the message directly without parsing
 * any zod-specific structure.
 *
 * `label` should identify the channel (e.g. "cve:create") so a malformed
 * payload is traceable to the call site without a stack trace.
 */
export function validate<T>(schema: z.ZodType<T>, input: unknown, label: string): T {
  const result = schema.safeParse(input)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => {
        const path = issue.path.length ? `${issue.path.join('.')}: ` : ''
        return `${path}${issue.message}`
      })
      .join('; ')
    throw new Error(`${label} validation failed — ${issues}`)
  }
  return result.data
}
