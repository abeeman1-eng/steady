import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui'
import { expandUpcE } from '../../domain/nutrition'

type Stage = 'checking' | 'explain' | 'scanning' | 'denied' | 'unsupported'

/**
 * Full-screen rear-camera barcode scanner (EAN-13, EAN-8, UPC-A, UPC-E). Explains the camera
 * before the browser's one-time permission prompt, and offers typing the code instead when the
 * camera is denied or unavailable. Loaded lazily, so the barcode library isn't in the main bundle.
 */
export default function BarcodeScanner({ onDetected, onTypeInstead, onClose }: { onDetected: (code: string) => void; onTypeInstead: () => void; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>(() => (!navigator.mediaDevices?.getUserMedia ? 'unsupported' : typeof navigator.permissions?.query === 'function' ? 'checking' : 'explain'))
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
    let controls: IScannerControls | undefined
    let cancelled = false
    const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]]])
    const reader = new BrowserMultiFormatReader(hints)
    reader
      .decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, videoRef.current, (result, _err, c) => {
        if (!result || cancelled) return
        cancelled = true
        c.stop()
        const text = result.getText()
        onDetectedRef.current(result.getBarcodeFormat() === BarcodeFormat.UPC_E ? expandUpcE(text) : text)
      })
      .then((c) => {
        controls = c
        if (cancelled) c.stop()
      })
      .catch((e: unknown) => {
        const name = e instanceof DOMException ? e.name : ''
        setStage(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unsupported')
      })
    return () => {
      cancelled = true
      controls?.stop()
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
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-40 w-72 max-w-[80vw] rounded-2xl border-4 border-accent shadow-[0_0_0_100vmax_rgba(0,0,0,0.45)]" />
            </div>
            <p className="absolute inset-x-0 bottom-28 text-center text-sm" role="status">
              Line the barcode up inside the box
            </p>
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
          <button type="button" onClick={onTypeInstead} className="min-h-11 rounded-xl bg-black/50 px-4 text-accent underline">
            Type barcode instead
          </button>
        </div>
      </div>
    </dialog>
  )
}
