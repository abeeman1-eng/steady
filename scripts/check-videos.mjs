// Checks every exercise video through YouTube's oEmbed service: still public and embeddable,
// and whether its title changed (a hint the video was replaced). Fails (exit 1) when more than
// 5% are unavailable, the signal to refresh the library. Run with: npm run check:videos
// Also runs monthly in .github/workflows/check-videos.yml.
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/domain/exerciseVideos.ts', import.meta.url), 'utf8')
const rows = [...src.matchAll(/'([^']+)': \{ youtubeId: '([^']+)', title: ("(?:[^"\\]|\\.)*")/g)].map(([, ex, id, t]) => ({ ex, id, title: JSON.parse(t) }))

async function oembed(id) {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`).catch(() => null)
    if (res?.ok) return res.json()
    if (res && (res.status === 401 || res.status === 403 || res.status === 404)) return null
  }
  return null
}

const failed = []
const retitled = []
for (const r of rows) {
  const m = await oembed(r.id)
  if (!m) failed.push(`${r.ex} (${r.id})`)
  else if (m.title !== r.title) retitled.push(`${r.ex}: now "${m.title}"`)
}
const pct = (100 * failed.length) / rows.length
console.log(`${rows.length} videos checked: ${failed.length} unavailable (${pct.toFixed(1)}%), ${retitled.length} retitled`)
for (const line of [...failed, ...retitled]) console.log('  ' + line)
process.exitCode = pct > 5 ? 1 : 0
