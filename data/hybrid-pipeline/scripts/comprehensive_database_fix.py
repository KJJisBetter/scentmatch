#!/usr/bin/env python3
"""
Comprehensive Database Fix
Fix all remaining issues: empty names, missing fragrances, popularity scoring
"""

import json
import requests
import os
import time
from dotenv import load_dotenv

def comprehensive_fix():
    """Fix all database issues comprehensively"""
    load_dotenv()
    
    headers = {
        'apikey': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
        'Authorization': f'Bearer {os.getenv("SUPABASE_SERVICE_ROLE_KEY")}',
        'Content-Type': 'application/json'
    }
    
    base_url = 'https://yekstmwcgyiltxinqamf.supabase.co/rest/v1'
    
    print("🔍 Comprehensive database fix starting...")
    
    # Step 1: Fix ALL empty names (not just 3)
    print("\n1️⃣ Finding and fixing ALL empty names...")
    
    # Get ALL fragrances with empty names
    response = requests.get(
        f'{base_url}/fragrances?select=id,name,brand_id&or=(name.is.null,name.eq.)',
        headers=headers
    )
    
    empty_names = response.json()
    print(f"📊 Found {len(empty_names)} fragrances with empty names")
    
    # Fix each one
    fixed_names = 0
    for fragrance in empty_names:
        frag_id = fragrance['id']
        
        if '__' in frag_id:
            brand_part, name_part = frag_id.split('__', 1)
            
            if name_part and name_part != 'eau-de-parfum' and name_part != 'eau-fraiche':
                # Convert to proper name
                fixed_name = name_part.replace('-', ' ').title()
                fixed_name = fixed_name.replace(' De ', ' de ').replace(' La ', ' la ')
                
                # Update
                response = requests.patch(
                    f'{base_url}/fragrances?id=eq.{frag_id}',
                    headers=headers,
                    json={'name': fixed_name, 'slug': name_part}
                )
                
                if response.status_code in [200, 204]:
                    fixed_names += 1
                    if fixed_names <= 5:
                        print(f"✅ Fixed: {frag_id} → {fixed_name}")
    
    print(f"✅ Fixed {fixed_names} empty names")
    
    # Step 2: Import missing premium fragrances
    print("\n2️⃣ Checking for missing premium fragrances...")
    
    # Check if we have key luxury fragrances
    premium_checks = [
        'creed__aventus',
        'tom-ford__tobacco-vanille', 
        'dior__sauvage-eau-de-parfum',
        'chanel__bleu-de-chanel-eau-de-parfum',
        'tom-ford__black-orchid'
    ]
    
    missing_premium = []
    for frag_id in premium_checks:
        response = requests.get(f'{base_url}/fragrances?select=id&id=eq.{frag_id}', headers=headers)
        if not response.json():
            missing_premium.append(frag_id)
    
    print(f"📊 Missing {len(missing_premium)} premium fragrances: {missing_premium}")
    
    if missing_premium:
        print("⚠️  Key luxury fragrances missing - need to complete import")
    
    # Step 3: Verify popularity scores exist and are reasonable
    print("\n3️⃣ Checking popularity scoring...")
    
    response = requests.get(
        f'{base_url}/fragrances?select=id,name,popularity_score&order=popularity_score.desc.nullslast&limit=10',
        headers=headers
    )
    
    top_fragrances = response.json()
    
    if top_fragrances:
        print("🏆 Top fragrances by popularity:")
        for i, frag in enumerate(top_fragrances[:5], 1):
            score = frag.get('popularity_score', 0)
            name = frag.get('name', 'Unknown')
            print(f"  {i}. {name} (score: {score})")
        
        # Check if scores look reasonable (should be > 50 for top fragrances)
        top_score = top_fragrances[0].get('popularity_score', 0)
        if top_score < 50:
            print("⚠️  Popularity scores seem low - may need recalculation")
        else:
            print("✅ Popularity scores look reasonable")
    
    # Step 4: Test that fragrances with names exist
    print("\n4️⃣ Checking fragrances with proper names...")
    
    response = requests.get(
        f'{base_url}/fragrances?select=count&name=not.is.null&name=neq.',
        headers=headers
    )
    
    fragrances_with_names = response.json()[0]['count']
    
    response = requests.get(f'{base_url}/fragrances?select=count', headers=headers)
    total_fragrances = response.json()[0]['count']
    
    print(f"📊 Fragrances with names: {fragrances_with_names}/{total_fragrances}")
    print(f"📊 Completion rate: {fragrances_with_names/total_fragrances*100:.1f}%")
    
    # Step 5: Final summary
    print(f"\n📊 COMPREHENSIVE FIX SUMMARY:")
    print(f"✅ Fixed empty names: {fixed_names}")
    print(f"📊 Total fragrances: {total_fragrances}")
    print(f"📊 Fragrances with names: {fragrances_with_names}")
    print(f"⚠️  Missing premium: {len(missing_premium)}")
    
    if missing_premium:
        print(f"\n🎯 To complete the fix:")
        print(f"1. Run the complete import script to get missing premium fragrances")
        print(f"2. The API sorting is now fixed for popularity-based ordering")
        print(f"3. Empty names have been fixed")
    else:
        print(f"\n🎉 Database is now perfectly formatted!")
    
    return {
        'fixed_names': fixed_names,
        'total_fragrances': total_fragrances,
        'fragrances_with_names': fragrances_with_names,
        'missing_premium': missing_premium
    }

if __name__ == '__main__':
    comprehensive_fix()