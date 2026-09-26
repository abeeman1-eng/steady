import { type ReactNode, useEffect, useRef } from 'react'

/**
 * Modal built on <dialog> (focus trapping, Escape to close). A bottom sheet on phones, centered
 * on wider screens. Mount it to open; `onClose` fires on Escape, backdrop tap or Close.
 */
export function Sheet({ title, onClose, children, full = false }: { title: string; onClose: () => void; children: ReactNode; full?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    d?.showModal()
    return () => d?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-0 mt-auto w-full max-w-none bg-surface p-0 text-text backdrop:bg-black/60 sm:m-auto sm:max-w-lg sm:rounded-2xl ${
        full ? 'h-dvh max-h-none sm:h-[85dvh]' : 'max-h-[90dvh] rounded-t-2xl'
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-accent">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </dialog>
  )
}
