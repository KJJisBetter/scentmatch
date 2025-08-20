#!/usr/bin/env python3
"""
Clear Stuck AI Processing Queue
Remove all stuck/pending jobs that are clogging the embedding pipeline
"""

import requests
import os
import time
from dotenv import load_dotenv

def clear_stuck_queue():
    """Clear all stuck jobs from AI processing queue"""
    load_dotenv()
    
    headers = {
        'apikey': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
        'Authorization': f'Bearer {os.getenv("SUPABASE_SERVICE_ROLE_KEY")}',
        'Content-Type': 'application/json'
    }
    
    base_url = 'https://yekstmwcgyiltxinqamf.supabase.co/rest/v1'
    
    print("🔍 Analyzing AI processing queue backlog...")
    
    # Get current queue status
    response = requests.get(f'{base_url}/ai_processing_queue?select=count', headers=headers)
    total_jobs = response.json()[0]['count']
    
    # Get breakdown by status
    response = requests.get(f'{base_url}/ai_processing_queue?select=status,task_type&limit=100', headers=headers)
    sample_jobs = response.json()
    
    status_counts = {}
    task_type_counts = {}
    
    for job in sample_jobs:
        status = job.get('status', 'unknown')
        task_type = job.get('task_type', 'unknown')
        
        status_counts[status] = status_counts.get(status, 0) + 1
        task_type_counts[task_type] = task_type_counts.get(task_type, 0) + 1
    
    print(f"📊 Queue analysis:")
    print(f"  Total jobs: {total_jobs}")
    print(f"  Status breakdown: {status_counts}")
    print(f"  Task type breakdown: {task_type_counts}")
    
    # Check for jobs older than 1 hour (likely stuck)
    response = requests.get(
        f'{base_url}/ai_processing_queue?select=count&created_at=lt.{(time.time() - 3600):.0f}',
        headers=headers
    )
    
    if response.status_code == 200:
        old_jobs = response.json()[0]['count']
        print(f"  Jobs older than 1 hour: {old_jobs}")
    
    # Ask for confirmation
    print(f"\\n🚨 QUEUE CLEARING WARNING 🚨")
    print(f"This will DELETE all {total_jobs} stuck jobs from the AI processing queue.")
    print(f"This is safe in development but will clear any pending work.")
    print(f"")
    
    response = input("Type 'CLEAR_QUEUE' to confirm: ")
    if response != 'CLEAR_QUEUE':
        print("❌ Queue clearing cancelled")
        return False
    
    # Clear the queue in phases
    print(f"\\n🧹 Clearing {total_jobs} stuck jobs...")
    
    # Phase 1: Clear old stuck jobs first
    response = requests.delete(
        f'{base_url}/ai_processing_queue?status=eq.pending&created_at=lt.2025-08-19T22:00:00',
        headers=headers
    )
    
    if response.status_code in [200, 204]:
        print("✅ Cleared old pending jobs")
    else:
        print(f"⚠️  Old job clearing: {response.status_code}")
    
    # Phase 2: Clear remaining pending jobs
    response = requests.delete(
        f'{base_url}/ai_processing_queue?status=eq.pending',
        headers=headers
    )
    
    if response.status_code in [200, 204]:
        print("✅ Cleared all pending jobs")
    else:
        print(f"⚠️  Pending job clearing: {response.status_code}")
    
    # Phase 3: Clear any remaining jobs
    response = requests.delete(
        f'{base_url}/ai_processing_queue?id=gt.0',
        headers=headers
    )
    
    if response.status_code in [200, 204]:
        print("✅ Cleared all remaining jobs")
    else:
        print(f"⚠️  Full clearing: {response.status_code}")
    
    # Verify queue is empty
    time.sleep(2)
    response = requests.get(f'{base_url}/ai_processing_queue?select=count', headers=headers)
    remaining_jobs = response.json()[0]['count']
    
    print(f"\\n📊 Queue clearing results:")
    print(f"  Before: {total_jobs} jobs")
    print(f"  After: {remaining_jobs} jobs")
    print(f"  Cleared: {total_jobs - remaining_jobs} jobs")
    
    if remaining_jobs == 0:
        print("🎉 Queue successfully cleared!")
        print("✅ Ready to fix embedding generation system")
    else:
        print(f"⚠️  {remaining_jobs} jobs remain - may need manual intervention")
    
    return remaining_jobs == 0

if __name__ == '__main__':
    success = clear_stuck_queue()
    if success:
        print("\\n🎯 Next steps:")
        print("1. Deploy/fix the embedding generation Edge Function")
        print("2. Test embedding generation with a single fragrance")
        print("3. Generate embeddings for all 1,978 fragrances")
        print("4. Verify AI features work properly")