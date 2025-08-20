#!/usr/bin/env python3
"""
Make Perfected Data Compatible with Current Schema
Strip new fields but keep core improvements that work with existing schema
"""

import json

def make_compatible():
    """Make perfected data compatible with current database schema"""
    
    # Current schema fields only
    allowed_fragrance_fields = {
        'id', 'brand_id', 'name', 'slug', 'gender', 'launch_year', 'perfumers',
        'fragrance_family', 'main_accords', 'top_notes', 'middle_notes', 'base_notes',
        'scent_profile_vector', 'full_description', 'short_description', 'scent_story',
        'rating_value', 'rating_count', 'popularity_score', 'kaggle_score', 'trending_score',
        'sample_available', 'sample_price_usd', 'travel_size_available', 'full_bottle_min_price',
        'affiliate_urls', 'search_vector', 'personality_tags', 'occasion_tags', 'season_tags',
        'data_source', 'import_batch', 'is_verified', 'last_updated', 'created_at',
        'fragrantica_url', 'image_url'
    }
    
    allowed_brand_fields = {
        'id', 'name', 'slug', 'origin_country', 'founded_year', 'brand_tier',
        'website_url', 'is_active', 'sample_availability_score', 'affiliate_supported',
        'created_at', 'updated_at'
    }
    
    # Load perfected data
    with open('output/fragrances_industry_perfected.json', 'r') as f:
        fragrances = json.load(f)
    
    with open('output/brands_industry_perfected.json', 'r') as f:
        brands = json.load(f)
    
    print(f"📊 Making {len(fragrances)} fragrances compatible...")
    
    # Filter fragrances to allowed fields + map improvements to existing fields
    compatible_fragrances = []
    
    for fragrance in fragrances:
        compatible = {}
        
        # Copy allowed fields
        for field in allowed_fragrance_fields:
            if field in fragrance:
                compatible[field] = fragrance[field]
        
        # CRITICAL: Ensure accords field exists (map from various sources)
        if 'main_accords' not in compatible and 'accords' not in compatible:
            # Try to get accords from original data
            if 'accords' in fragrance:
                compatible['main_accords'] = fragrance['accords']
            elif 'main_accords' in fragrance:
                compatible['main_accords'] = fragrance['main_accords']
            else:
                # Use empty array as fallback (but this shouldn't happen)
                compatible['main_accords'] = []
        
        # Map improvements to existing fields
        if 'brand_name' in fragrance:
            # Store improved brand name in short_description for now
            compatible['short_description'] = f"By {fragrance['brand_name']}"
        
        if 'enhanced_description' in fragrance:
            # Use enhanced description as full_description
            compatible['full_description'] = fragrance['enhanced_description']
        
        if 'bayesian_rating' in fragrance:
            # Map Bayesian rating to trending_score (0-100 scale)
            compatible['trending_score'] = int(fragrance['bayesian_rating'] * 20)
        
        # Map sample pricing improvements
        if 'sample_price' in fragrance:
            compatible['sample_price_usd'] = fragrance['sample_price']
        
        if 'full_bottle_price' in fragrance:
            compatible['full_bottle_min_price'] = fragrance['full_bottle_price']
        
        # Ensure required fields
        compatible['data_source'] = 'hybrid_pipeline_perfected'
        compatible['is_verified'] = True
        compatible['sample_available'] = True
        
        compatible_fragrances.append(compatible)
    
    # Filter brands to allowed fields
    compatible_brands = []
    
    for brand in brands:
        compatible = {}
        
        # Copy allowed fields
        for field in allowed_brand_fields:
            if field in brand:
                compatible[field] = brand[field]
        
        # Map display_name to name for now
        if 'display_name' in brand:
            compatible['name'] = brand['display_name']
        
        # Ensure required fields
        compatible['is_active'] = True
        compatible['affiliate_supported'] = False
        
        compatible_brands.append(compatible)
    
    # Save compatible versions
    with open('output/fragrances_compatible.json', 'w') as f:
        json.dump(compatible_fragrances, f, indent=2, ensure_ascii=False)
    
    with open('output/brands_compatible.json', 'w') as f:
        json.dump(compatible_brands, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Created compatible versions:")
    print(f"  Fragrances: {len(compatible_fragrances)} records")
    print(f"  Brands: {len(compatible_brands)} records")
    print(f"💾 Saved: output/fragrances_compatible.json")
    print(f"💾 Saved: output/brands_compatible.json")

if __name__ == '__main__':
    make_compatible()