import { useEffect, useState } from 'react'
import { type ExerciseVideo, videoLength } from '../../domain/exerciseVideos'

/**
 * A video demonstration that loads only when tapped: nothing is requested from YouTube until
 * then, and it plays from YouTube's privacy-enhanced (no-cookie) player. Offline, it says so and
 * the written steps still work.
 */
export function VideoDemo({ video, exerciseName }: { video: ExerciseVideo; exerciseName: string }) {
  const [playing, setPlaying] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  const watchUrl = `https://www.youtube.com/watch?v=${video.youtubeId}`

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-[18px] bg-surface-2 ring-1 ring-border ring-inset">
        {playing && online ? (
          <iframe
            className="absolute inset-0 size-full"
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&playsinline=1`}
            title={`Video demonstration: ${exerciseName}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            disabled={!online}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center transition hover:bg-surface-3 disabled:cursor-not-allowed disabled:hover:bg-surface-2"
            aria-label={online ? `Play video demonstration of ${exerciseName}, ${videoLength(video.seconds)}` : 'Video unavailable offline'}
          >
            <span aria-hidden className={`flex size-16 items-center justify-center rounded-full ${online ? 'bg-accent text-accent-ink' : 'bg-surface-3 text-subtle'}`}>
              <svg viewBox="0 0 24 24" className="ml-1 size-7" fill="currentColor">
                <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
              </svg>
            </span>
            <span className="text-[15px] font-medium">{online ? `Play video demo · ${videoLength(video.seconds)}` : 'Videos need an internet connection'}</span>
            <span className="text-[13px] text-muted">{online ? 'Plays from YouTube' : 'The written steps below still work offline.'}</span>
          </button>
        )}
      </div>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-[13px] text-muted">
        <span className="min-w-0">
          {video.title.toLowerCase().includes(video.channel.toLowerCase()) ? video.title : `${video.title} · ${video.channel}`}
        </span>
        <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-medium text-accent">
          Watch on YouTube ↗
        </a>
      </p>
    </div>
  )
}
