import { z } from 'zod'

export const FragranceSchema = z.object({
  brand: z.string(),
  name: z.string(),
  concentration: z.enum(['EDT','EDP','PARFUM','COLOGNE','OTHER']).default('OTHER'),
  launchYear: z.number().int().min(1900).max(new Date().getFullYear()).nullable().default(null),
  notes: z.object({ top: z.array(z.string()).default([]), middle: z.array(z.string()).default([]), base: z.array(z.string()).default([]) }).default({ top: [], middle: [], base: [] }),
  sizesMl: z.array(z.number()).default([]),
  imageUrl: z.string().url().nullable().default(null),
  productUrl: z.string().url(),
})

export type Fragrance = z.infer<typeof FragranceSchema>

export function normalizeBrand(s: string): string {
  return s.normalize('NFKC').trim().replace(/\s+/g,' ')
}

export function normalizeName(s: string): string {
  return s.normalize('NFKC').trim().replace(/\s+/g,' ')
}

export function normalizeConc(s?: string): 'EDT'|'EDP'|'PARFUM'|'COLOGNE'|'OTHER' {
  const v = (s||'').toUpperCase()
  if (/(EAU\s*DE\s*TOILETTE|\bEDT\b)/.test(v)) return 'EDT'
  if (/(EAU\s*DE\s*PARFUM|\bEDP\b)/.test(v)) return 'EDP'
  if (/(PARFUM|EXTRAIT)/.test(v)) return 'PARFUM'
  if (/(COLOGNE|EDC)/.test(v)) return 'COLOGNE'
  return 'OTHER'
}

export function canonicalKey(f: Pick<Fragrance,'brand'|'name'|'concentration'>): string {
  return `${normalizeBrand(f.brand).toLowerCase()}::${normalizeName(f.name).toLowerCase()}::${f.concentration}`
}
