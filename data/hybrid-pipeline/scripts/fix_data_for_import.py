#!/usr/bin/env python3
"""
Fix Hybrid Pipeline Data for Complete Import
Normalize field structures, remove duplicates, fix validation errors
"""

import json
import os
import sys
from typing import Dict, List, Any
from collections import defaultdict

def normalize_fragrance_record(fragrance: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize fragrance record to consistent field structure"""
    normalized = {}
    
    # Core required fields
    normalized['id'] = fragrance.get('id', '')
    normalized['brand_id'] = fragrance.get('brand_id', '')
    normalized['name'] = fragrance.get('name', '')
    normalized['slug'] = fragrance.get('slug', '')
    normalized['gender'] = fragrance.get('gender', 'unisex')
    
    # Handle brand name variations
    if 'brand_name' in fragrance:
        normalized['brand_name'] = fragrance['brand_name']
    elif 'brand' in fragrance:
        normalized['brand_name'] = fragrance['brand']
    else:
        normalized['brand_name'] = fragrance.get('brand_id', '')
    
    # Scent data - use 'accords' as the standard
    if 'accords' in fragrance:
        normalized['accords'] = fragrance['accords']
    elif 'main_accords' in fragrance:
        normalized['accords'] = fragrance['main_accords']
    else:
        normalized['accords'] = []
    
    # Notes fields
    normalized['top_notes'] = fragrance.get('top_notes', '')
    normalized['middle_notes'] = fragrance.get('middle_notes', '')
    normalized['base_notes'] = fragrance.get('base_notes', '')
    
    # Perfumers
    normalized['perfumers'] = fragrance.get('perfumers', [])
    
    # Rating data
    normalized['rating_value'] = fragrance.get('rating_value')
    normalized['rating_count'] = fragrance.get('rating_count')
    
    # Year data
    normalized['year'] = fragrance.get('year')
    
    # Priority/popularity score - use whichever exists
    if 'priority_score' in fragrance:
        normalized['priority_score'] = fragrance['priority_score']
    elif 'popularity_score' in fragrance:
        normalized['priority_score'] = fragrance['popularity_score']
    else:
        # Calculate basic priority from rating and reviews
        rating = fragrance.get('rating_value', 0) or 0
        reviews = fragrance.get('rating_count', 0) or 0
        normalized['priority_score'] = rating * 10 + (reviews / 1000)
    
    # Sample data
    normalized['sample_available'] = fragrance.get('sample_available', True)
    normalized['sample_price_usd'] = fragrance.get('sample_price_usd', 15)
    
    # URLs
    normalized['fragrantica_url'] = fragrance.get('fragrantica_url', '')
    
    return normalized

def fix_validation_errors(fragrances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Fix records with validation errors"""
    fixed_fragrances = []
    
    for fragrance in fragrances:
        # Skip records with empty names that can't be fixed
        if not fragrance.get('name') and not fragrance.get('id'):
            print(f"⏭️  Skipping unfixable record: {fragrance.get('id', 'no_id')}")
            continue
        
        # Try to fix empty names from ID
        if not fragrance.get('name') and fragrance.get('id'):
            id_parts = fragrance['id'].split('__')
            if len(id_parts) == 2:
                brand_part, name_part = id_parts
                if name_part:  # If there's a name part in the ID
                    fragrance['name'] = name_part
                    fragrance['slug'] = name_part
                    print(f"✅ Fixed name for: {fragrance['id']}")
                else:
                    print(f"⏭️  Skipping empty name: {fragrance['id']}")
                    continue
        
        # Fix empty slugs
        if not fragrance.get('slug') and fragrance.get('name'):
            fragrance['slug'] = fragrance['name'].lower().replace(' ', '-')
        
        fixed_fragrances.append(fragrance)
    
    return fixed_fragrances

def remove_duplicates(fragrances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove duplicate records, keeping the best one"""
    id_groups = defaultdict(list)
    
    # Group by ID
    for fragrance in fragrances:
        id_groups[fragrance['id']].append(fragrance)
    
    deduplicated = []
    duplicates_removed = 0
    
    for frag_id, group in id_groups.items():
        if len(group) == 1:
            # No duplicates
            deduplicated.append(group[0])
        else:
            # Multiple records with same ID - pick the best one
            duplicates_removed += len(group) - 1
            
            # Sort by data quality (more fields = better)
            def record_quality_score(record):
                score = 0
                score += 10 if record.get('rating_value') else 0
                score += 10 if record.get('rating_count') else 0
                score += 5 if record.get('top_notes') else 0
                score += 5 if record.get('middle_notes') else 0
                score += 5 if record.get('base_notes') else 0
                score += 3 if record.get('perfumers') else 0
                score += 1 if record.get('fragrantica_url') else 0
                return score
            
            best_record = max(group, key=record_quality_score)
            deduplicated.append(best_record)
            
            print(f"🔧 Deduplicated {frag_id}: kept best of {len(group)} records")
    
    print(f"📊 Removed {duplicates_removed} duplicate records")
    return deduplicated

def validate_final_data(fragrances: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Validate the final cleaned data"""
    validation_results = {
        'total_records': len(fragrances),
        'validation_errors': [],
        'warnings': [],
        'quality_stats': {}
    }
    
    # Check for remaining issues
    for i, fragrance in enumerate(fragrances):
        # Required field checks
        if not fragrance.get('id'):
            validation_results['validation_errors'].append(f"Record {i}: Missing ID")
        if not fragrance.get('name'):
            validation_results['validation_errors'].append(f"Record {i}: Missing name")
        if not fragrance.get('brand_id'):
            validation_results['validation_errors'].append(f"Record {i}: Missing brand_id")
        
        # Quality checks
        if not fragrance.get('rating_value'):
            validation_results['warnings'].append(f"Record {fragrance.get('id', i)}: Missing rating")
    
    # Calculate quality statistics
    rated_fragrances = [f for f in fragrances if f.get('rating_value')]
    if rated_fragrances:
        ratings = [f['rating_value'] for f in rated_fragrances]
        validation_results['quality_stats'] = {
            'avg_rating': sum(ratings) / len(ratings),
            'min_rating': min(ratings),
            'max_rating': max(ratings),
            'records_with_ratings': len(rated_fragrances),
            'records_with_notes': len([f for f in fragrances if f.get('top_notes')])
        }
    
    return validation_results

def main():
    """Fix the hybrid pipeline data for complete import"""
    
    # Load source data
    input_file = 'output/fragrances_final_20250819_142442.json'
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        sys.exit(1)
    
    print(f"📁 Loading data from: {input_file}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        fragrances = json.load(f)
    
    print(f"📊 Original data: {len(fragrances)} records")
    
    # Step 1: Normalize field structures
    print("🔧 Step 1: Normalizing field structures...")
    normalized_fragrances = [normalize_fragrance_record(f) for f in fragrances]
    
    # Step 2: Remove duplicates
    print("🔧 Step 2: Removing duplicates...")
    deduplicated_fragrances = remove_duplicates(normalized_fragrances)
    
    # Step 3: Fix validation errors
    print("🔧 Step 3: Fixing validation errors...")
    fixed_fragrances = fix_validation_errors(deduplicated_fragrances)
    
    # Step 4: Validate final data
    print("🔍 Step 4: Validating final data...")
    validation_results = validate_final_data(fixed_fragrances)
    
    print(f"📊 Final results:")
    print(f"  Original: {len(fragrances)} records")
    print(f"  Final: {len(fixed_fragrances)} records")
    print(f"  Loss: {len(fragrances) - len(fixed_fragrances)} records")
    print(f"  Validation errors: {len(validation_results['validation_errors'])}")
    print(f"  Warnings: {len(validation_results['warnings'])}")
    
    if validation_results['quality_stats']:
        stats = validation_results['quality_stats']
        print(f"  Average rating: {stats['avg_rating']:.2f}")
        print(f"  Records with ratings: {stats['records_with_ratings']}")
    
    # Save fixed data
    output_file = 'output/fragrances_fixed_for_import.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(fixed_fragrances, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved fixed data to: {output_file}")
    print(f"✅ Ready for import: {len(fixed_fragrances)} clean records")
    
    return len(fixed_fragrances)

if __name__ == '__main__':
    count = main()