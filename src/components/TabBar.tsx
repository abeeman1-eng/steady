import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="size-[22px]" aria-hidden>
    {d}
  </svg>
)

const TABS = [
  { to: '/', label: 'Today', icon: icon(<><path d="M3.5 10.5 12 4l8.5 6.5" /><path d="M5.5 9v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9" /><path d="M10 20v-5h4v5" /></>) },
  { to: '/plan', label: 'Plan', icon: icon(<><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>) },
  { to: '/history', label: 'History', icon: icon(<><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3.5 4v4h4" /><path d="M12 8v4l3 2" /></>) },
  { to: '/progress', label: 'Progress', icon: icon(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>) },
  {
    to: '/settings',
    label: 'Settings',
    icon: icon(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>,
    ),
  },
]

export function TabBar() {
  // Screens opened from a tab keep that tab highlighted: the exercise guide (Plan) and food log (Today).
  const path = useLocation().pathname
  const parentTab = path.startsWith('/exercises') ? '/plan' : path.startsWith('/meals') ? '/' : null
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150">
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {TABS.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-[0.01em] transition ${
                  isActive || parentTab === t.to ? 'text-accent' : 'text-subtle hover:text-text'
                }`
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
