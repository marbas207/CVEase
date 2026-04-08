import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { tagsFromString, tagsToString } from '../../../lib/tags'

interface Props {
  /** Comma-separated string. */
  value: string
  /** Called with the new comma-separated string. */
  onChange: (value: string) => void
  placeholder?: string
}

/**
 * Chip-style tag input. The wire format is a comma-separated string —
 * the same shape we store in the DB — but the user sees individual chips
 * with X buttons. Enter or comma adds the current draft as a chip;
 * Backspace on an empty draft removes the last chip.
 *
 * The form state is the comma-separated string (matched to the schema),
 * so this works as a controlled input via react-hook-form's Controller.
 */
export function TagInput({ value, onChange, placeholder }: Props) {
  const [draft, setDraft] = useState('')
  const tags = tagsFromString(value)

  const addTag = (text: string) => {
    const t = text.trim()
    if (!t) return
    if (tags.includes(t)) {
      setDraft('')
      return
    }
    onChange(tagsToString([...tags, t]))
    setDraft('')
  }

  const removeTag = (idx: number) => {
    onChange(tagsToString(tags.filter((_, i) => i !== idx)))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      // Backspace on empty draft removes the last chip — standard chip-input behavior.
      removeTag(tags.length - 1)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1 items-center bg-background border border-input rounded-md px-2 py-1.5 min-h-[36px]',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
      )}
      onClick={(e) => {
        // Click anywhere in the box → focus the input. Improves the
        // "click to add a tag" affordance.
        const input = (e.currentTarget as HTMLDivElement).querySelector('input')
        input?.focus()
      }}
    >
      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 text-xs font-medium bg-primary/15 text-primary rounded px-1.5 py-0.5"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(i)
            }}
            aria-label={`Remove tag ${tag}`}
            className="hover:text-destructive transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          // Commit a half-typed tag if the user blurs without pressing Enter.
          if (draft.trim()) addTag(draft)
        }}
        placeholder={tags.length === 0 ? (placeholder ?? 'Add tags…') : ''}
        className="flex-1 min-w-[80px] outline-none bg-transparent text-sm placeholder:text-muted-foreground"
      />
    </div>
  )
}
