import { useBoardStore } from '../../store/boardStore'
import { Button } from '../ui/button'
import { Trophy, X } from 'lucide-react'
import { useState } from 'react'

export function ArchiveBanner() {
  const { archiveEligible, archiveAllEligible } = useBoardStore()
  const [dismissed, setDismissed] = useState(false)
  const [archiving, setArchiving] = useState(false)

  if (archiveEligible.length === 0 || dismissed) return null

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await archiveAllEligible()
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/30 text-sm">
      <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
      <span className="flex-1 text-yellow-800 dark:text-yellow-200">
        <span className="font-semibold">{archiveEligible.length} CVE{archiveEligible.length !== 1 ? 's' : ''}</span>
        {' '}published 30+ days ago{archiveEligible.length !== 1 ? ' are' : ' is'} ready for the Hall of Fame.
      </span>
      <Button
        size="sm"
        className="h-7 text-xs bg-yellow-500 text-black hover:bg-yellow-400"
        onClick={handleArchive}
        disabled={archiving}
      >
        {archiving ? 'Archiving…' : '→ Move to Hall of Fame'}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-yellow-600/60 hover:text-yellow-800 dark:text-yellow-400/60 dark:hover:text-yellow-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
