import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('cvease-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore */ }
  return 'dark'
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  localStorage.setItem('cvease-theme', theme)
}

// Apply on module load so there's no flash
applyTheme(getInitialTheme())

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  }
}))
