# ScentMatch Data Directory

Organized data management for ScentMatch's comprehensive fragrance database.

## Directory Structure

### `/production/` - Ready for Database Import
- **fragrances_kaggle_processed.json** - Top 2,000 fragrances (filtered from 24K Kaggle data)
- **brands_kaggle_processed.json** - Complete brand metadata (~80 brands)
- **README.md** - Import instructions and quality assurance

### `/hybrid-pipeline/` - Data Processing & Intelligence
- **PIPELINE_PLAN.md** - Comprehensive 3-phase strategy  
- **scripts/** - Python processing and scraping tools
- **config/** - Brand priorities and ethical scraping settings
- **logs/** - Processing logs and monitoring data

### `/kaggle/` - Raw Source Data  
- **fra_cleaned.csv** - 24,064 fragrances from Fragrantica (comprehensive!)
- **perfumes_table.csv** - Alternative dataset (84K records)

### `/research-2025/` - Previous Research (Moved from Root)
- **fragrances-final-2025.json** - 2,017 fragrance research (quality issues identified)
- **brands-final-2025.json** - 76 brands research (data inconsistencies found)

### `/archive/` - Historical Data & Market Research
- **2025-bestsellers-research.json** - Amazon sales data + true global bestsellers
- **2025-market-analysis-report.json** - Comprehensive market analysis (2002 fragrances, 8M+ reviews)
- **fragrances.json** - Original research file (1,467 records)
- **fra_perfumes.csv** - Alternative CSV format
- **Various research reports** - Generation reports, expansion analysis

## Hybrid Data Strategy

**Phase 1:** Process Kaggle's 24K fragrances → filter to top 2K based on quality + brand priority
**Phase 2:** Identify gaps in 2024-2025 releases via ethical Fragrantica scraping  
**Phase 3:** Ongoing intelligence pipeline to keep database current

This approach combines Kaggle's comprehensive coverage with targeted scraping for completeness.