import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui'
import { type ScanSession, startScanning } from './scanEngine'

type Stage = 'checking' | 'explain' | 'scanning' | 'denied' | 'unsupported'

/** Show distance/lighting tips if nothing has been read after this long. */
const TIP_AFTER_MS = 8000

/**
 * Full-screen rear-camera barcode scanner (EAN-13, EAN-8, UPC-A, UPC-E). Explains the camera
 * before the browser's one-time permission prompt, and offers typing the code instead when the
 * camera is denied or unavailable. Loaded lazily, so the barcode library isn't in the main bundle.
 */
export default function BarcodeScanner({ onDetected, onTypeInstead, onClose }: { onDetected: (code: string) => void; onTypeInstead: () => void; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>(() => (!navigator.mediaDevices?.getUserMedia ? 'unsupported' : typeof navigator.permissions?.query === 'function' ? 'checking' : 'explain'))
  const [mirrored, setMirrored] = useState(false)
  const [struggling, setStruggling] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  // Held in a ref so a new callback from the parent doesn't restart the camera.
  const onDetectedRef = useRef(onDetected)
  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    const d = dialogRef.current
    d?.showModal()
    return () => d?.close()
  }, [])

  // Skip the explanation if camera access was already granted.
  useEffect(() => {
    if (stage !== 'checking') return
    navigator.permissions
      .query({ name: 'camera' as PermissionName })
      .then((p) => setStage(p.state === 'granted' ? 'scanning' : p.state === 'denied' ? 'denied' : 'explain'))
      .catch(() => setStage('explain'))
  }, [stage])

  useEffect(() => {
    if (stage !== 'scanning' || !videoRef.current) return
    let session: ScanSession | undefined
    let cancelled = false
    const tipTimer = setTimeout(() => setStruggling(true), TIP_AFTER_MS)
    startScanning(videoRef.current, (code) => {
      if (!cancelled) onDetectedRef.current(code)
    })
      .then((s) => {
        session = s
        if (cancelled) s.stop()
        else setMirrored(s.mirrored)
      })
      .catch((e: unknown) => {
        const name = e instanceof DOMException ? e.name : ''
        setStage(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported')
      })
    return () => {
      cancelled = true
      clearTimeout(tipTimer)
      session?.stop()
    }
  }, [stage])

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-label="Scan barcode" className="m-0 h-dvh max-h-none w-full max-w-none bg-black p-0 text-white backdrop:bg-black">
      <div className="relative flex h-full flex-col">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h2 className="text-lg font-semibold">Scan barcode</h2>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl bg-black/50 px-4">
            Close
          </button>
        </div>

        {stage === 'scanning' ? (
          <>
            {/* Front cameras are mirrored so moving the product feels natural; decoding uses the raw frames. */}
            <video ref={videoRef} className={`h-full w-full object-cover ${mirrored ? '-scale-x-100' : ''}`} muted playsInline />
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-72 max-w-[80vw] rounded-2xl border-4 border-accent shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
            </div>
            <div className="absolute inset-x-4 bottom-24 mx-auto max-w-md text-center" role="status">
              {struggling ? (
                <p className="rounded-xl bg-black/70 p-3 text-sm">
                  Not reading? Hold the barcode flat and still, about 6–8 inches (15–20 cm) away, in good light. Laptop cameras often can’t focus on small barcodes. Typing the number always works.
                </p>
              ) : (
                <p className="text-sm">Line the barcode up inside the box</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            {stage === 'explain' && (
              <>
                <p className="text-xl font-semibold">Scan with your camera</p>
                <p className="max-w-sm text-white/80">Steady uses your camera only to read barcodes. Nothing is recorded or uploaded. Your browser will ask for permission once.</p>
                <Button onClick={() => setStage('scanning')}>Turn on camera</Button>
              </>
            )}
            {stage === 'denied' && (
              <>
                <p className="text-xl font-semibold">Camera access is off</p>
                <p className="max-w-sm text-white/80">To scan, allow camera access for this site in your browser settings. Or type the barcode instead.</p>
              </>
            )}
            {stage === 'unsupported' && (
              <>
                <p className="text-xl font-semibold">Camera not available</p>
                <p className="max-w-sm text-white/80">This browser or device can’t use a camera here. You can type the barcode instead.</p>
              </>
            )}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onTypeInstead} className={`min-h-11 rounded-xl px-4 ${struggling ? 'bg-accent font-semibold text-accent-ink' : 'bg-black/50 text-accent underline'}`}>
            Type barcode instead
          </button>
        </div>
      </div>
    </dialog>
  )
}
