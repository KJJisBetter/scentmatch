#!/usr/bin/env python3
"""
Analyze Missing Fragrances
Identify exactly which fragrances failed to import and why
"""

import json
import os
import requests
from dotenv import load_dotenv
from collections import defaultdict

def analyze_missing_fragrances():
    """Identify and analyze missing fragrances"""
    load_dotenv()
    
    # Get database connection
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json'
    }
    
    base_url = f"{supabase_url}/rest/v1"
    
    # Load source data
    print("📁 Loading source data...")
    with open('output/fragrances_fixed_duplicates.json', 'r') as f:
        source_fragrances = json.load(f)
    
    # Get currently imported fragrances
    print("🔍 Checking database state...")
    
    # Get all fragrance IDs from database
    response = requests.get(f"{base_url}/fragrances?select=id,brand_id,name", headers=headers)
    db_fragrances = response.json()
    
    # Get all brand IDs from database
    response = requests.get(f"{base_url}/fragrance_brands?select=id", headers=headers)
    db_brands = {b['id'] for b in response.json()}
    
    print(f"📊 Source data: {len(source_fragrances)} fragrances")
    print(f"📊 Database: {len(db_fragrances)} fragrances")
    print(f"📊 Missing: {len(source_fragrances) - len(db_fragrances)} fragrances")
    print(f"📊 Database brands: {len(db_brands)} brands")
    
    # Create sets for comparison
    db_fragrance_ids = {f['id'] for f in db_fragrances}
    source_fragrance_ids = {f['id'] for f in source_fragrances}
    
    # Find missing fragrances
    missing_fragrance_ids = source_fragrance_ids - db_fragrance_ids
    missing_fragrances = [f for f in source_fragrances if f['id'] in missing_fragrance_ids]
    
    print(f"🔍 Analyzing {len(missing_fragrances)} missing fragrances...")
    
    # Analyze failure reasons
    failure_analysis = {
        'missing_brand_id': [],
        'duplicate_names': [],
        'missing_required_fields': [],
        'other_issues': []
    }
    
    # Check each missing fragrance
    for fragrance in missing_fragrances:
        fragrance_id = fragrance.get('id', '')
        brand_id = fragrance.get('brand_id', '')
        name = fragrance.get('name', '')
        
        # Check for missing brand
        if brand_id not in db_brands:
            failure_analysis['missing_brand_id'].append({
                'id': fragrance_id,
                'missing_brand': brand_id,
                'name': name
            })
            continue
        
        # Check for missing required fields
        if not name or not brand_id or not fragrance.get('id'):
            failure_analysis['missing_required_fields'].append({
                'id': fragrance_id,
                'missing_name': not name,
                'missing_brand_id': not brand_id,
                'missing_id': not fragrance.get('id')
            })
            continue
        
        # Check for potential duplicates
        existing_with_same_name = [f for f in db_fragrances 
                                  if f.get('brand_id') == brand_id and f.get('name') == name]
        
        if existing_with_same_name:
            failure_analysis['duplicate_names'].append({
                'id': fragrance_id,
                'brand_id': brand_id,
                'name': name,
                'existing_id': existing_with_same_name[0]['id']
            })
            continue
        
        # Other issues
        failure_analysis['other_issues'].append({
            'id': fragrance_id,
            'brand_id': brand_id,
            'name': name
        })
    
    # Print analysis results
    print(f"\\n📊 FAILURE ANALYSIS:")
    print(f"  Missing brand_id: {len(failure_analysis['missing_brand_id'])}")
    print(f"  Duplicate names: {len(failure_analysis['duplicate_names'])}")
    print(f"  Missing required fields: {len(failure_analysis['missing_required_fields'])}")
    print(f"  Other issues: {len(failure_analysis['other_issues'])}")
    
    # Show examples of each failure type
    if failure_analysis['missing_brand_id']:
        print(f"\\n❌ Missing brand examples:")
        for item in failure_analysis['missing_brand_id'][:5]:
            print(f"  {item['id']} → missing brand '{item['missing_brand']}'")
    
    if failure_analysis['duplicate_names']:
        print(f"\\n❌ Duplicate name examples:")
        for item in failure_analysis['duplicate_names'][:5]:
            print(f"  {item['id']} → duplicate of {item['existing_id']}")
    
    if failure_analysis['missing_required_fields']:
        print(f"\\n❌ Missing field examples:")
        for item in failure_analysis['missing_required_fields'][:3]:
            print(f"  {item['id']} → missing fields")
    
    # Save detailed analysis
    with open('output/missing_fragrances_analysis.json', 'w') as f:
        json.dump({
            'summary': {
                'total_missing': len(missing_fragrances),
                'missing_brand_id': len(failure_analysis['missing_brand_id']),
                'duplicate_names': len(failure_analysis['duplicate_names']),
                'missing_required_fields': len(failure_analysis['missing_required_fields']),
                'other_issues': len(failure_analysis['other_issues'])
            },
            'detailed_analysis': failure_analysis,
            'missing_fragrance_ids': list(missing_fragrance_ids)
        }, f, indent=2)
    
    print(f"\\n💾 Saved detailed analysis: output/missing_fragrances_analysis.json")
    
    return failure_analysis

if __name__ == '__main__':
    analyze_missing_fragrances()