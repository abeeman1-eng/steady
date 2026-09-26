let audioCtx: AudioContext | null = null

/**
 * Browsers only allow sound after a user gesture, so call this from a tap handler (e.g. when a
 * set is checked) and the end-of-rest chime can play later.
 */
export function unlockAudio(): void {
  try {
    audioCtx ??= new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
  } catch {
    audioCtx = null
  }
}

export function playChime(): void {
  if (!audioCtx) return
  const start = audioCtx.currentTime
  for (const [i, freq] of [880, 1175].entries()) {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.frequency.value = freq
    osc.type = 'sine'
    const t = start + i * 0.18
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    osc.connect(gain).connect(audioCtx.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  }
}

/** No-op on iPhone browsers, which don't support the Vibration API. */
export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) navigator.vibrate(pattern)
}
