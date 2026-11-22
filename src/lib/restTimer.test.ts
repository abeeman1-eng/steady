import { describe, expect, it } from 'vitest'
import { FINISHED_SHOW_MS, REST_TIMER_KEY, createRestTimerStore, remainingSec } from './restTimer'

function setup(start = 1_000_000) {
  const data = new Map<string, string>()
  const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) }
  const clock = { t: start }
  const make = () => createRestTimerStore(() => storage, () => clock.t)
  return { data, clock, make, store: make() }
}

describe('rest timer (peer feedback: rest is lost on refresh or when the app closes)', () => {
  it('survives the app being closed and reopened, counting from the original end time', () => {
    const { clock, make, store } = setup()
    store.start('w1', 90)
    clock.t += 30_000
    const reopened = make() // a fresh page load reads the saved timer
    const t = reopened.getSnapshot().timer!
    expect(t.workoutId).toBe('w1')
    expect(remainingSec(t, clock.t)).toBe(60)
  })

  it('chimes once when time is up and shows "rest done" briefly', () => {
    const { clock, data, store } = setup()
    store.start('w1', 60)
    clock.t += 59_000
    expect(store.tick()).toBe(false)
    clock.t += 1_000
    expect(store.tick()).toBe(true)
    expect(store.tick()).toBe(false) // never twice
    expect(store.getSnapshot()).toMatchObject({ timer: null, finished: { workoutId: 'w1' } })
    expect(data.has(REST_TIMER_KEY)).toBe(false)
    clock.t += FINISHED_SHOW_MS + 1
    store.tick()
    expect(store.getSnapshot().finished).toBeNull()
  })

  it('ends quietly if the rest ran out while the app was closed', () => {
    const { clock, make, store } = setup()
    store.start('w1', 60)
    clock.t += 10 * 60_000
    const reopened = make()
    expect(reopened.tick()).toBe(false)
    expect(reopened.getSnapshot()).toEqual({ timer: null, finished: null })
  })

  it('adjusts by ±15 s but never below one second left, and skips', () => {
    const { clock, store } = setup()
    store.start('w1', 30)
    store.adjust(15)
    expect(remainingSec(store.getSnapshot().timer!, clock.t)).toBe(45)
    store.adjust(-120)
    expect(remainingSec(store.getSnapshot().timer!, clock.t)).toBe(1)
    store.skip()
    expect(store.getSnapshot().timer).toBeNull()
  })

  it('drops a timer whose workout was finished or discarded, but keeps the active one', () => {
    const { store } = setup()
    store.start('w1', 60)
    store.clearUnless('w1')
    expect(store.getSnapshot().timer).not.toBeNull()
    store.clearUnless(null)
    expect(store.getSnapshot().timer).toBeNull()
  })

  it('ignores unreadable saved data and works without storage', () => {
    const { data, make } = setup()
    data.set(REST_TIMER_KEY, '{not json')
    expect(make().getSnapshot().timer).toBeNull()
    const noStorage = createRestTimerStore(() => undefined)
    noStorage.start('w1', 60)
    expect(noStorage.getSnapshot().timer?.workoutId).toBe('w1')
  })
})
