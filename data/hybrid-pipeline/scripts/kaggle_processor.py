#!/usr/bin/env python3
"""
Kaggle Data Processor - Phase 1 of Hybrid Pipeline
Processes fra_cleaned.csv (24K fragrances) → filters to top 2K for production database
"""

import pandas as pd
import math
import json
import re
from pathlib import Path

def load_config():
    """Load brand priorities and filtering configuration"""
    config_dir = Path(__file__).parent.parent / "config"
    
    # Load brand priorities
    with open(config_dir / "brand_priorities.json") as f:
        brand_config = json.load(f)
    
    # Load market research integration
    with open(config_dir / "market_research_integration.json") as f:
        research_config = json.load(f)
    
    return {**brand_config, "research": research_config}

def calculate_priority_score(row, config):
    """
    Calculate comprehensive priority score for fragrance selection
    Combines rating quality, review count, brand prestige, and manual boosts
    """
    try:
        # Parse rating and review data
        rating_str = str(row['Rating Value'])
        rating = float(rating_str.replace(',', '.')) if rating_str and rating_str != 'nan' else 0
        
        reviews_str = str(row['Rating Count'])
        reviews = int(reviews_str.replace(',', '')) if reviews_str and reviews_str != 'nan' and reviews_str else 0
        year = int(row['Year']) if row['Year'] and str(row['Year']).isdigit() else 2000
        brand = str(row['Brand']).lower().strip()
        perfume_name = str(row['Perfume']).lower()
        
        # Base popularity score (logarithmic scaling for reviews)
        if reviews > 0 and rating > 0:
            base_score = rating * math.log(reviews + 1)
        else:
            return 0  # Skip fragrances without ratings/reviews
        
        # Brand tier boost
        brand_boost = 1.0
        for tier, data in config.items():
            if isinstance(data, dict) and 'brands' in data:
                if brand in data['brands']:
                    brand_boost = data['boost_multiplier']
                    break
        
        # Recency boost for modern releases
        if year >= 2020:
            recency_boost = 1.2
        elif year >= 2015:
            recency_boost = 1.1
        elif year >= 2010:
            recency_boost = 1.05
        else:
            recency_boost = 1.0
        
        # Research-validated bestseller boost (highest priority)
        bestseller_boost = 1.0
        if 'research' in config:
            bestsellers = config['research']['research_sources']['2025_bestsellers_research']['key_insights']['true_bestsellers']
            for bestseller in bestsellers:
                bestseller_name = bestseller['name'].lower().replace(' ', '-')
                if bestseller_name.replace('-', '') in perfume_name.replace('-', '').replace(' ', ''):
                    bestseller_boost = config['proven_bestsellers_2025']['manual_boost']
                    break
        
        # Classic fragrance manual boost
        classic_boost = 1.0
        if 'classic_fragrances' in config:
            for classic in config['classic_fragrances']['fragrances']:
                if classic.replace('-', '').replace(' ', '') in perfume_name.replace('-', '').replace(' ', ''):
                    classic_boost = config['classic_fragrances']['manual_boost']
                    break
        
        # Calculate final score (research-validated bestsellers get highest priority)
        final_score = base_score * brand_boost * recency_boost * bestseller_boost * classic_boost
        
        return final_score
        
    except (ValueError, TypeError, KeyError) as e:
        print(f"Error processing row: {e}")
        return 0

def clean_fragrance_data(row):
    """Clean and normalize fragrance data for database import"""
    
    # Clean name (remove brand from fragrance name)
    name = str(row['Perfume']).strip()
    brand = str(row['Brand']).strip()
    
    # Remove brand from name if present
    name_cleaned = re.sub(rf'^{re.escape(brand)}\s*[-:]?\s*', '', name, flags=re.IGNORECASE)
    name_cleaned = re.sub(r'\s+', ' ', name_cleaned).strip()
    
    # Normalize gender
    gender = str(row['Gender']).lower().strip()
    if 'women' in gender and 'men' not in gender:
        gender_normalized = 'women'
    elif 'men' in gender and 'women' not in gender:
        gender_normalized = 'men'
    else:
        gender_normalized = 'unisex'
    
    # Generate IDs
    brand_id = re.sub(r'[^a-z0-9]+', '-', brand.lower()).strip('-')
    fragrance_slug = re.sub(r'[^a-z0-9]+', '-', name_cleaned.lower()).strip('-')
    fragrance_id = f"{brand_id}__{fragrance_slug}"
    
    # Parse accords
    accords = []
    for i in range(1, 6):  # mainaccord1 through mainaccord5
        accord_col = f'mainaccord{i}'
        if accord_col in row and row[accord_col] and str(row[accord_col]).strip():
            accords.append(str(row[accord_col]).strip())
    
    # Calculate sample price based on brand tier and popularity
    rating_str = str(row['Rating Value'])
    rating = float(rating_str.replace(',', '.')) if rating_str and rating_str != 'nan' else 3.0
    sample_price = 15  # Base price
    
    luxury_brands = ['dior', 'chanel', 'tom-ford', 'creed', 'hermès']
    if brand_id in luxury_brands:
        sample_price = 20
    elif rating >= 4.5:
        sample_price = 18
    elif rating >= 4.0:
        sample_price = 16
    
    return {
        'id': fragrance_id,
        'brand_id': brand_id,
        'brand_name': brand,
        'name': name_cleaned,
        'slug': fragrance_slug,
        'rating_value': rating,
        'rating_count': int(str(row['Rating Count']).replace(',', '')) if str(row['Rating Count']) != 'nan' else 0,
        'year': int(row['Year']) if row['Year'] and str(row['Year']).isdigit() else None,
        'gender': gender_normalized,
        'accords': accords,
        'top_notes': row['Top'] if row['Top'] else '',
        'middle_notes': row['Middle'] if row['Middle'] else '',
        'base_notes': row['Base'] if row['Base'] else '',
        'perfumers': [p.strip() for p in str(row['Perfumer1']).split(',') if p.strip() != 'unknown'],
        'fragrantica_url': row['url'] if row['url'] else '',
        'sample_available': True,
        'sample_price_usd': sample_price,
        'priority_score': row.get('priority_score', 0)
    }

def main():
    """Main processing pipeline"""
    print("🔄 Loading Kaggle dataset (24K fragrances)...")
    
    # Load raw data
    kaggle_path = Path(__file__).parent.parent.parent / "kaggle" / "fra_cleaned.csv"
    df = pd.read_csv(kaggle_path, sep=';', encoding='latin-1')
    
    print(f"✅ Loaded {len(df)} total fragrances from Kaggle")
    
    # Load configuration
    config = load_config()
    
    print("🔄 Calculating priority scores...")
    
    # Calculate priority scores for all fragrances
    df['priority_score'] = df.apply(lambda row: calculate_priority_score(row, config), axis=1)
    
    # Filter out zero-score fragrances (no ratings/reviews)
    df_valid = df[df['priority_score'] > 0].copy()
    
    print(f"✅ Filtered to {len(df_valid)} fragrances with valid ratings")
    
    # Sort by priority score and take top 2000
    df_top = df_valid.nlargest(2000, 'priority_score')
    
    print(f"✅ Selected top {len(df_top)} fragrances for database import")
    
    # Clean and transform data
    print("🔄 Cleaning and transforming data...")
    
    cleaned_data = []
    brand_data = {}
    
    for _, row in df_top.iterrows():
        cleaned = clean_fragrance_data(row)
        cleaned_data.append(cleaned)
        
        # Track brand data
        brand_id = cleaned['brand_id']
        if brand_id not in brand_data:
            brand_data[brand_id] = {
                'id': brand_id,
                'name': cleaned['brand_name'],
                'slug': brand_id,
                'fragrance_count': 0
            }
        brand_data[brand_id]['fragrance_count'] += 1
    
    # Save processed data
    output_dir = Path(__file__).parent.parent.parent / "production"
    
    # Save fragrances
    fragrances_df = pd.DataFrame(cleaned_data)
    fragrances_path = output_dir / "fragrances_kaggle_processed.json"
    fragrances_df.to_json(fragrances_path, orient='records', indent=2)
    
    # Save brands
    brands_df = pd.DataFrame(list(brand_data.values()))
    brands_path = output_dir / "brands_kaggle_processed.json"
    brands_df.to_json(brands_path, orient='records', indent=2)
    
    print(f"✅ Saved {len(cleaned_data)} fragrances to {fragrances_path}")
    print(f"✅ Saved {len(brand_data)} brands to {brands_path}")
    
    # Print summary statistics
    print("\n📊 Dataset Summary:")
    print(f"Total Fragrances: {len(cleaned_data)}")
    print(f"Total Brands: {len(brand_data)}")
    print(f"Average Rating: {fragrances_df['rating_value'].mean():.2f}")
    print(f"Total Reviews: {fragrances_df['rating_count'].sum():,}")
    
    # Top brands by fragrance count
    print(f"\n🏆 Top Brands by Coverage:")
    top_brands = brands_df.nlargest(10, 'fragrance_count')
    for _, brand in top_brands.iterrows():
        print(f"  {brand['name']}: {brand['fragrance_count']} fragrances")
    
    # Top fragrances by priority score
    print(f"\n⭐ Top 10 Priority Fragrances:")
    top_fragrances = fragrances_df.nlargest(10, 'priority_score')
    for _, frag in top_fragrances.iterrows():
        print(f"  {frag['name']} by {frag['brand_name']} (Score: {frag['priority_score']:.2f})")

if __name__ == "__main__":
    main()