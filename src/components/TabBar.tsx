import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden>
    {d}
  </svg>
)

const TABS = [
  { to: '/', label: 'Today', icon: icon(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" /></>) },
  { to: '/plan', label: 'Plan', icon: icon(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>) },
  { to: '/history', label: 'History', icon: icon(<><path d="M4 6h16M4 12h16M4 18h10" /></>) },
  { to: '/progress', label: 'Progress', icon: icon(<path d="M4 17l5-5 4 3 7-8" />) },
  { to: '/settings', label: 'Settings', icon: icon(<><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></>) },
]

export function TabBar() {
  // The exercise guide is opened from the Plan tab, so keep Plan highlighted there.
  const inGuide = useLocation().pathname.startsWith('/exercises')
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${isActive || (inGuide && t.to === '/plan') ? 'text-accent' : 'text-muted hover:text-text'}`
              }
            >
              {t.icon}
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
