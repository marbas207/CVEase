import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { generateAdvisoryMarkdown } from '../../lib/advisoryMarkdown'
import type { CVE, Swimlane, Vendor } from '../../types/cve'
import { Copy, Check, FileText } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cve: CVE
  swimlane: Swimlane
  vendor: Vendor | undefined
}

/**
 * Draft a publication-ready advisory in Markdown. Mirrors the LinkedIn /
 * disclosure email modals: pure-function generator → editable textarea →
 * copy to clipboard → user pastes into their publishing destination
 * (blog, GitHub Security Advisory, gist, vendor portal).
 *
 * Regenerates from current CVE data on every open — the user can edit
 * during the session, but reopening reflects whatever's been updated on
 * the underlying record.
 */
export function AdvisoryMarkdownModal({ open, onOpenChange, cve, swimlane, vendor }: Props) {
  const [markdown, setMarkdown] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      setMarkdown(generateAdvisoryMarkdown(cve, swimlane, vendor))
      setCopied(false)
    }
  }, [open, cve, swimlane, vendor])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Advisory Draft (Markdown)
          </DialogTitle>
          <DialogDescription>
            Pre-filled from this vulnerability and the vendor record. Edit before copying; every advisory has its own voice.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="flex-1 min-h-[480px] font-mono text-xs resize-none"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{markdown.length} characters</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleCopy} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy markdown'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
