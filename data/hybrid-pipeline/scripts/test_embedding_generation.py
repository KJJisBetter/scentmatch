#!/usr/bin/env python3
"""
Test Embedding Generation
Diagnose why embedding generation pipeline isn't working
"""

import requests
import json
import os
from dotenv import load_dotenv

def test_embedding_generation():
    """Test embedding generation system"""
    load_dotenv()
    
    headers = {
        'apikey': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
        'Authorization': f'Bearer {os.getenv("SUPABASE_SERVICE_ROLE_KEY")}',
        'Content-Type': 'application/json'
    }
    
    base_url = 'https://yekstmwcgyiltxinqamf.supabase.co/rest/v1'
    functions_url = 'https://yekstmwcgyiltxinqamf.supabase.co/functions/v1'
    
    print("🔍 Testing embedding generation pipeline...")
    
    # Test 1: Check if Edge Function is deployed
    print("\\n1️⃣ Testing Edge Function deployment...")
    
    test_payload = {
        "test_mode": True,
        "fragrance_id": "test__embedding_test"
    }
    
    response = requests.post(
        f'{functions_url}/generate-embedding',
        headers=headers,
        json=test_payload,
        timeout=30
    )
    
    print(f"Edge Function response: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
        print("❌ Edge Function not working properly")
    else:
        print("✅ Edge Function is deployed and responding")
        result = response.json()
        print(f"Response: {result}")
    
    # Test 2: Check if triggers exist
    print("\\n2️⃣ Checking database triggers...")
    
    # Insert a test fragrance to see if trigger fires
    test_fragrance = {
        "id": f"test__trigger_test_{int(time.time())}",
        "brand_id": "paco-rabanne",
        "name": "Trigger Test",
        "slug": "trigger-test",
        "gender": "unisex",
        "main_accords": ["test"],
        "data_source": "test",
        "sample_available": True,
        "is_verified": True
    }
    
    print("Inserting test fragrance to check trigger...")
    response = requests.post(
        f'{base_url}/fragrances',
        headers=headers,
        json=[test_fragrance]
    )
    
    if response.status_code in [200, 201]:
        print("✅ Test fragrance inserted")
        
        # Check if queue entry was created
        time.sleep(2)
        response = requests.get(
            f'{base_url}/ai_processing_queue?select=id,task_type,status&task_data=cs.{test_fragrance["id"]}',
            headers=headers
        )
        
        if response.status_code == 200:
            queue_entries = response.json()
            if queue_entries:
                print(f"✅ Trigger fired - created {len(queue_entries)} queue entries")
                print(f"Queue entry: {queue_entries[0]}")
            else:
                print("❌ No queue entries created - trigger not working")
        
        # Clean up test fragrance
        requests.delete(f'{base_url}/fragrances?id=eq.{test_fragrance["id"]}', headers=headers)
        
    else:
        print(f"❌ Failed to insert test fragrance: {response.status_code}")
    
    # Test 3: Check API keys
    print("\\n3️⃣ Checking API key configuration...")
    
    voyage_key = os.getenv('VOYAGE_AI_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')
    
    print(f"Voyage AI API Key: {'✅ Present' if voyage_key else '❌ Missing'}")
    print(f"OpenAI API Key: {'✅ Present' if openai_key else '❌ Missing'}")
    
    if not voyage_key and not openai_key:
        print("❌ CRITICAL: No embedding API keys configured!")
        print("   Embedding generation cannot work without API keys")
    
    # Test 4: Check existing fragrance embeddings
    print("\\n4️⃣ Checking current embedding status...")
    
    response = requests.get(
        f'{base_url}/fragrances?select=id,embedding,embedding_generated_at&embedding=not.is.null&limit=5',
        headers=headers
    )
    
    if response.status_code == 200:
        embedded_fragrances = response.json()
        print(f"Fragrances with embeddings: {len(embedded_fragrances)}")
        
        if embedded_fragrances:
            for frag in embedded_fragrances:
                print(f"  {frag['id']}: generated at {frag.get('embedding_generated_at', 'unknown')}")
        else:
            print("❌ NO fragrances have embeddings generated")
    
    print("\\n📊 DIAGNOSIS SUMMARY:")
    print("=" * 50)

if __name__ == '__main__':
    import time
    test_embedding_generation()