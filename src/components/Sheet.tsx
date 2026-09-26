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
      className={`m-0 mt-auto w-full max-w-none bg-surface p-0 text-text ring-1 ring-border backdrop:bg-black/70 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-lg sm:rounded-[24px] ${
        full ? 'h-dvh max-h-none sm:h-[85dvh]' : 'max-h-[90dvh] rounded-t-[24px]'
      }`}
    >
      <div className="flex h-full flex-col">
        {!full && <div aria-hidden className="mx-auto mt-2 h-1 w-9 rounded-full bg-border-strong sm:hidden" />}
        <div className="flex items-center justify-between gap-2 px-5 pt-2 pb-1">
          <h2 className="text-[17px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-2 text-[15px] font-medium text-accent">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </dialog>
  )
}
