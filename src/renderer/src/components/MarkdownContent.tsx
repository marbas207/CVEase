import ReactMarkdown from 'react-markdown'
import { cn } from '../lib/utils'

interface Props {
  content: string
  className?: string
}

/**
 * Renders user-provided markdown text. By default react-markdown escapes
 * raw HTML in the source — we deliberately do NOT enable rehypeRaw, so
 * users can't inject `<script>` or other tags via the description field.
 *
 * Styling comes from @tailwindcss/typography (`prose` classes), with the
 * `dark:prose-invert` variant flipping for the app's dark theme. The
 * outer wrapper sets a smaller scale (`prose-sm`) since the description
 * lives inside a modal card.
 *
 * The class overrides at the bottom keep code blocks visually consistent
 * with the rest of the app's monospace boxes (muted background, no
 * extra prose decoration).
 */
export function MarkdownContent({ content, className }: Props) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        // Tighten heading margins for the small modal context.
        'prose-headings:mt-3 prose-headings:mb-2 prose-headings:font-semibold',
        // Code blocks: match the muted box style we use elsewhere.
        'prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:text-foreground',
        'prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        // Links use the app's primary color and behave as external (the
        // global will-navigate handler in main/index.ts intercepts them).
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        // Lists/paragraphs slightly tighter for the modal.
        'prose-p:my-2 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2',
        className
      )}
    >
      <ReactMarkdown
        components={{
          // Force all anchors to open externally so they go through
          // Electron's setWindowOpenHandler → shell.openExternal.
          a: ({ href, children, ...props }) => (
            <a href={href} target="_blank" rel="noreferrer" {...props}>
              {children}
            </a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
