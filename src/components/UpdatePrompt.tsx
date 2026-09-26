import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './ui'

/** Shown when a new app version is ready. Updating never touches saved data (it's in IndexedDB). */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div role="status" className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-border bg-surface-2 p-3 shadow-lg">
      <p className="flex-1 text-sm">A new version of Steady is ready.</p>
      <Button variant="ghost" onClick={() => setNeedRefresh(false)}>
        Later
      </Button>
      <Button onClick={() => updateServiceWorker(true)}>Reload</Button>
    </div>
  )
}
