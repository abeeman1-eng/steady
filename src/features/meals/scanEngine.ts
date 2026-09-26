import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat } from '@zxing/library'
import { expandUpcE } from '../../domain/nutrition'
import { zxingHints } from './zxingHints'

/** Minimal typing for the browser's built-in BarcodeDetector (Chrome on Android, macOS, ChromeOS). */
interface NativeDetector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string; format: string }[]>
}
type NativeDetectorCtor = {
  new (opts: { formats: string[] }): NativeDetector
  getSupportedFormats(): Promise<string[]>
}

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']
const SCAN_INTERVAL_MS = 150

/**
 * HD instead of the 640×480 default: 1D barcodes need horizontal resolution, and webcams send the
 * lowest resolution unless asked. The rear camera is preferred on phones; laptops fall back to
 * their only camera.
 */
const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
}

export interface ScanSession {
  stop: () => void
  /** True for front-facing cameras (laptops), whose preview should be mirrored. */
  mirrored: boolean
  engine: 'native' | 'zxing'
}

async function nativeDetector(): Promise<NativeDetector | null> {
  const Ctor = (window as unknown as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector
  if (!Ctor) return null
  try {
    const supported = await Ctor.getSupportedFormats()
    const formats = NATIVE_FORMATS.filter((f) => supported.includes(f))
    return formats.includes('ean_13') ? new Ctor({ formats }) : null
  } catch {
    return null
  }
}

/** Ask for continuous autofocus where the camera supports it (many phones; few webcams). */
async function tuneTrack(track: MediaStreamTrack | undefined) {
  if (!track) return
  const caps = (track.getCapabilities?.() ?? {}) as { focusMode?: string[] }
  if (caps.focusMode?.includes('continuous')) {
    await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => {})
  }
}

const isMirrored = (track: MediaStreamTrack | undefined) => (track?.getSettings().facingMode ?? 'user') !== 'environment'

/**
 * Start the camera in `video` and call `onCode` once with the first barcode read. Uses the
 * built-in BarcodeDetector when available (faster and far more reliable), else ZXing with its
 * "try harder" mode. Throws the getUserMedia error (e.g. NotAllowedError) if the camera can't start.
 */
export async function startScanning(video: HTMLVideoElement, onCode: (code: string) => void): Promise<ScanSession> {
  const detector = await nativeDetector()

  if (detector) {
    const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS)
    const track = stream.getVideoTracks()[0]
    await tuneTrack(track)
    video.srcObject = stream
    await video.play().catch(() => {})
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const stop = () => {
      stopped = true
      clearTimeout(timer)
      stream.getTracks().forEach((t) => t.stop())
      video.srcObject = null
    }
    const tick = async () => {
      if (stopped) return
      if (video.readyState >= 2) {
        const [hit] = await detector.detect(video).catch(() => [])
        if (hit && !stopped) {
          stop()
          onCode(hit.format === 'upc_e' ? expandUpcE(hit.rawValue) : hit.rawValue)
          return
        }
      }
      timer = setTimeout(tick, SCAN_INTERVAL_MS)
    }
    void tick()
    return { stop, mirrored: isMirrored(track), engine: 'native' }
  }

  const reader = new BrowserMultiFormatReader(zxingHints(), { delayBetweenScanAttempts: SCAN_INTERVAL_MS })
  let done = false
  const controls = await reader.decodeFromConstraints(CONSTRAINTS, video, (result, _err, c) => {
    if (!result || done) return
    done = true
    c.stop()
    const text = result.getText()
    onCode(result.getBarcodeFormat() === BarcodeFormat.UPC_E ? expandUpcE(text) : text)
  })
  const track = (video.srcObject as MediaStream | null)?.getVideoTracks()[0]
  await tuneTrack(track)
  return {
    stop: () => {
      done = true
      controls.stop()
    },
    mirrored: isMirrored(track),
    engine: 'zxing',
  }
}
