# Fragrance Popularity Research — Findings (preliminary)

Date: 2025-08-10
Scope: fast pass to identify top brands and seed popular SKUs from public retailer pages (no affiliates, no accounts). Output is intentionally lightweight so we can iterate.

## Sources used
- Sephora: Fragrance Bestsellers, Trending, New-in pages
- Ulta: Women’s/Men’s/Unisex Fragrance (sorted by Best Sellers), Featured brands

Collected approx: 679 Ulta listing links, 59 Sephora curated items → 237 deduplicated SKUs in combined seed.

Files (ignored by Git):
- research/output/popular_seed.csv — Sephora curated picks
- research/output/ulta_all.csv — Ulta best-seller listings (multi-category, paged)
- research/output/combined_seed.csv — deduped initial set (Sephora+Ulta)
- research/output/popular_scored.csv — preliminary popularity score (source weight + rank + cross-source)

## Top 50 brands (curated for coverage now)
Dior, Chanel, Gucci, Yves Saint Laurent, Armani, Valentino, Burberry, Versace, Prada, Tom Ford, Carolina Herrera, Jean Paul Gaultier, Dolce & Gabbana, Lancôme, Givenchy, Marc Jacobs, Viktor & Rolf, Ralph Lauren, Calvin Klein, Rabanne, Mugler, Jo Malone London, Maison Margiela, KILIAN Paris, Montblanc, Jimmy Choo, Coach, Chloé, Tiffany & Co., Issey Miyake, Paco Rabanne (Rabanne), Hugo Boss, Azzaro, Hermès, Bvlgari, Guerlain, Narciso Rodriguez, Salvatore Ferragamo, Parfums de Marly (niche), Creed (niche), Juliette Has a Gun, The 7 Virtues, NEST New York, PHLUR, Kayali, Sol de Janeiro, Ariana Grande, Billie Eilish, Kylie Jenner Fragrances, Glossier.

Notes:
- Includes mass-appeal designers + a few niche/celebrity to match current retailer demand.
- We will prune/replace based on measured retailer presence + rank across sources.

## Initial signals model (simple, defensible)
- Source authority (Sephora 1.0, Ulta 0.9)
- Within-source rank position (top of bestseller lists weighted higher)
- Cross-source duplication bonus

This yields a 0–1 score per SKU in research/output/popular_scored.csv for quick ranking.

## Gaps and planned improvements
- Clean brand parsing on Ulta product cards (some anchors contain marketing text). Hydration step is in place but will expand across all items.
- Add more sources (Nordstrom, Macy’s) with similar rank signals.
- Add recency (New/Just Dropped badges) and availability (in-stock) as tie-breakers.
- Build final list: top 50 brands → select 20–40 SKUs per brand with diversity (EDT/EDP, seasons, accords).

## Next steps (what I will do next on “continue”)
1) Expand hydration across all Ulta items to normalize brand/name.
2) Pull Nordstrom/Macy’s best-sellers and merge.
3) Re-rank brands quantitatively; replace curated list with measured Top 50.
4) For each Top 50 brand, select 20–40 SKUs using rank and duplication across sources; export top_brands_selection.csv and a human-readable summary.

## Quick snapshot (top of current scored list)
Examples from research/output/popular_scored.csv (Sephora-weighted): Prada Luna Rossa Ocean EDP, Sol de Janeiro Sundays in Rio Mist, Tom Ford Fucking Fabulous, Azzaro The Most Wanted Parfum, Maison Margiela Replica By the Fireplace, KAYALI Vanilla | 28.
