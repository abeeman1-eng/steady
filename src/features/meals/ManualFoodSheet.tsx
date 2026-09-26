import { type FormEvent, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { Button, Field, inputClass } from '../../components/ui'
import { logFood, upsertFood } from '../../data/repositories/mealRepo'
import { type MealType, MEAL_TYPES } from '../../domain/nutrition'

/**
 * Manual entry: always available, and where a scan lands when a product isn't found or has no
 * nutrition data. A prefilled barcode is saved so the next scan finds this food.
 */
export function ManualFoodSheet({
  mealType,
  date,
  barcode,
  initialName = '',
  notice,
  onDone,
  onClose,
}: {
  mealType: MealType
  date: string
  barcode?: string
  initialName?: string
  notice?: string
  onDone: () => void
  onClose: () => void
}) {
  const [f, setF] = useState({ name: initialName, servingSize: '1 serving', calories: '', proteinG: '', carbsG: '', fatG: '', fiberG: '', sugarG: '', satFatG: '', sodiumMg: '', barcode: barcode ?? '' })
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }))
  const n = (v: string) => Math.max(0, parseFloat(v) || 0)
  // Extras stay undefined when left blank, so the log shows them as not listed rather than 0.
  const opt = (v: string) => (v.trim() === '' || !Number.isFinite(parseFloat(v)) ? undefined : Math.max(0, parseFloat(v)))
  const valid = f.name.trim() !== '' && f.calories.trim() !== '' && Number.isFinite(parseFloat(f.calories))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    try {
      const foodId = await upsertFood({
        name: f.name.trim(),
        servingSize: f.servingSize.trim() || '1 serving',
        calories: n(f.calories),
        proteinG: n(f.proteinG),
        carbsG: n(f.carbsG),
        fatG: n(f.fatG),
        fiberG: opt(f.fiberG),
        sugarG: opt(f.sugarG),
        satFatG: opt(f.satFatG),
        sodiumMg: opt(f.sodiumMg),
        source: 'manual',
        barcode: f.barcode.trim() || undefined,
      })
      await logFood(date, mealType, foodId, 1)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  const number = (k: 'calories' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG' | 'sugarG' | 'satFatG' | 'sodiumMg', label: string) => (
    <Field label={label}>
      <input className={inputClass} type="number" inputMode="decimal" min={0} value={f[k]} onChange={set(k)} required={k === 'calories'} />
    </Field>
  )

  return (
    <Sheet title="Enter food" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {notice && <p className="rounded-2xl bg-surface-2 p-3 text-[14px] ring-1 ring-border ring-inset">{notice}</p>}
        <Field label="Name">
          <input className={inputClass} value={f.name} onChange={set('name')} required autoComplete="off" />
        </Field>
        <Field label="Serving size" hint="As written on the label, e.g. 1 bar (40 g)">
          <input className={inputClass} value={f.servingSize} onChange={set('servingSize')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {number('calories', 'Calories')}
          {number('proteinG', 'Protein (g)')}
          {number('carbsG', 'Carbs (g)')}
          {number('fatG', 'Fat (g)')}
        </div>
        <details className="group rounded-2xl bg-surface-2 ring-1 ring-border ring-inset">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 text-[15px]">
            More nutrients <span className="text-[13px] text-muted">optional</span>
          </summary>
          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            {number('fiberG', 'Fiber (g)')}
            {number('sugarG', 'Sugar (g)')}
            {number('satFatG', 'Saturated fat (g)')}
            {number('sodiumMg', 'Sodium (mg)')}
          </div>
        </details>
        <Field label="Barcode (optional)">
          <input className={inputClass} inputMode="numeric" value={f.barcode} onChange={set('barcode')} />
        </Field>
        <Button type="submit" block disabled={!valid || saving}>
          {saving ? 'Saving…' : `Save and add to ${MEAL_TYPES.find((m) => m.value === mealType)!.label}`}
        </Button>
      </form>
    </Sheet>
  )
}
