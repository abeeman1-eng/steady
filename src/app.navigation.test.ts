import { describe, expect, it } from 'vitest'
import app from './App.tsx?raw'
import { backAction } from './lib/navigation'

/** Source of every screen, keyed like './features/meals/MealsScreen.tsx'. */
const SOURCES = import.meta.glob<string>('./features/**/*.tsx', { query: '?raw', import: 'default', eager: true })

/** Main tabs are always reachable from the tab bar, so they don't need a Back action. */
const TAB_ROOTS = new Set(['/', '/plan', '/history', '/progress', '/settings'])
/** Onboarding runs before a home screen exists and has its own step-by-step Back. */
const EXEMPT = new Set(['/onboarding', '*'])

const routes = [...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<(\w+)\s*\/>\}/g)].map(([, path, component]) => ({ path, component }))

function sourceOf(component: string): string {
  const rel = app.match(new RegExp(`import \\{ ${component} \\} from '\\./([^']+)'`))?.[1]
  const source = rel ? SOURCES[`./${rel}.tsx`] : undefined
  if (!source) throw new Error(`Couldn't find the source file for ${component}`)
  return source
}

describe('navigation requirements', () => {
  it('finds the app routes', () => {
    expect(routes.length).toBeGreaterThan(10)
  })

  const pages = routes.filter((r) => !TAB_ROOTS.has(r.path) && !EXEMPT.has(r.path))

  it.each(pages.map((r) => [r.path, r.component]))('%s (%s) has a visible Back or Home action', (_path, component) => {
    const source = sourceOf(component)
    const hasBack = source.includes('<BackButton') || /<(Link|ButtonLink)\s+to="\/"/.test(source)
    expect(hasBack, `${component} needs a <BackButton parent=… /> (or a link to "/")`).toBe(true)
  })

  it.each(routes.filter((r) => !EXEMPT.has(r.path)).map((r) => [r.path, r.component]))('%s (%s) never uses a bare navigate(-1)', (_path, component) => {
    // A bare "back one step" leaves the app when the page was opened fresh; BackButton handles that.
    expect(sourceOf(component)).not.toMatch(/navigate\(-1\)/)
  })
})

describe('backAction', () => {
  it('goes back within the app when there is an earlier page', () => {
    expect(backAction(3, '/meals')).toEqual({ kind: 'history' })
  })

  it('goes to the parent when the page was opened fresh', () => {
    expect(backAction(0, '/meals')).toEqual({ kind: 'parent', to: '/meals' })
    expect(backAction(undefined, '/')).toEqual({ kind: 'parent', to: '/' })
  })
})
