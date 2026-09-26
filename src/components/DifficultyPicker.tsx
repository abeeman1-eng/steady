import { DIFFICULTY_ANCHORS as ANCHORS, difficultyLabel } from '../lib/format'

export function DifficultyPicker({ value, onChange }: { value?: number; onChange: (n: number | undefined) => void }) {
  return (
    <div role="radiogroup" aria-label="Difficulty, 1 to 10" className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}, ${difficultyLabel(n)}`}
            onClick={() => onChange(value === n ? undefined : n)}
            className={`min-h-12 rounded-xl border text-lg font-semibold transition ${
              value === n ? 'border-accent bg-accent text-accent-ink' : 'border-border bg-surface-2 hover:bg-border'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[3fr_3fr_2fr_2fr] text-xs text-muted">
        {ANCHORS.map((a) => (
          <span key={a.label} className="text-center">
            {a.from}–{a.to} {a.label.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  )
}
