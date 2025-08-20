#!/usr/bin/env python3
"""
Complete Import Final - Import ALL Remaining Fragrances
Systematic approach to import every single remaining fragrance
"""

import json
import requests
import os
import time
from dotenv import load_dotenv

def complete_import():
    """Import all remaining fragrances with detailed error tracking"""
    load_dotenv()
    
    headers = {
        'apikey': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
        'Authorization': f'Bearer {os.getenv("SUPABASE_SERVICE_ROLE_KEY")}',
        'Content-Type': 'application/json'
    }
    
    base_url = 'https://yekstmwcgyiltxinqamf.supabase.co/rest/v1'
    
    # Get current database state
    print("🔍 Checking current database state...")
    resp = requests.get(f'{base_url}/fragrances?select=id', headers=headers)
    db_fragrance_ids = {f['id'] for f in resp.json()}
    current_count = len(db_fragrance_ids)
    
    print(f"📊 Current database: {current_count} fragrances")
    
    # Load source data
    with open('output/fragrances_fixed_duplicates.json', 'r') as f:
        source_fragrances = json.load(f)
    
    # Find missing fragrances
    source_ids = {f['id'] for f in source_fragrances}
    missing_ids = source_ids - db_fragrance_ids
    missing_fragrances = [f for f in source_fragrances if f['id'] in missing_ids]
    
    print(f"📊 Missing fragrances: {len(missing_fragrances)}")
    
    if len(missing_fragrances) == 0:
        print("🎉 All fragrances already imported!")
        return current_count
    
    # Get database brands for validation
    resp = requests.get(f'{base_url}/fragrance_brands?select=id', headers=headers)
    db_brands = {b['id'] for b in resp.json()}
    
    # Import missing fragrances one by one with detailed error tracking
    imported = 0
    failed = 0
    error_details = []
    
    print(f"🚀 Starting import of {len(missing_fragrances)} missing fragrances...")
    
    for i, fragrance in enumerate(missing_fragrances):
        # Validate before attempting import
        brand_id = fragrance.get('brand_id', '')
        name = fragrance.get('name', '')
        frag_id = fragrance.get('id', '')
        
        # Skip if missing required data
        if not brand_id or not name or not frag_id:
            print(f"⏭️  Skipping {frag_id}: missing required fields")
            failed += 1
            continue
        
        # Skip if brand doesn't exist
        if brand_id not in db_brands:
            print(f"⏭️  Skipping {frag_id}: brand '{brand_id}' not found")
            error_details.append(f"Missing brand: {brand_id}")
            failed += 1
            continue
        
        # Prepare minimal record for import
        import_record = {
            'id': frag_id,
            'brand_id': brand_id,
            'name': name,
            'slug': fragrance.get('slug', name.lower().replace(' ', '-')),
            'gender': fragrance.get('gender', 'unisex'),
            'main_accords': fragrance.get('main_accords', []),
            'rating_value': fragrance.get('rating_value'),
            'rating_count': fragrance.get('rating_count'),
            'popularity_score': fragrance.get('popularity_score'),
            'sample_available': fragrance.get('sample_available', True),
            'sample_price_usd': fragrance.get('sample_price_usd', 15),
            'data_source': 'hybrid_pipeline_perfected',
            'is_verified': True,
            'full_description': fragrance.get('full_description', ''),
            'fragrantica_url': fragrance.get('fragrantica_url', '')
        }
        
        # Remove None values
        import_record = {k: v for k, v in import_record.items() if v is not None}
        
        # Try to import this single fragrance
        resp = requests.post(f'{base_url}/fragrances', headers=headers, json=[import_record])
        
        if resp.status_code in [200, 201]:
            imported += 1
            if imported % 100 == 0:
                print(f'✅ Progress: {imported}/{len(missing_fragrances)} imported')
        else:
            failed += 1
            error_msg = resp.text[:200] if resp.text else 'Unknown error'
            
            if failed <= 10:  # Show first 10 detailed errors
                print(f'❌ {frag_id}: {resp.status_code} - {error_msg}')
            
            error_details.append(f"{frag_id}: {resp.status_code} - {error_msg}")
        
        # Small delay to avoid overwhelming the API
        if i % 10 == 0:
            time.sleep(0.1)
    
    print(f'\\n🎉 Import completed!')
    print(f'✅ Successfully imported: {imported}')
    print(f'❌ Failed: {failed}')
    print(f'📈 Success rate: {imported/(imported+failed)*100:.1f}%')
    
    # Get final count
    resp = requests.get(f'{base_url}/fragrances?select=count', headers=headers)
    final_count = resp.json()[0]['count']
    total_target = len(source_fragrances)
    
    print(f'\\n📊 FINAL RESULTS:')
    print(f'Target: {total_target} fragrances')
    print(f'Imported: {final_count} fragrances')
    print(f'Overall success: {final_count/total_target*100:.1f}%')
    
    # Save error details for analysis
    if error_details:
        with open('output/import_errors_detailed.json', 'w') as f:
            json.dump(error_details, f, indent=2)
        print(f'💾 Error details saved: output/import_errors_detailed.json')
    
    return final_count, total_target

if __name__ == '__main__':
    complete_import()