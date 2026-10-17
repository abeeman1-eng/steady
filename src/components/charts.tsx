import { type ReactNode, useEffect, useRef, useState } from 'react'
import { niceTicks } from '../lib/chartTicks'

/**
 * Small SVG charts for the Progress screen. Rules (see the dataviz guidance in README):
 * one y-axis per chart, recessive grid, 2px lines, ≥8px markers, 4px rounded bar ends on the
 * baseline with a 2px gap, a hover/tap tooltip on every chart, a legend plus direct labels when
 * there are two series, and a table view so nothing depends on seeing the chart.
 */

const PAD = { top: 12, right: 12, bottom: 24, left: 44 }

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(320)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(Math.max(240, Math.round(el.getBoundingClientRect().width)))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export interface Series {
  name: string
  color: string
  points: { x: string; y: number }[]
}

function Tooltip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const left = Math.min(Math.max(x, 70), width - 70)
  return (
    <div className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-surface-3 px-2.5 py-1.5 text-[12px] whitespace-nowrap shadow-lg ring-1 ring-border-strong" style={{ left }}>
      {children}
    </div>
  )
}

function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
      {series.map((s) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.color }} />
          {s.name}
        </li>
      ))}
    </ul>
  )
}

/** A line chart over dates (shared x positions across series). */
export function LineChart({
  series,
  formatY,
  formatX,
  formatTip = formatX,
  label,
  height = 180,
  yDomain,
}: {
  series: Series[]
  formatY: (v: number) => string
  formatX: (x: string) => string
  /** Tooltip heading for a point (default: the axis label). */
  formatTip?: (x: string) => string
  label: string
  height?: number
  yDomain?: [number, number]
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort()
  const ys = series.flatMap((s) => s.points.map((p) => p.y))
  if (xs.length === 0) return null
  const ticks = niceTicks(yDomain?.[0] ?? Math.min(...ys), yDomain?.[1] ?? Math.max(...ys))
  const [y0, y1] = [ticks[0], ticks[ticks.length - 1]]
  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom
  const xAt = (i: number) => PAD.left + (xs.length === 1 ? innerW / 2 : (i / (xs.length - 1)) * innerW)
  const yAt = (v: number) => PAD.top + innerH - ((v - y0) / (y1 - y0 || 1)) * innerH
  const xLabels = xs.length <= 2 ? xs.map((_, i) => i) : [0, Math.floor((xs.length - 1) / 2), xs.length - 1]

  function onPointer(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const rel = (e.clientX - box.left) / box.width
    setHover(Math.round(rel * (xs.length - 1)))
  }

  return (
    <div ref={ref} className="relative">
      <Legend series={series} />
      <div className="relative">
        {hover !== null && (
          <Tooltip x={xAt(hover)} width={width}>
            <span className="block text-muted">{formatTip(xs[hover])}</span>
            {series.map((s) => {
              const p = s.points.find((q) => q.x === xs[hover])
              return p ? (
                <span key={s.name} className="flex items-center gap-1.5">
                  {series.length > 1 && <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: s.color }} />}
                  {series.length > 1 && <span className="text-muted">{s.name}</span>}
                  <span className="font-semibold tabular-nums">{formatY(p.y)}</span>
                </span>
              ) : null
            })}
          </Tooltip>
        )}
        <svg width={width} height={height} role="img" aria-label={label} className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={yAt(t)} y2={yAt(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 6} y={yAt(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--subtle)">
                {formatY(t)}
              </text>
            </g>
          ))}
          {xLabels.map((i) => (
            <text key={i} x={xAt(i)} y={height - 6} textAnchor={xs.length > 1 && i === 0 ? 'start' : xs.length > 1 && i === xs.length - 1 ? 'end' : 'middle'} fontSize={11} fill="var(--subtle)">
              {formatX(xs[i])}
            </text>
          ))}
          {hover !== null && <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--border-strong)" strokeWidth={1} />}
          {series.map((s) => {
            const pts = s.points.map((p) => [xAt(xs.indexOf(p.x)), yAt(p.y)] as const)
            return (
              <g key={s.name}>
                {pts.length > 1 && <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
                {pts.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r={hover !== null && xAt(hover) === x ? 5 : 4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
                ))}
              </g>
            )
          })}
          <rect
            x={PAD.left}
            y={0}
            width={innerW}
            height={height}
            fill="transparent"
            onPointerMove={onPointer}
            onPointerDown={onPointer}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      </div>
    </div>
  )
}

/** A single-series bar chart (e.g. weekly distance). */
export function BarChart({
  bars,
  color,
  formatY,
  formatX,
  formatTip = formatX,
  label,
  height = 180,
}: {
  bars: { x: string; y: number; detail?: string }[]
  color: string
  formatY: (v: number) => string
  formatX: (x: string) => string
  formatTip?: (x: string) => string
  label: string
  height?: number
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  if (bars.length === 0) return null
  const ticks = niceTicks(0, Math.max(...bars.map((b) => b.y), 1))
  const top = ticks[ticks.length - 1]
  const innerW = width - PAD.left - PAD.right
  const innerH = height - PAD.top - PAD.bottom
  const slot = innerW / bars.length
  const barW = Math.max(4, Math.min(28, slot - 2))
  const yAt = (v: number) => PAD.top + innerH - (v / top) * innerH
  const xLabels = bars.length <= 2 ? bars.map((_, i) => i) : [0, Math.floor((bars.length - 1) / 2), bars.length - 1]

  return (
    <div ref={ref} className="relative">
      {hover !== null && (
        <Tooltip x={PAD.left + slot * hover + slot / 2} width={width}>
          <span className="block text-muted">{formatTip(bars[hover].x)}</span>
          <span className="font-semibold tabular-nums">{formatY(bars[hover].y)}</span>
          {bars[hover].detail && <span className="block text-muted">{bars[hover].detail}</span>}
        </Tooltip>
      )}
      <svg width={width} height={height} role="img" aria-label={label} className="block overflow-visible">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={yAt(t)} y2={yAt(t)} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 6} y={yAt(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--subtle)">
              {formatY(t)}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2
          const h = Math.max(0, PAD.top + innerH - yAt(b.y))
          const r = Math.min(4, barW / 2, h)
          const y = PAD.top + innerH - h
          return (
            <g key={b.x} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              {/* Hit target spans the whole slot, taller than the bar. */}
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`}
                  fill={color}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
            </g>
          )
        })}
        {xLabels.map((i) => (
          <text key={i} x={PAD.left + slot * i + slot / 2} y={height - 6} textAnchor={i === 0 && bars.length > 2 ? 'start' : i === bars.length - 1 && bars.length > 2 ? 'end' : 'middle'} fontSize={11} fill="var(--subtle)">
            {formatX(bars[i].x)}
          </text>
        ))}
      </svg>
    </div>
  )
}

/** "Show as table" for any chart. */
export function ChartTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-2 text-[13px]">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-accent">Show as table</summary>
      <div className="max-h-64 overflow-auto">
        <table className="w-full tabular-nums">
          <thead>
            <tr className="text-left text-muted">
              {columns.map((c) => (
                <th key={c} scope="col" className="py-1 pr-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => (
                  <td key={j} className="py-1.5 pr-3">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
