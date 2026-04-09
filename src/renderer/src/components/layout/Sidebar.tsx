import { NavLink } from 'react-router-dom'
import { Gauge, Columns3, CalendarDays, Settings, Trophy, Sun, Moon, Info, HelpCircle } from 'lucide-react'
import iconLight from '../../assets/cvease-icon-light.svg'
import iconDark from '../../assets/cvease-icon-dark.svg'
import { CVEaseWordmark } from '../CVEaseWordmark'
import { cn } from '../../lib/utils'
import { useThemeStore } from '../../store/themeStore'

interface Props {
  hofCount?: number
  urgentCount?: number
  /** Optional callback wired to a "Help" button at the bottom of the sidebar. */
  onShowTour?: () => void
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', Icon: Gauge },
  { to: '/board', label: 'Board', Icon: Columns3 },
  { to: '/calendar', label: 'Calendar', Icon: CalendarDays },
  { to: '/hof', label: 'Hall of Fame', Icon: Trophy },
  { to: '/settings', label: 'Settings', Icon: Settings }
] as const

const NAV_BASE = 'relative flex flex-col items-center gap-1 w-[76px] py-2 rounded-lg transition-colors'
const NAV_INACTIVE = 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
const NAV_ACTIVE = 'bg-sidebar-accent text-sidebar-accent-foreground'

export function Sidebar({ hofCount = 0, urgentCount = 0, onShowTour }: Props) {
  const { theme, toggle } = useThemeStore()

  return (
    <aside className="w-[88px] bg-sidebar border-r border-sidebar-border flex flex-col items-center pt-8 pb-3 gap-1 shrink-0">
      {/* Branding — extra top padding for macOS traffic lights. The icon
          swaps light/dark variant via Tailwind dark: class so the inner
          checkmark stays visible against either sidebar background. */}
      <NavLink to="/dashboard" className="mb-4 flex flex-col items-center gap-1 group">
        <div className="p-1 rounded-xl group-hover:bg-sidebar-accent/40 transition-colors">
          <img src={iconLight} alt="CVEase" className="block dark:hidden w-10 h-10" />
          <img src={iconDark} alt="CVEase" className="hidden dark:block w-10 h-10" />
        </div>
        <CVEaseWordmark className="text-xs" />
      </NavLink>

      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) => cn(NAV_BASE, isActive ? NAV_ACTIVE : NAV_INACTIVE)}
        >
          <Icon className="w-5 h-5" />
          <span className="text-[11px] leading-none">{label}</span>
          {to === '/dashboard' && urgentCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {urgentCount}
            </span>
          )}
          {to === '/hof' && hofCount > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-yellow-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {hofCount}
            </span>
          )}
        </NavLink>
      ))}

      {/* Spacer + bottom items */}
      <div className="mt-auto" />
      {onShowTour && (
        <button
          onClick={onShowTour}
          title="Take a quick tour of CVEase features"
          className={cn(NAV_BASE, NAV_INACTIVE)}
        >
          <HelpCircle className="w-5 h-5" />
          <span className="text-[11px] leading-none">Help</span>
        </button>
      )}
      <NavLink
        to="/about"
        title="About"
        className={({ isActive }) => cn(NAV_BASE, isActive ? NAV_ACTIVE : NAV_INACTIVE)}
      >
        <Info className="w-5 h-5" />
        <span className="text-[11px] leading-none">About</span>
      </NavLink>
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
