#!/usr/bin/env python3
"""
Force Clear AI Processing Queue (Development Only)
Automatically clear all stuck jobs without confirmation
"""

import requests
import os
import time
from dotenv import load_dotenv

def force_clear_queue():
    """Force clear all jobs from AI processing queue"""
    load_dotenv()
    
    headers = {
        'apikey': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
        'Authorization': f'Bearer {os.getenv("SUPABASE_SERVICE_ROLE_KEY")}',
        'Content-Type': 'application/json'
    }
    
    base_url = 'https://yekstmwcgyiltxinqamf.supabase.co/rest/v1'
    
    print("🔍 Getting current queue status...")
    
    # Get current count
    response = requests.get(f'{base_url}/ai_processing_queue?select=count', headers=headers)
    total_jobs = response.json()[0]['count']
    
    print(f"📊 Current queue: {total_jobs} stuck jobs")
    
    if total_jobs == 0:
        print("✅ Queue already empty!")
        return True
    
    print(f"🧹 Force clearing {total_jobs} stuck jobs...")
    
    # Method 1: Clear by status
    print("  Step 1: Clearing pending jobs...")
    response = requests.delete(
        f'{base_url}/ai_processing_queue?status=eq.pending',
        headers=headers
    )
    print(f"    Status: {response.status_code}")
    
    # Method 2: Clear failed jobs
    print("  Step 2: Clearing failed jobs...")
    response = requests.delete(
        f'{base_url}/ai_processing_queue?status=eq.failed',
        headers=headers
    )
    print(f"    Status: {response.status_code}")
    
    # Method 3: Clear all remaining (nuclear option)
    print("  Step 3: Nuclear clear - all remaining jobs...")
    response = requests.delete(
        f'{base_url}/ai_processing_queue?id=gt.0',
        headers=headers
    )
    print(f"    Status: {response.status_code}")
    
    # Verify clearing
    time.sleep(3)
    response = requests.get(f'{base_url}/ai_processing_queue?select=count', headers=headers)
    remaining_jobs = response.json()[0]['count']
    
    print(f"\\n📊 QUEUE CLEARING RESULTS:")
    print(f"  Before: {total_jobs} jobs")
    print(f"  After: {remaining_jobs} jobs")
    print(f"  Cleared: {total_jobs - remaining_jobs} jobs")
    
    if remaining_jobs == 0:
        print("🎉 AI processing queue completely cleared!")
        print("✅ Ready to fix embedding generation system")
        return True
    else:
        print(f"⚠️  {remaining_jobs} jobs still remain")
        return False

if __name__ == '__main__':
    success = force_clear_queue()
    exit_code = 0 if success else 1
    print(f"\\nExit code: {exit_code}")