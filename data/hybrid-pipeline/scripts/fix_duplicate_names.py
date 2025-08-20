#!/usr/bin/env python3
"""
Fix Duplicate Name Issues
Preserve concentration and version differences to ensure unique (brand_id, name) combinations
"""

import json
import re
from collections import defaultdict

def fix_duplicate_names():
    """Fix duplicate (brand_id, name) combinations"""
    
    with open('output/fragrances_compatible.json', 'r') as f:
        fragrances = json.load(f)
    
    print(f"📊 Analyzing {len(fragrances)} fragrances for duplicates...")
    
    # Group fragrances by (brand_id, name) combination
    name_groups = defaultdict(list)
    
    for fragrance in fragrances:
        key = (fragrance.get('brand_id', ''), fragrance.get('name', ''))
        name_groups[key].append(fragrance)
    
    # Find duplicates
    duplicates = {key: group for key, group in name_groups.items() if len(group) > 1}
    
    print(f"🔍 Found {len(duplicates)} duplicate name groups")
    print(f"📊 Total duplicate records: {sum(len(group) for group in duplicates.values())}")
    
    # Fix duplicates by adding distinguishing information
    fixed_fragrances = []
    
    for (brand_id, name), group in name_groups.items():
        if len(group) == 1:
            # No duplicates, keep as-is
            fixed_fragrances.extend(group)
        else:
            # Multiple records with same name - make them unique
            print(f"🔧 Fixing {len(group)} duplicates for {brand_id}|{name}")
            
            for i, fragrance in enumerate(group):
                fixed = fragrance.copy()
                
                # Try to extract distinguishing features from original ID
                original_id = fragrance.get('id', '')
                
                # Extract concentration or version info from ID
                id_parts = original_id.split('__')
                if len(id_parts) == 2:
                    brand_part, name_part = id_parts
                    
                    # Look for concentration indicators in name_part
                    concentrations = {
                        'eau-de-toilette': 'EDT',
                        'eau-de-parfum': 'EDP',
                        'parfum': 'Parfum',
                        'extrait': 'Extrait',
                        'cologne': 'Cologne',
                        'eau-fraiche': 'Eau Fraiche'
                    }
                    
                    distinguisher = None
                    for conc_id, conc_name in concentrations.items():
                        if conc_id in name_part:
                            distinguisher = conc_name
                            break
                    
                    # Look for year indicators
                    if not distinguisher:
                        year_match = re.search(r'(19|20)\d{2}', name_part)
                        if year_match:
                            distinguisher = year_match.group()
                    
                    # Look for version indicators
                    if not distinguisher:
                        version_words = ['intense', 'extreme', 'absolu', 'noir', 'sport', 'aqua', 'fresh', 'cologne', 'elixir']
                        for word in version_words:
                            if word in name_part:
                                distinguisher = word.title()
                                break
                    
                    # If we found a distinguisher, add it to the name
                    if distinguisher:
                        if distinguisher not in fixed['name']:
                            fixed['name'] = f"{fixed['name']} {distinguisher}"
                    else:
                        # Last resort: add a number
                        if i > 0:
                            fixed['name'] = f"{fixed['name']} ({i+1})"
                
                fixed_fragrances.append(fixed)
    
    print(f"✅ Fixed all duplicates")
    print(f"📊 Final record count: {len(fixed_fragrances)}")
    
    # Verify no duplicates remain
    final_keys = set()
    remaining_duplicates = 0
    
    for fragrance in fixed_fragrances:
        key = (fragrance.get('brand_id', ''), fragrance.get('name', ''))
        if key in final_keys:
            remaining_duplicates += 1
        else:
            final_keys.add(key)
    
    print(f"🔍 Remaining duplicates: {remaining_duplicates}")
    
    # Save fixed data
    with open('output/fragrances_fixed_duplicates.json', 'w') as f:
        json.dump(fixed_fragrances, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved: output/fragrances_fixed_duplicates.json")
    
    return len(fixed_fragrances), remaining_duplicates

if __name__ == '__main__':
    count, dupes = fix_duplicate_names()
    print(f"✅ Ready for import: {count} fragrances, {dupes} remaining duplicates")