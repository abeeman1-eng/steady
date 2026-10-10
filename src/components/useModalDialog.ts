import { useEffect, useRef } from 'react'

/**
 * Opens a <dialog> as a modal while the component is mounted. Returns the dialog ref and an
 * onClose handler that ignores the close event caused by our own cleanup.
 *
 * Why: cleanup calls dialog.close(), and the browser fires the "close" event later, as a task. In
 * development React mounts, cleans up and remounts every effect, so that late event arrived after
 * the dialog had reopened and dismissed it straight away (sheets "didn't open"). Real closes
 * (Escape, backdrop, Close button) still reach onClose.
 */
export function useModalDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)
  const closingFromCleanup = useRef(false)

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => {
      if (d?.open) {
        closingFromCleanup.current = true
        d.close()
      }
    }
  }, [])

  const handleClose = () => {
    if (closingFromCleanup.current) {
      closingFromCleanup.current = false
      // Our cleanup closed it; if the component is still mounted (dev remount), keep it open.
      if (ref.current && !ref.current.open) ref.current.showModal()
      return
    }
    onClose()
  }

  return { ref, handleClose }
}
