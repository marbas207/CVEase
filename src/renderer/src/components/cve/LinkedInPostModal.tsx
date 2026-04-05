import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { generateLinkedInPost } from '../../lib/linkedinPost'
import type { CVE, Swimlane } from '../../types/cve'
import { Copy, Check, Linkedin } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cve: CVE
  swimlane: Swimlane
}

export function LinkedInPostModal({ open, onOpenChange, cve, swimlane }: Props) {
  const [post, setPost] = useState(() => generateLinkedInPost(cve, swimlane))
  const [copied, setCopied] = useState(false)

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setPost(generateLinkedInPost(cve, swimlane))
    onOpenChange(isOpen)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-blue-400" />
            LinkedIn Post
          </DialogTitle>
          <DialogDescription>
            Edit the post below before copying. It's pre-filled with your CVE details.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={post}
          onChange={e => setPost(e.target.value)}
          className="flex-1 min-h-[400px] font-sans text-sm resize-none"
        />

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{post.length} characters</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleCopy} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
