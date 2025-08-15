#!/usr/bin/env python3

import json
import os
import subprocess
import sys
from pathlib import Path

def create_fragrance_import_sql(fragrances_data, batch_size=100):
    """Create SQL statements to import fragrances in batches"""
    
    batches = []
    for i in range(0, len(fragrances_data), batch_size):
        batch = fragrances_data[i:i + batch_size]
        
        # Create JSON string for this batch
        json_str = json.dumps(batch).replace("'", "''")  # Escape single quotes
        
        sql = f"SELECT import_fragrances('{json_str}'::jsonb) as batch_{i//batch_size + 1}_imported;"
        batches.append(sql)
    
    return batches

def main():
    # Load fragrance data
    data_dir = Path(__file__).parent.parent.parent / "data"
    fragrances_file = data_dir / "fragrances.json"
    
    if not fragrances_file.exists():
        print(f"❌ Fragrances file not found: {fragrances_file}")
        sys.exit(1)
    
    print("📖 Loading fragrance data...")
    with open(fragrances_file, 'r') as f:
        fragrances_data = json.load(f)
    
    print(f"📊 Loaded {len(fragrances_data)} fragrances")
    
    # Create SQL batches
    print("🔨 Creating SQL import batches...")
    sql_batches = create_fragrance_import_sql(fragrances_data, batch_size=50)
    
    # Write SQL file
    sql_file = Path(__file__).parent / "import-fragrances-batch.sql"
    with open(sql_file, 'w') as f:
        f.write("-- Import all fragrances in batches\n\n")
        for i, batch_sql in enumerate(sql_batches):
            f.write(f"-- Batch {i+1}/{len(sql_batches)}\n")
            f.write(batch_sql + "\n\n")
        
        f.write("-- Final statistics\n")
        f.write("SELECT get_import_stats();\n")
    
    print(f"✅ Created SQL import file: {sql_file}")
    print(f"📝 Generated {len(sql_batches)} batches of ~50 fragrances each")
    print(f"🚀 Run this file with Supabase to import all fragrance data")

if __name__ == "__main__":
    main()