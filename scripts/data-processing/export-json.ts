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

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseListField(s: string): string[] {
  if (!s) return []
  // Expect a Python-like list string: ['a', 'b'] possibly with quotes
  const inner = s.trim().replace(/^\[|\]$/g, '')
  if (!inner) return []
  return inner
    .split(',')
    .map(x => x.replace(/^\s*['\"]?|['\"]?\s*$/g, ''))
    .map(x => x.trim())
    .filter(Boolean)
}

async function main() {
  const inputPath = new URL('../output/kaggle_top_brands_selection.cleaned.csv', import.meta.url)
  const text = await readFile(inputPath, 'utf8')
  const rows = parseCsv(text)

  type Brand = { id: string; name: string; slug: string; itemCount: number }
  type Fragrance = {
    id: string
    brandId: string
    brandName: string
    name: string
    slug: string
    ratingValue: number
    ratingCount: number
    score: number
    gender: string
    accords: string[]
    perfumers: string[]
    url: string
  }

  const brands = new Map<string, Brand>()
  const frags: Fragrance[] = []
  for (const r of rows) {
    const brandSlug = slugify(r.brand)
    const brandId = brandSlug
    if (!brands.has(brandId)) {
      brands.set(brandId, { id: brandId, name: r.brand, slug: brandSlug, itemCount: 0 })
    }
    const nameSlug = slugify(r.name)
    const id = `${brandSlug}__${nameSlug}`
    frags.push({
      id,
      brandId,
      brandName: r.brand,
      name: r.name,
      slug: nameSlug,
      ratingValue: r.rating_value,
      ratingCount: r.rating_count,
      score: r.score,
      gender: r.gender,
      accords: parseListField(r.main_accords),
      perfumers: parseListField(r.perfumers),
      url: r.url,
    })
    const b = brands.get(brandId)!
    b.itemCount++
  }

  const brandsArr = Array.from(brands.values()).sort((a, b) => b.itemCount - a.itemCount || a.name.localeCompare(b.name))
  frags.sort((a, b) => a.brandName.localeCompare(b.brandName) || b.score - a.score)

  await writeFile(new URL('../output/brands.json', import.meta.url), JSON.stringify(brandsArr, null, 2), 'utf8')
  await writeFile(new URL('../output/fragrances.json', import.meta.url), JSON.stringify(frags, null, 2), 'utf8')
}

main().catch(err => { console.error(err); process.exitCode = 1 })




