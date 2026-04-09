import { useState, useEffect } from 'react'
import { api } from '../../lib/ipc'
import { formatFileSize } from '../../lib/utils'
import type { Attachment } from '../../types/cve'
import { Button } from '../ui/button'
import { Paperclip, Trash2, ExternalLink } from 'lucide-react'

interface Props {
  cveId: string
}

export function AttachmentList({ cveId }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    api.attachment.list(cveId).then(setAttachments).catch(console.error)
  }, [cveId])

  const handleImport = async () => {
    setImporting(true)
    try {
      const paths = await api.attachment.showPicker()
      for (const path of paths) {
        const attachment = await api.attachment.import(cveId, path)
        setAttachments(prev => [...prev, attachment])
      }
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async (id: string) => {
    await api.attachment.delete(id)
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Attachments</p>
        <Button variant="ghost" size="sm" onClick={handleImport} disabled={importing} className="h-7 gap-1 text-xs">
          <Paperclip className="w-3 h-3" />
          {importing ? 'Attaching…' : 'Attach File'}
        </Button>
      </div>

      {attachments.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No attachments.</p>
      )}

      <div className="space-y-1">
        {attachments.map(att => (
          <div key={att.id} className="group flex items-center gap-2 text-sm rounded-md px-2 py-1.5 hover:bg-muted/40">
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate text-xs">{att.filename}</span>
            {att.size_bytes && (
              <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(att.size_bytes)}</span>
            )}
            <button
              onClick={() => api.attachment.openPath(att.filepath)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
              title="Open file"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDelete(att.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              title="Remove attachment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
