import { describe, expect, it } from 'vitest'
import { EXERCISE_LIBRARY } from './exerciseLibrary'
import { EXERCISE_VIDEOS, videoLength } from './exerciseVideos'

describe('exercise video demos', () => {
  it('has a short video for every exercise in the library, and none for unknown ids', () => {
    const ids = new Set(EXERCISE_LIBRARY.map((e) => e.id))
    expect(EXERCISE_LIBRARY.filter((e) => !EXERCISE_VIDEOS[e.id]).map((e) => e.id)).toEqual([])
    expect(Object.keys(EXERCISE_VIDEOS).filter((id) => !ids.has(id))).toEqual([])
  })

  it('uses valid YouTube ids and keeps every demo under 4 minutes', () => {
    for (const v of Object.values(EXERCISE_VIDEOS)) {
      expect(v.youtubeId).toMatch(/^[\w-]{11}$/)
      expect(v.seconds).toBeGreaterThan(10)
      expect(v.seconds).toBeLessThan(240)
      expect(v.title.length).toBeGreaterThan(5)
      expect(v.channel.length).toBeGreaterThan(1)
    }
  })

  it('formats lengths as m:ss', () => {
    expect(videoLength(38)).toBe('0:38')
    expect(videoLength(87)).toBe('1:27')
  })
})
