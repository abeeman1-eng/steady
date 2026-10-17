// Builds src/data/seed/usdaFoods.json from three USDA FoodData Central datasets (all public domain):
//   SR Legacy: the classic reference list of basic foods.
//   FNDDS (survey foods): foods as people report eating them ("Pizza, pepperoni", "Burrito, bean").
//   Foundation Foods: newer lab-analyzed basics.
// Run with: npm run build:foods
// Downloads are cached in .cache/ so re-running is fast. The output is committed, so normal
// builds and CI never need this script.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, strFromU8 } from 'fflate'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FDC = 'https://fdc.nal.usda.gov/fdc-datasets/'
const DATASETS = [
  { name: 'SR Legacy (April 2018)', url: `${FDC}FoodData_Central_sr_legacy_food_csv_2018-04.zip`, cache: 'sr_legacy.zip', dataType: 'sr_legacy_food' },
  { name: 'FNDDS survey foods (October 2024)', url: `${FDC}FoodData_Central_survey_food_csv_2024-10-31.zip`, cache: 'survey_food_csv_2024-10-31.zip', dataType: 'survey_fndds_food' },
  { name: 'Foundation Foods (April 2026)', url: `${FDC}FoodData_Central_foundation_food_csv_2026-04-30.zip`, cache: 'foundation_food_csv_2026-04-30.zip', dataType: 'foundation_food' },
]
const OUT = join(ROOT, 'src', 'data', 'seed', 'usdaFoods.json')

// USDA nutrient ids, in order of preference. Foundation Foods sometimes report energy only as
// Atwater factors (2048 specific, 2047 general), fat as 1085 and sugar as 1063.
const NUTRIENTS = {
  kcal: ['1008', '2048', '2047'],
  protein: ['1003'],
  fat: ['1004', '1085'],
  carbs: ['1005', '1050'],
  fiber: ['1079'],
  sugar: ['2000', '1063'],
  satFat: ['1258'],
  sodium: ['1093'],
}
const MAX_PORTIONS = 8

async function download({ url, cache }) {
  const CACHE = join(ROOT, '.cache', cache)
  if (existsSync(CACHE)) return readFileSync(CACHE)
  console.log(`Downloading ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  mkdirSync(dirname(CACHE), { recursive: true })
  writeFileSync(CACHE, buf)
  return buf
}

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes). Returns rows of strings. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function table(files, name) {
  const key = Object.keys(files).find((k) => k.endsWith(`/${name}`) || k === name)
  if (!key) throw new Error(`${name} not found in zip`)
  const [header, ...rows] = parseCsv(strFromU8(files[key]))
  return rows.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))
}

const round1 = (n) => Math.round(n * 10) / 10

/**
 * A household serving label. SR Legacy puts the unit in `modifier` ("cup, chopped"), FNDDS
 * writes the whole thing in `portion_description` ("1 cup") and uses `modifier` for a code, and
 * Foundation Foods use a measure unit id plus an optional modifier ("1 cup drained").
 */
function portionLabel(p, units) {
  const desc = (p.portion_description || '').trim()
  if (/quantity not specified/i.test(desc)) return null
  if (desc && /^\d/.test(desc)) return desc
  const amount = Number(p.amount) || 1
  const qty = Number.isInteger(amount) ? String(amount) : String(round1(amount))
  const modifier = /^\d+$/.test(p.modifier || '') ? '' : (p.modifier || '').trim()
  const unit = units.get(p.measure_unit_id)
  const text = unit && unit !== 'undetermined' ? [unit, modifier].filter(Boolean).join(' ') : modifier || desc
  return text ? `${qty} ${text}` : null
}

const wanted = new Set(Object.values(NUTRIENTS).flat())
const pick = (n, key) => NUTRIENTS[key].map((id) => n[id]).find((v) => v !== undefined)
const out = []
const seenNames = new Set()

for (const ds of DATASETS) {
  const zip = unzipSync(new Uint8Array(await download(ds)))
  const foods = table(zip, 'food.csv').filter((f) => f.data_type === ds.dataType)
  const ids = new Set(foods.map((f) => f.fdc_id))
  const units = new Map(table(zip, 'measure_unit.csv').map((u) => [u.id, u.name]))

  // FNDDS lists nutrients by their old 3-digit number (208 = energy) instead of the id; translate.
  const idByNumber = new Map(table(zip, 'nutrient.csv').map((n) => [n.nutrient_nbr, n.id]))
  const nutritionById = new Map()
  for (const n of table(zip, 'food_nutrient.csv')) {
    const id = wanted.has(n.nutrient_id) ? n.nutrient_id : idByNumber.get(n.nutrient_id)
    if (!wanted.has(id) || !ids.has(n.fdc_id) || n.amount === '') continue
    const entry = nutritionById.get(n.fdc_id) ?? {}
    entry[id] = Number(n.amount)
    nutritionById.set(n.fdc_id, entry)
  }

  const portionsById = new Map()
  for (const p of table(zip, 'food_portion.csv').sort((a, b) => Number(a.seq_num) - Number(b.seq_num))) {
    if (!ids.has(p.fdc_id)) continue
    const label = portionLabel(p, units)
    const grams = Number(p.gram_weight)
    if (!label || !(grams > 0)) continue
    const list = portionsById.get(p.fdc_id) ?? []
    if (list.length < MAX_PORTIONS && !list.some(([l]) => l === label)) list.push([label, round1(grams)])
    portionsById.set(p.fdc_id, list)
  }

  // Compact rows: [fdcId, name, kcal, protein, carbs, fat, fiber, sugar, satFat, sodiumMg, portions];
  // nutrition is per 100 g. A food whose exact name is already in the list (Foundation Foods
  // repeat many SR Legacy names) is skipped, so search doesn't show duplicates and the meal
  // planner's SR Legacy ids keep working.
  let added = 0
  for (const f of foods) {
    const n = nutritionById.get(f.fdc_id)
    const kcal = n && pick(n, 'kcal')
    const nameKey = f.description.trim().toLowerCase()
    if (kcal === undefined || seenNames.has(nameKey)) continue
    seenNames.add(nameKey)
    const extra = (key, round = round1) => {
      const v = pick(n, key)
      // Extras are null when USDA has no value, so the app can say "not listed" instead of 0.
      return v === undefined ? null : round(v)
    }
    out.push([
      Number(f.fdc_id),
      f.description.trim(),
      Math.round(kcal),
      round1(pick(n, 'protein') ?? 0),
      round1(pick(n, 'carbs') ?? 0),
      round1(pick(n, 'fat') ?? 0),
      extra('fiber'),
      extra('sugar'),
      extra('satFat'),
      extra('sodium', Math.round),
      portionsById.get(f.fdc_id) ?? [],
    ])
    added++
  }
  console.log(`${ds.name}: ${added} foods`)
}
out.sort((a, b) => a[1].localeCompare(b[1]))

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ source: `USDA FoodData Central (public domain): ${DATASETS.map((d) => d.name).join('; ')}`, foods: out }))
console.log(`Wrote ${out.length} foods to ${OUT}`)
