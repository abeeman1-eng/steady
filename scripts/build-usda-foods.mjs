// Builds src/data/seed/usdaFoods.json from USDA FoodData Central "SR Legacy" (public domain).
// Run with: npm run build:foods
// The download is cached in .cache/ so re-running is fast. The output is committed, so normal
// builds and CI never need this script.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { unzipSync, strFromU8 } from 'fflate'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip'
const CACHE = join(ROOT, '.cache', 'sr_legacy.zip')
const OUT = join(ROOT, 'src', 'data', 'seed', 'usdaFoods.json')

const NUTRIENTS = { kcal: '1008', protein: '1003', fat: '1004', carbs: '1005', fiber: '1079', sugar: '2000', satFat: '1258', sodium: '1093' }
const MAX_PORTIONS = 8

async function download() {
  if (existsSync(CACHE)) return readFileSync(CACHE)
  console.log(`Downloading ${SOURCE_URL}`)
  const res = await fetch(SOURCE_URL)
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

function portionLabel(p) {
  const amount = Number(p.amount)
  const text = (p.modifier || p.portion_description || '').trim()
  if (!text) return null
  const qty = Number.isInteger(amount) ? String(amount) : String(round1(amount))
  return `${qty} ${text}`
}

const zip = unzipSync(new Uint8Array(await download()))
const foods = table(zip, 'food.csv')
const nutrients = table(zip, 'food_nutrient.csv')
const portions = table(zip, 'food_portion.csv')

const nutritionById = new Map()
const wanted = new Set(Object.values(NUTRIENTS))
for (const n of nutrients) {
  if (!wanted.has(n.nutrient_id)) continue
  const entry = nutritionById.get(n.fdc_id) ?? {}
  entry[n.nutrient_id] = Number(n.amount)
  nutritionById.set(n.fdc_id, entry)
}

const portionsById = new Map()
for (const p of portions.sort((a, b) => Number(a.seq_num) - Number(b.seq_num))) {
  const label = portionLabel(p)
  const grams = Number(p.gram_weight)
  if (!label || !(grams > 0)) continue
  const list = portionsById.get(p.fdc_id) ?? []
  if (list.length < MAX_PORTIONS) list.push([label, round1(grams)])
  portionsById.set(p.fdc_id, list)
}

// Compact rows: [fdcId, name, kcal, protein, carbs, fat, fiber, sugar, satFat, sodiumMg, portions];
// nutrition is per 100 g.
const out = []
for (const f of foods) {
  const n = nutritionById.get(f.fdc_id)
  if (!n || n[NUTRIENTS.kcal] === undefined) continue
  out.push([
    Number(f.fdc_id),
    f.description,
    Math.round(n[NUTRIENTS.kcal]),
    round1(n[NUTRIENTS.protein] ?? 0),
    round1(n[NUTRIENTS.carbs] ?? 0),
    round1(n[NUTRIENTS.fat] ?? 0),
    // Extras are null when USDA has no value, so the app can say "not listed" instead of 0.
    n[NUTRIENTS.fiber] === undefined ? null : round1(n[NUTRIENTS.fiber]),
    n[NUTRIENTS.sugar] === undefined ? null : round1(n[NUTRIENTS.sugar]),
    n[NUTRIENTS.satFat] === undefined ? null : round1(n[NUTRIENTS.satFat]),
    n[NUTRIENTS.sodium] === undefined ? null : Math.round(n[NUTRIENTS.sodium]),
    portionsById.get(f.fdc_id) ?? [],
  ])
}
out.sort((a, b) => a[1].localeCompare(b[1]))

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify({ source: 'USDA FoodData Central, SR Legacy (April 2018), public domain', foods: out }))
console.log(`Wrote ${out.length} foods to ${OUT}`)
