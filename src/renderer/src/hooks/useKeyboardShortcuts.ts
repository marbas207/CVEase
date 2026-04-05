import { useEffect, useCallback } from 'react'

interface ShortcutAction {
  key: string
  ctrl?: boolean
  shift?: boolean
  action: () => void
  description: string
}

export const SHORTCUT_DEFS: Omit<ShortcutAction, 'action'>[] = [
  { key: 'n', ctrl: true, description: 'New vulnerability' },
  { key: 'n', ctrl: true, shift: true, description: 'New vendor' },
  { key: 'Escape', description: 'Close panel / dialog' },
  { key: '1', ctrl: true, description: 'Go to Dashboard' },
  { key: '2', ctrl: true, description: 'Go to Board' },
  { key: '3', ctrl: true, description: 'Go to Timeline' },
  { key: '4', ctrl: true, description: 'Go to Hall of Fame' },
  { key: '5', ctrl: true, description: 'Go to Settings' },
  { key: '/', ctrl: true, description: 'Show keyboard shortcuts' },
]

export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  const handler = useCallback((e: KeyboardEvent) => {
    // Don't fire shortcuts when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      // Only allow Escape in inputs
      if (e.key !== 'Escape') return
    }

    for (const s of shortcuts) {
      const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
      const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey
      if (e.key.toLowerCase() === s.key.toLowerCase() && ctrlMatch && shiftMatch) {
        e.preventDefault()
        s.action()
        return
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handler])
}
