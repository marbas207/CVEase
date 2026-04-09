import { cn } from '../lib/utils'

/**
 * The brand wordmark "CVEase" rendered in Manrope ExtraBold. Color is
 * inherited from `text-foreground` so it automatically reads as near-black
 * on light theme and near-white on dark theme — keeping it legible at the
 * small sizes where the wordmark appears (sidebar label, top bar prefix).
 *
 * Pass any className for sizing or color override. Use `text-sm`,
 * `text-lg`, etc.
 */
interface Props {
  className?: string
}

export function CVEaseWordmark({ className }: Props) {
  return (
    <span className={cn('cvease-wordmark text-foreground', className)}>
      CVEase
    </span>
  )
}
