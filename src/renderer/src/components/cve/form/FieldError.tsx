/** Tiny shared component for inline validation errors under form inputs. */
export function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null
  return <p className="text-[11px] text-destructive mt-0.5">{message}</p>
}
