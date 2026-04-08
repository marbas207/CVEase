import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { generateDisclosureEmail } from '../../lib/disclosureEmail'
import type { CVE, Swimlane, Vendor } from '../../types/cve'
import { Copy, Check, Mail, ExternalLink } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cve: CVE
  swimlane: Swimlane
  vendor: Vendor | undefined
}

/**
 * Draft the initial disclosure email for a CVE. Mirrors `LinkedInPostModal`:
 * pure-function generator → editable fields → copy to clipboard.
 *
 * The "Open in mail client" button uses a `mailto:` URL. That's intentionally
 * a best-effort fallback — long bodies and special characters round-trip
 * imperfectly through `mailto:`, so for serious use the user should copy and
 * paste into their actual mail client. The mailto button is convenient for
 * the common short-email case.
 */
export function DisclosureEmailModal({ open, onOpenChange, cve, swimlane, vendor }: Props) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [copied, setCopied] = useState(false)

  // Regenerate from current data whenever the dialog opens. We don't want to
  // preserve user edits across closes — the user explicitly asked to draft
  // again, so they probably want a fresh draft.
  useEffect(() => {
    if (open) {
      const draft = generateDisclosureEmail(cve, swimlane, vendor)
      setTo(draft.to)
      setSubject(draft.subject)
      setBody(draft.body)
      setCopied(false)
    }
  }, [open, cve, swimlane, vendor])

  const handleCopy = async () => {
    // Combine subject + body so a single paste lands "Subject: X\n\nBody"
    // somewhere meaningful. Real mail clients usually have separate subject
    // / body fields, but this is the most generally useful single-blob copy.
    const combined = `Subject: ${subject}\n\n${body}`
    await navigator.clipboard.writeText(combined)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyBodyOnly = async () => {
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenInMail = () => {
    // mailto: is best-effort. We use encodeURIComponent (RFC 3986 %20) rather
    // than URLSearchParams (which encodes spaces as +, an HTML form convention
    // mail handlers don't translate back). The OS handler may still truncate
    // or mangle very large bodies — that's why we keep the copy button as the
    // primary action.
    const href =
      `mailto:${encodeURIComponent(to)}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`
    window.open(href, '_self')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Disclosure Email Draft
          </DialogTitle>
          <DialogDescription>
            Pre-filled from this vulnerability and the vendor record. Edit before copying; every disclosure is a little different.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 flex-1 min-h-0 overflow-y-auto">
          <div className="grid gap-1.5">
            <Label htmlFor="email-to" className="text-xs">To</Label>
            <Input
              id="email-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="security@vendor.com"
              className="font-mono text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="email-subject" className="text-xs">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="grid gap-1.5 flex-1 min-h-0">
            <Label htmlFor="email-body" className="text-xs">Body</Label>
            <Textarea
              id="email-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 min-h-[320px] font-mono text-xs resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 gap-2">
          <span className="text-xs text-muted-foreground">{body.length} characters</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button
              variant="outline"
              onClick={handleOpenInMail}
              disabled={!to.trim()}
              className="gap-2"
              title={to.trim() ? 'Open in default mail client' : 'No recipient set'}
            >
              <ExternalLink className="w-4 h-4" />
              Mail client
            </Button>
            <Button variant="outline" onClick={handleCopyBodyOnly} className="gap-2">
              <Copy className="w-4 h-4" />
              Body only
            </Button>
            <Button onClick={handleCopy} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
