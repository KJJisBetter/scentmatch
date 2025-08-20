# ScentMatch Hybrid Data Pipeline Plan

## Overview

Sophisticated 3-phase approach to build the world's best fragrance database by combining Kaggle's comprehensive dataset (24K fragrances) with targeted Fragrantica scraping for gaps and ongoing intelligence.

## Phase 1: Kaggle Foundation (Immediate - 2 hours)

### Source Data
- **File:** `../kaggle/fra_cleaned.csv`
- **Total Records:** 24,064 fragrances
- **Coverage:** Complete collections (Dior 196, Chanel 100, Tom Ford 91)
- **Quality:** Real Fragrantica ratings and reviews

### Filtering Strategy (24K → 2K)
```python
def calculate_priority_score(fragrance):
    rating = float(fragrance['Rating Value'].replace(',', '.'))
    reviews = int(fragrance['Rating Count'].replace(',', ''))
    year = int(fragrance['Year']) if fragrance['Year'] else 2000
    brand = fragrance['Brand'].lower()
    
    # Base popularity score (emphasizes quality + community validation)
    base_score = rating * math.log(reviews + 1)
    
    # Luxury brand boost (ensure premium brands are well-represented)
    luxury_brands = ['dior', 'chanel', 'tom-ford', 'creed', 'hermès', 'guerlain']
    premium_brands = ['yves-saint-laurent', 'paco-rabanne', 'versace', 'armani']
    
    if brand in luxury_brands:
        brand_boost = 1.8
    elif brand in premium_brands:
        brand_boost = 1.5
    else:
        brand_boost = 1.0
    
    # Recency factor (slight preference for modern classics)
    if year >= 2020:
        recency_boost = 1.2
    elif year >= 2010:
        recency_boost = 1.1
    else:
        recency_boost = 1.0
    
    # Manual boost for known classics
    classic_fragrances = [
        'sauvage', 'bleu-de-chanel', 'aventus', 'black-orchid',
        'la-nuit-de-lhomme', 'allure-homme-sport', 'terre-dhermes'
    ]
    
    classic_boost = 1.5 if any(classic in fragrance['Perfume'].lower() for classic in classic_fragrances) else 1.0
    
    return base_score * brand_boost * recency_boost * classic_boost

# Target: Top 2,000 highest-scoring fragrances
```

### Data Transformation
```python
# Clean and normalize for database import
transformations = {
    "name_cleaning": "Remove brand from name, fix spacing",
    "gender_normalization": "'men'/'women'/'unisex' standardization", 
    "brand_id_generation": "kebab-case brand IDs",
    "accord_parsing": "Convert mainaccord1-5 to array",
    "sample_pricing": "Calculate based on brand tier + popularity",
    "slug_generation": "URL-friendly fragrance slugs"
}
```

## Phase 2: Gap Analysis & Targeted Scraping (Next Day - 2 hours)

### Identify Missing Popular Fragrances
```python
gap_detection = {
    "method": "Compare Kaggle 2K vs current trending fragrances",
    "sources": [
        "https://www.fragrantica.com/trending/",
        "https://www.fragrantica.com/new_releases/",
        "Social media trending (TikTok, Instagram mentions)"
    ],
    "criteria": "Released 2024-2025 + >4.0 rating + >500 reviews"
}
```

### Respectful Scraping Protocol
```python
scraping_ethics = {
    "delay": 2000,  # 2 seconds between requests (more than required)
    "user_agent": "ScentMatch Research Bot v1.0 (+https://scentmatch.com/contact)",
    "headers": {
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    },
    "max_concurrent": 1,  # Sequential requests only
    "timeout": 10000,
    "max_retries": 3,
    "respect_robots": True
}
```

## Phase 3: Ongoing Intelligence Pipeline (Continuous)

### Weekly Monitoring System
```python
monitoring_schedule = {
    "frequency": "Every Sunday 2 AM",
    "targets": [
        "Fragrantica trending page",
        "New releases with >100 reviews",
        "Major brand new launches"
    ],
    "auto_criteria": "Only add if rating >4.0 AND reviews >500",
    "notification": "Slack/email for manual review of additions"
}
```

### Database Maintenance
```python
maintenance_tasks = {
    "update_popularity_scores": "Refresh scores based on new review counts",
    "embedding_generation": "Auto-trigger for new fragrances", 
    "data_quality_checks": "Monitor for duplicate/inconsistent data",
    "performance_optimization": "Analyze query patterns, optimize indexes"
}
```

## Implementation Files Structure

### Scripts Directory: `/data/hybrid-pipeline/scripts/`
- `01_kaggle_processor.py` - Filter and clean 24K → 2K
- `02_gap_analyzer.py` - Identify missing popular fragrances  
- `03_ethical_scraper.py` - Targeted Fragrantica scraping
- `04_database_importer.py` - Batch import to Supabase
- `05_ongoing_monitor.py` - Weekly intelligence gathering

### Configuration: `/data/hybrid-pipeline/config/`
- `scraping_ethics.json` - Rate limits and respectful settings
- `brand_priorities.json` - Luxury brand boost configurations
- `classic_fragrances.json` - Manual boost list for known classics

### Monitoring: `/data/hybrid-pipeline/logs/`
- Daily scraping logs
- Database import reports  
- Performance metrics

## Expected Results

### Database Content (2,000 fragrances)
- **Luxury Complete:** All Dior, Chanel, Tom Ford, Creed collections
- **Popular First:** Sauvage, Bleu de Chanel, Aventus in top 20
- **Modern Coverage:** 2024-2025 releases included
- **Quality Assured:** All fragrances have >3.5 rating + >100 reviews

### Ongoing Benefits
- **Always Current:** Weekly monitoring keeps database fresh
- **Respectful:** Minimal Fragrantica server load
- **Scalable:** Can expand to premium Supabase later
- **Intelligent:** Only adds genuinely popular new releases

This approach gives us the best of both worlds: comprehensive coverage from Kaggle + cutting-edge data from targeted scraping!