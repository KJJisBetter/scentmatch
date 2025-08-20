#!/usr/bin/env python3
"""
Fix Empty Names in Database
Update fragrances with empty names to use proper names extracted from IDs
"""

import json
import requests
import os
from dotenv import load_dotenv

def fix_empty_names():
    """Fix fragrances with empty names in the database"""
    load_dotenv()
    
    headers = {
        'apikey': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
        'Authorization': f'Bearer {os.getenv("SUPABASE_SERVICE_ROLE_KEY")}',
        'Content-Type': 'application/json'
    }
    
    base_url = 'https://yekstmwcgyiltxinqamf.supabase.co/rest/v1'
    
    # Get fragrances with empty names
    print("🔍 Finding fragrances with empty names...")
    
    response = requests.get(
        f'{base_url}/fragrances?select=id,name,brand_id&or=(name.is.null,name.eq.)',
        headers=headers
    )
    
    empty_name_fragrances = response.json()
    print(f"📊 Found {len(empty_name_fragrances)} fragrances with empty names")
    
    if len(empty_name_fragrances) == 0:
        print("✅ No empty names found!")
        return 0
    
    # Show examples
    print("🔍 Examples of empty names:")
    for frag in empty_name_fragrances[:5]:
        print(f"  {frag['id']} → name: '{frag.get('name', 'NULL')}'")
    
    # Fix each fragrance
    fixed_count = 0
    
    for fragrance in empty_name_fragrances:
        frag_id = fragrance['id']
        
        # Extract name from ID
        if '__' in frag_id:
            brand_part, name_part = frag_id.split('__', 1)
            
            if name_part:
                # Convert kebab-case to Title Case
                fixed_name = name_part.replace('-', ' ').title()
                
                # Handle special cases
                fixed_name = fixed_name.replace(' De ', ' de ')
                fixed_name = fixed_name.replace(' La ', ' la ')
                fixed_name = fixed_name.replace(' Le ', ' le ')
                fixed_name = fixed_name.replace(' Du ', ' du ')
                fixed_name = fixed_name.replace(' Et ', ' & ')
                fixed_name = fixed_name.replace('Edp', 'EDP')
                fixed_name = fixed_name.replace('Edt', 'EDT')
                
                # Update in database
                update_data = {
                    'name': fixed_name,
                    'slug': name_part  # Use original kebab-case as slug
                }
                
                response = requests.patch(
                    f'{base_url}/fragrances?id=eq.{frag_id}',
                    headers=headers,
                    json=update_data
                )
                
                if response.status_code in [200, 204]:
                    fixed_count += 1
                    if fixed_count % 50 == 0:
                        print(f"✅ Fixed {fixed_count}/{len(empty_name_fragrances)} names")
                else:
                    print(f"❌ Failed to fix {frag_id}: {response.status_code}")
            else:
                print(f"⏭️  Skipping {frag_id}: no name part in ID")
    
    print(f"🎉 Fixed {fixed_count} empty names!")
    
    # Verify fix
    response = requests.get(
        f'{base_url}/fragrances?select=count&or=(name.is.null,name.eq.)',
        headers=headers
    )
    
    remaining_empty = response.json()[0]['count'] if response.json() else 0
    print(f"🔍 Remaining empty names: {remaining_empty}")
    
    return fixed_count

if __name__ == '__main__':
    fixed = fix_empty_names()
    print(f"✅ Name fixing completed: {fixed} fragrances fixed")