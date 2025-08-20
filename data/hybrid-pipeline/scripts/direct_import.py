#!/usr/bin/env python3
"""
Direct Import Script - Works with Current Schema
Fast bulk import using direct REST API calls
"""

import json
import os
import requests
import time
from dotenv import load_dotenv

def bulk_import():
    """Import all data using direct API calls"""
    load_dotenv()
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json'
    }
    
    base_url = f"{supabase_url}/rest/v1"
    
    # Clear existing data first
    print("🧹 Clearing existing data...")
    requests.delete(f"{base_url}/fragrances?id=neq.never_matches", headers=headers)
    requests.delete(f"{base_url}/fragrance_brands?id=neq.never_matches", headers=headers)
    
    # Import brands in batches of 50
    print("📦 Importing brands...")
    with open('output/brands_minimal.json', 'r') as f:
        brands = json.load(f)
    
    batch_size = 50
    imported_brands = 0
    
    for i in range(0, len(brands), batch_size):
        batch = brands[i:i + batch_size]
        
        response = requests.post(f"{base_url}/fragrance_brands", headers=headers, json=batch)
        
        if response.status_code in [200, 201]:
            imported_brands += len(batch)
            print(f"✅ Imported brands batch: {imported_brands}/{len(brands)}")
        else:
            print(f"❌ Brands batch failed: {response.status_code} - {response.text}")
        
        time.sleep(0.5)  # Small delay between batches
    
    # Import fragrances with only compatible fields
    print("📦 Importing fragrances...")
    with open('output/fragrances_compatible.json', 'r') as f:
        fragrances = json.load(f)
    
    # Strip any remaining incompatible fields from fragrances
    compatible_fields = {
        'id', 'brand_id', 'name', 'slug', 'gender', 'launch_year', 'perfumers',
        'main_accords', 'top_notes', 'middle_notes', 'base_notes',
        'full_description', 'short_description', 'rating_value', 'rating_count', 
        'popularity_score', 'sample_available', 'sample_price_usd', 'trending_score',
        'data_source', 'is_verified', 'fragrantica_url'
    }
    
    cleaned_fragrances = []
    for frag in fragrances:
        cleaned = {k: v for k, v in frag.items() if k in compatible_fields}
        
        # Ensure required fields exist
        if cleaned.get('id') and cleaned.get('name') and cleaned.get('brand_id'):
            cleaned_fragrances.append(cleaned)
    
    print(f"📊 Cleaned fragrances: {len(cleaned_fragrances)} valid records")
    
    imported_fragrances = 0
    batch_size = 25  # Smaller batches for fragrances
    
    for i in range(0, len(cleaned_fragrances), batch_size):
        batch = cleaned_fragrances[i:i + batch_size]
        
        response = requests.post(f"{base_url}/fragrances", headers=headers, json=batch)
        
        if response.status_code in [200, 201]:
            imported_fragrances += len(batch)
            print(f"✅ Imported fragrances batch: {imported_fragrances}/{len(cleaned_fragrances)}")
        else:
            print(f"❌ Fragrances batch {i//batch_size + 1} failed: {response.status_code}")
            if response.status_code != 409:  # Don't show duplicates errors
                print(f"   Error: {response.text[:200]}")
        
        time.sleep(0.3)  # Small delay
    
    # Final verification
    print("🔍 Final verification...")
    
    brand_count = requests.get(f"{base_url}/fragrance_brands?select=count", headers=headers).json()[0]['count']
    frag_count = requests.get(f"{base_url}/fragrances?select=count", headers=headers).json()[0]['count']
    
    print(f"✅ Import completed:")
    print(f"  Brands: {brand_count}")
    print(f"  Fragrances: {frag_count}")
    print(f"  Total: {brand_count + frag_count}")
    
    return brand_count, frag_count

if __name__ == '__main__':
    bulk_import()