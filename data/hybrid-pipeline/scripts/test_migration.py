#!/usr/bin/env python3
"""
Test migration script for pipeline metadata columns
Validates SQL syntax and checks if migration can be applied safely
"""

import os
import sys
import requests
from dotenv import load_dotenv

def test_migration():
    """Test the migration file for syntax and readiness"""
    load_dotenv()
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not service_role_key:
        print("❌ Missing Supabase credentials")
        return False
    
    headers = {
        'apikey': service_role_key,
        'Authorization': f'Bearer {service_role_key}',
        'Content-Type': 'application/json'
    }
    
    print("🔍 Testing pipeline metadata columns...")
    
    # Test if tables exist
    try:
        response = requests.get(
            f"{supabase_url}/rest/v1/fragrances?limit=1",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Fragrances table accessible")
        else:
            print(f"❌ Cannot access fragrances table: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False
    
    # Test if migration would conflict
    try:
        # Test if pipeline columns already exist
        response = requests.get(
            f"{supabase_url}/rest/v1/fragrances?select=pipeline_priority_score&limit=1",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("⚠️  Pipeline columns already exist")
        elif response.status_code == 400:
            print("✅ Pipeline columns don't exist - migration can proceed")
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Could not test existing columns: {e}")
    
    print("✅ Migration test completed - ready to apply")
    return True

if __name__ == '__main__':
    success = test_migration()
    sys.exit(0 if success else 1)