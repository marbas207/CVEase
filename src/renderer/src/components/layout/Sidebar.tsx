import { Gauge, Columns3, Clock, Settings, Trophy, Sun, Moon, Info } from 'lucide-react'
import appIcon from '../../assets/app-icon.png'
import { cn } from '../../lib/utils'
import { useThemeStore } from '../../store/themeStore'

type Page = 'dashboard' | 'board' | 'timeline' | 'hof' | 'settings' | 'about'

interface Props {
  currentPage: Page
  onNavigate: (page: Page) => void
  hofCount?: number
  urgentCount?: number
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', Icon: Gauge },
  { id: 'board' as Page, label: 'Board', Icon: Columns3 },
  { id: 'timeline' as Page, label: 'Timeline', Icon: Clock },
  { id: 'hof' as Page, label: 'Hall of Fame', Icon: Trophy },
  { id: 'settings' as Page, label: 'Settings', Icon: Settings }
]

export function Sidebar({ currentPage, onNavigate, hofCount = 0, urgentCount = 0 }: Props) {
  const { theme, toggle } = useThemeStore()

  return (
    <aside className="w-[88px] bg-sidebar border-r border-sidebar-border flex flex-col items-center pt-8 pb-3 gap-1 shrink-0">
      {/* Branding - extra top padding for macOS traffic lights */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="mb-4 flex flex-col items-center gap-1 group"
      >
        <div className="p-1.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <img src={appIcon} alt="CVEase" className="w-9 h-9 rounded-lg" />
        </div>
        <span className="text-xs font-bold text-primary tracking-tight">CVEase</span>
      </button>

      {navItems.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          title={label}
          className={cn(
            'relative flex flex-col items-center gap-1 w-[76px] py-2 rounded-lg transition-colors',
            currentPage === id
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
          )}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[11px] leading-none">{label}</span>
          {id === 'dashboard' && urgentCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {urgentCount}
            </span>
          )}
          {id === 'hof' && hofCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-yellow-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {hofCount}
            </span>
          )}
        </button>
      ))}

      {/* Spacer + bottom items */}
      <div className="mt-auto" />
      <button
        onClick={() => onNavigate('about')}
        title="About"
        className={cn(
          'relative flex flex-col items-center gap-1 w-[76px] py-2 rounded-lg transition-colors',
          currentPage === 'about'
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
        )}
      >
        <Info className="w-5 h-5" />
        <span className="text-[11px] leading-none">About</span>
      </button>
      <button
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex flex-col items-center gap-1 w-[76px] py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
      >
        {theme === 'dark'
          ? <Sun className="w-5 h-5" />
          : <Moon className="w-5 h-5" />}
        <span className="text-[11px] leading-none">{theme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>
    </aside>
  )
}
