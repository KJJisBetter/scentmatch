import { readFile, writeFile } from 'node:fs/promises'

type Row = {
  brand: string
  name: string
  rating_value: number
  rating_count: number
  score: number
  gender: string
  main_accords: string
  perfumers: string
  url: string
}

function csvSplit(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else { cur += ch }
    } else {
      if (ch === ',') { out.push(cur); cur = '' }
      else if (ch === '"') { inQuotes = true }
      else { cur += ch }
    }
  }
  out.push(cur)
  return out
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/)
  const header = lines.shift() || ''
  const cols = header.split(',')
  const idx = {
    brand: cols.indexOf('brand'),
    name: cols.indexOf('name'),
    rating_value: cols.indexOf('rating_value'),
    rating_count: cols.indexOf('rating_count'),
    score: cols.indexOf('score'),
    gender: cols.indexOf('gender'),
    main_accords: cols.indexOf('main_accords'),
    perfumers: cols.indexOf('perfumers'),
    url: cols.indexOf('url'),
  }
  const out: Row[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    const p = csvSplit(line)
    out.push({
      brand: p[idx.brand],
      name: p[idx.name],
      rating_value: Number(p[idx.rating_value] || '0'),
      rating_count: Number(p[idx.rating_count] || '0'),
      score: Number(p[idx.score] || '0'),
      gender: p[idx.gender],
      main_accords: p[idx.main_accords],
      perfumers: p[idx.perfumers],
      url: p[idx.url],
    })
  }
  return out
}

function titleCase(s: string): string {
  return s.replace(/\S+/g, (w) => w[0] ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)
}

function brandDisplay(brand: string): string {
  const b = brand.trim().toLowerCase()
  const map: Record<string, string> = {
    'yves saint laurent': 'Yves Saint Laurent',
    'armani': 'Armani',
    'carolina herrera': 'Carolina Herrera',
    'dolce gabbana': 'Dolce & Gabbana',
    'dolce & gabbana': 'Dolce & Gabbana',
    'bvlgari': 'Bvlgari',
    'bulgari': 'Bvlgari',
    'paco rabanne': 'Rabanne',
    'rabanne': 'Rabanne',
    'kilian paris': 'KILIAN Paris',
    'jo malone london': 'Jo Malone London',
    'maison margiela': 'Maison Margiela',
    'the 7 virtues': 'The 7 Virtues',
    'narciso rodriguez': 'Narciso Rodriguez',
  }
  return map[b] || titleCase(b)
}

function cleanName(raw: string, brandDisplayName: string): string {
  let n = (raw || '').replace(/\s+/g, ' ').trim()
  // remove brand token even if fused with following text
  const brandEsc = brandDisplayName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const brandPatternLoose = new RegExp(brandEsc, 'i')
  n = n.replace(brandPatternLoose, ' ').replace(/\s+/g, ' ').trim()
  // remove gender suffixes (with or without preceding space)
  n = n.replace(/\s*for\s*(women\s*and\s*men|men\s*and\s*women|women|men)\b/gi, '').trim()
  // remove common noise tokens
  n = n.replace(/\b(EDP|EDT)\b\s*$/i, (m) => m.toUpperCase())
  return n
}

function isAncillary(name: string): boolean {
  const n = name.toLowerCase()
  return (
    /(gift set|coffret|discovery|sampler|sample|mini set|travel set|travel spray|rollerball|refill|refillable)/.test(n) ||
    /(body mist|body spray|hair mist|hair & body mist|hair and body mist)/.test(n) ||
    /(body\s+(lotion|cream|milk|wash|gel)|shower gel|deodorant|soap|after shave|aftershave)/.test(n)
  )
}

function normalizeKey(s: string): string {
  return s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

async function main() {
  const inputPath = new URL('../output/kaggle_top_brands_selection.csv', import.meta.url)
  const outputPath = new URL('../output/kaggle_top_brands_selection.cleaned.csv', import.meta.url)
  const summaryPath = new URL('../output/kaggle_clean_summary.md', import.meta.url)
  const text = await readFile(inputPath, 'utf8')
  const rows = parseCsv(text)

  const MIN_RATING_COUNT = Number(process.argv[2] ?? '50')

  const kept: Row[] = []
  const removed: Array<{ reason: string; row: Row }> = []
  const seen = new Set<string>()

  for (const r of rows) {
    const brandName = brandDisplay(r.brand)
    const cleanedName = cleanName(r.name, brandName)
    const key = `${normalizeKey(brandName)}::${normalizeKey(cleanedName)}`
    if (r.rating_count < MIN_RATING_COUNT) { removed.push({ reason: 'low_count', row: r }); continue }
    if (isAncillary(cleanedName)) { removed.push({ reason: 'ancillary', row: r }); continue }
    if (seen.has(key)) { removed.push({ reason: 'duplicate', row: r }); continue }
    seen.add(key)
    kept.push({ ...r, brand: brandName, name: cleanedName })
  }

  // Sort by brand then composite score
  kept.sort((a, b) => a.brand.localeCompare(b.brand) || b.score - a.score)

  const header = 'brand,name,rating_value,rating_count,score,gender,main_accords,perfumers,url\n'
  const csv = header + kept.map(o => [o.brand, o.name, o.rating_value.toFixed(2), String(o.rating_count), o.score.toFixed(4), o.gender, o.main_accords, o.perfumers, o.url].map(v => {
    const s = v ?? ''
    return String(s).includes(',') || String(s).includes('"') ? `"${String(s).replaceAll('"', '""')}"` : String(s)
  }).join(',')).join('\n') + '\n'
  await writeFile(outputPath, csv, 'utf8')

  // Build summary
  const byBrandCount = new Map<string, number>()
  for (const k of kept) byBrandCount.set(k.brand, (byBrandCount.get(k.brand) || 0) + 1)
  const removalsByReason = new Map<string, number>()
  for (const rm of removed) removalsByReason.set(rm.reason, (removalsByReason.get(rm.reason) || 0) + 1)
  const examples = removed.slice(0, 15).map(rm => `- ${rm.reason}: ${rm.row.brand} — ${rm.row.name}`)

  const lines: string[] = []
  lines.push(`# Kaggle selection cleaning summary`)
  lines.push('')
  lines.push(`Kept: ${kept.length} rows`)
  lines.push(`Removed: ${removed.length} rows`)
  lines.push('')
  lines.push(`By brand (top 20):`)
  const topBrands = Array.from(byBrandCount.entries()).sort((a,b)=>b[1]-a[1]).slice(0,20)
  for (const [b, c] of topBrands) lines.push(`- ${b}: ${c}`)
  lines.push('')
  lines.push(`Removal reasons:`)
  for (const [reason, c] of removalsByReason.entries()) lines.push(`- ${reason}: ${c}`)
  lines.push('')
  lines.push('Examples (first 15 removals):')
  lines.push(...examples)
  lines.push('')
  await writeFile(summaryPath, lines.join('\n'), 'utf8')
}

main().catch(err => { console.error(err); process.exitCode = 1 })
