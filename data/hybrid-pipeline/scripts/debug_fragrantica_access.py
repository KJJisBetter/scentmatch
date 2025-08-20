#!/usr/bin/env python3
"""
Debug script to test Fragrantica access and understand response format
"""

import requests
import time
from pathlib import Path

def test_fragrantica_access():
    """Test different approaches to access Fragrantica"""
    
    # Set up session with realistic headers
    session = requests.Session()
    
    # Headers that match our Scrapy configuration
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
    }
    
    session.headers.update(headers)
    
    test_urls = [
        "https://www.fragrantica.com/",
        "https://www.fragrantica.com/trending/",
        "https://www.fragrantica.com/perfume/Dior/Sauvage-31861.html",
        "https://www.fragrantica.com/perfume/phlur/missing-person.html"
    ]
    
    results = []
    
    for url in test_urls:
        print(f"\n🔄 Testing: {url}")
        
        try:
            response = session.get(url, timeout=30)
            
            result = {
                'url': url,
                'status_code': response.status_code,
                'content_length': len(response.content),
                'content_type': response.headers.get('content-type', 'unknown'),
                'encoding': response.encoding,
                'success': response.status_code == 200
            }
            
            print(f"   Status: {result['status_code']}")
            print(f"   Size: {result['content_length']} bytes")
            print(f"   Content-Type: {result['content_type']}")
            print(f"   Encoding: {result['encoding']}")
            
            if response.status_code == 200:
                try:
                    text_content = response.text
                    
                    # Check for key indicators
                    if 'fragrantica' in text_content.lower():
                        print(f"   ✅ Contains 'fragrantica' text")
                        result['has_fragrantica_content'] = True
                    else:
                        print(f"   ❌ No 'fragrantica' text found")
                        result['has_fragrantica_content'] = False
                    
                    # Check for anti-bot indicators
                    anti_bot_terms = ['cloudflare', 'ray id', 'checking your browser', 'access denied']
                    detected = [term for term in anti_bot_terms if term in text_content.lower()]
                    if detected:
                        print(f"   🤖 Anti-bot detected: {detected}")
                        result['anti_bot_detected'] = detected
                    else:
                        print(f"   ✅ No anti-bot indicators")
                        result['anti_bot_detected'] = []
                    
                    # Try to find title
                    import re
                    title_match = re.search(r'<title[^>]*>([^<]+)</title>', text_content, re.IGNORECASE)
                    if title_match:
                        title = title_match.group(1).strip()
                        print(f"   📄 Title: {title}")
                        result['title'] = title
                    
                    # Sample first 200 chars
                    sample = text_content[:200].replace('\n', ' ').replace('\r', ' ')
                    print(f"   📝 Sample: {sample}...")
                    result['content_sample'] = sample
                    
                except Exception as e:
                    print(f"   ❌ Text parsing error: {e}")
                    result['text_error'] = str(e)
            
            results.append(result)
            
        except Exception as e:
            print(f"   ❌ Request error: {e}")
            results.append({
                'url': url,
                'error': str(e),
                'success': False
            })
        
        # Wait between requests (be respectful)
        if url != test_urls[-1]:  # Don't wait after last URL
            print(f"   ⏳ Waiting 10 seconds...")
            time.sleep(10)
    
    # Save results
    output_dir = Path(__file__).parent.parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    import json
    from datetime import datetime
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_path = output_dir / f"fragrantica_access_test_{timestamp}.json"
    
    with open(results_path, 'w') as f:
        json.dump({
            'test_timestamp': datetime.now().isoformat(),
            'total_urls_tested': len(test_urls),
            'successful_responses': len([r for r in results if r.get('success')]),
            'results': results
        }, f, indent=2)
    
    print(f"\n📄 Results saved to: {results_path}")
    
    # Summary
    successful = [r for r in results if r.get('success')]
    print(f"\n📊 Summary:")
    print(f"   Total URLs tested: {len(test_urls)}")
    print(f"   Successful (200): {len(successful)}")
    print(f"   Failed: {len(results) - len(successful)}")
    
    if successful:
        print(f"\n✅ Accessible URLs:")
        for result in successful:
            print(f"   {result['url']} ({result['content_length']} bytes)")

if __name__ == "__main__":
    test_fragrantica_access()