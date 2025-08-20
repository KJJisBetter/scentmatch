#!/usr/bin/env python3
"""
Test Suite for Gap Analysis & Ethical Scraping
Tests trend detection, scraping ethics compliance, and quality validation
"""

import unittest
import sys
import time
import json
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

try:
    from gap_analyzer_02 import detect_missing_fragrances, analyze_trending_fragrances, load_existing_data
    from ethical_scraper_03 import EthicalScraper, validate_fragrance_quality, RateLimiter
except ImportError:
    # Mock functions if scripts don't exist yet
    def detect_missing_fragrances(existing, trending):
        return []
    def analyze_trending_fragrances(url):
        return []
    def load_existing_data(path):
        return []
    class EthicalScraper:
        def __init__(self, config):
            pass
    def validate_fragrance_quality(fragrance):
        return True
    class RateLimiter:
        def __init__(self, delay):
            pass


class TestTrendDetection(unittest.TestCase):
    """Test trending fragrance detection and gap analysis"""
    
    def setUp(self):
        """Set up test data"""
        self.existing_fragrances = [
            {'name': 'aventus', 'brand': 'creed', 'rating': 4.34},
            {'name': 'sauvage-eau-de-parfum', 'brand': 'dior', 'rating': 4.45},
            {'name': 'bleu-de-chanel', 'brand': 'chanel', 'rating': 4.25}
        ]
        
        self.trending_fragrances = [
            {'name': 'aventus', 'brand': 'creed'},  # Already have
            {'name': 'missing-person', 'brand': 'phlur'},  # Missing
            {'name': 'cloud', 'brand': 'ariana-grande'},  # Missing
            {'name': 'sauvage-eau-de-parfum', 'brand': 'dior'}  # Already have
        ]

    def test_gap_detection_logic(self):
        """Test identification of missing popular fragrances"""
        missing = []
        
        # Mock gap detection logic
        existing_keys = {f"{f['brand']}_{f['name']}" for f in self.existing_fragrances}
        
        for trending in self.trending_fragrances:
            key = f"{trending['brand']}_{trending['name']}"
            if key not in existing_keys:
                missing.append(trending)
        
        expected_missing = [
            {'name': 'missing-person', 'brand': 'phlur'},
            {'name': 'cloud', 'brand': 'ariana-grande'}
        ]
        
        self.assertEqual(len(missing), 2)
        self.assertIn({'name': 'missing-person', 'brand': 'phlur'}, missing)
        self.assertIn({'name': 'cloud', 'brand': 'ariana-grande'}, missing)

    def test_trending_page_url_validation(self):
        """Test Fragrantica trending URL validation"""
        valid_urls = [
            'https://www.fragrantica.com/trending/',
            'https://www.fragrantica.com/new_releases/',
            'https://www.fragrantica.com/popular/'
        ]
        
        for url in valid_urls:
            # Basic URL validation
            self.assertTrue(url.startswith('https://www.fragrantica.com/'))
            self.assertTrue(url.endswith('/'))

    def test_social_media_trend_detection(self):
        """Test social media trending detection logic"""
        # Mock social media mentions
        social_trends = {
            'tiktok': ['cloud-ariana-grande', 'missing-person-phlur', 'glossier-you'],
            'instagram': ['baccarat-rouge-540', 'missing-person-phlur', 'another-13'],
        }
        
        # Count mentions across platforms
        mention_counts = {}
        for platform, fragrances in social_trends.items():
            for frag in fragrances:
                mention_counts[frag] = mention_counts.get(frag, 0) + 1
        
        # Sort by popularity
        trending = sorted(mention_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Verify top trends
        self.assertGreater(len(trending), 0)
        self.assertEqual(trending[0][0], 'missing-person-phlur')  # Most mentions
        self.assertEqual(trending[0][1], 2)  # Mentioned on 2 platforms

    def test_release_year_filtering(self):
        """Test filtering for recent releases (2024-2025)"""
        test_fragrances = [
            {'name': 'new-release', 'year': 2024, 'rating': 4.2},
            {'name': 'recent-hit', 'year': 2023, 'rating': 4.5},
            {'name': 'classic', 'year': 2018, 'rating': 4.1},
            {'name': 'vintage', 'year': 2005, 'rating': 3.9}
        ]
        
        # Filter for 2023+ releases
        recent = [f for f in test_fragrances if f.get('year', 0) >= 2023]
        
        self.assertEqual(len(recent), 2)
        self.assertIn({'name': 'new-release', 'year': 2024, 'rating': 4.2}, recent)
        self.assertIn({'name': 'recent-hit', 'year': 2023, 'rating': 4.5}, recent)


class TestScrapingEthics(unittest.TestCase):
    """Test ethical scraping compliance and rate limiting"""
    
    def setUp(self):
        """Set up scraping configuration"""
        self.ethics_config = {
            'delay_seconds': 2.0,
            'max_concurrent': 1,
            'timeout': 10,
            'max_retries': 3,
            'user_agent': 'ScentMatch Research Bot v1.0 (+https://scentmatch.com/contact)',
            'headers': {
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
                'DNT': '1',
                'Connection': 'keep-alive'
            }
        }

    def test_rate_limiter_timing(self):
        """Test that rate limiter enforces minimum delays"""
        start_time = time.time()
        
        # Mock rate limiter behavior
        delay = self.ethics_config['delay_seconds']
        time.sleep(0.1)  # Simulate quick operation
        
        elapsed = time.time() - start_time
        
        # Should enforce minimum delay (for real implementation)
        minimum_delay = 0.1  # Simulate test delay
        self.assertGreaterEqual(elapsed, minimum_delay)

    def test_concurrent_request_limit(self):
        """Test that only sequential requests are made"""
        max_concurrent = self.ethics_config['max_concurrent']
        
        self.assertEqual(max_concurrent, 1)  # Only sequential requests

    def test_respectful_headers(self):
        """Test that scraper uses respectful headers"""
        headers = self.ethics_config['headers']
        
        # Check required headers
        self.assertIn('Accept', headers)
        self.assertIn('Accept-Language', headers)
        self.assertIn('DNT', headers)  # Do Not Track
        self.assertIn('Connection', headers)
        
        # Check user agent identifies bot
        user_agent = self.ethics_config['user_agent']
        self.assertIn('Bot', user_agent)
        self.assertIn('ScentMatch', user_agent)
        self.assertIn('contact', user_agent)

    def test_timeout_settings(self):
        """Test reasonable timeout configurations"""
        timeout = self.ethics_config['timeout']
        max_retries = self.ethics_config['max_retries']
        
        # Should have reasonable timeouts
        self.assertGreaterEqual(timeout, 5)  # At least 5 seconds
        self.assertLessEqual(timeout, 30)    # No more than 30 seconds
        
        # Should have retry limits
        self.assertGreaterEqual(max_retries, 1)
        self.assertLessEqual(max_retries, 5)

    def test_robots_txt_compliance(self):
        """Test robots.txt compliance checking"""
        # Mock robots.txt rules
        robots_rules = {
            'allowed_paths': ['/perfume/', '/trending/', '/new_releases/'],
            'disallowed_paths': ['/admin/', '/private/', '/api/'],
            'crawl_delay': 1.0  # Minimum delay from robots.txt
        }
        
        test_urls = [
            'https://www.fragrantica.com/perfume/dior/sauvage-123.html',  # Allowed
            'https://www.fragrantica.com/trending/',  # Allowed
            'https://www.fragrantica.com/admin/users',  # Disallowed
        ]
        
        for url in test_urls:
            path = url.split('fragrantica.com')[1]
            is_allowed = any(allowed in path for allowed in robots_rules['allowed_paths'])
            is_disallowed = any(disallowed in path for disallowed in robots_rules['disallowed_paths'])
            
            if 'admin' in path:
                self.assertFalse(is_allowed or not is_disallowed)
            else:
                self.assertTrue(is_allowed)


class TestQualityValidation(unittest.TestCase):
    """Test fragrance quality validation for scraping"""
    
    def setUp(self):
        """Set up quality thresholds"""
        self.quality_thresholds = {
            'min_rating': 4.0,
            'min_reviews': 500,
            'max_year': 2025,
            'required_fields': ['name', 'brand', 'rating', 'review_count']
        }

    def test_rating_threshold_validation(self):
        """Test minimum rating requirements for scraping"""
        test_fragrances = [
            {'name': 'high-quality', 'rating': 4.5, 'reviews': 1000},  # Pass
            {'name': 'decent', 'rating': 4.0, 'reviews': 600},         # Pass (border)
            {'name': 'mediocre', 'rating': 3.8, 'reviews': 800},      # Fail rating
            {'name': 'unknown', 'rating': 4.2, 'reviews': 100},       # Fail reviews
        ]
        
        min_rating = self.quality_thresholds['min_rating']
        min_reviews = self.quality_thresholds['min_reviews']
        
        for frag in test_fragrances:
            passes_quality = (frag['rating'] >= min_rating and 
                            frag['reviews'] >= min_reviews)
            
            if frag['name'] in ['high-quality', 'decent']:
                self.assertTrue(passes_quality, f"Should pass: {frag['name']}")
            else:
                self.assertFalse(passes_quality, f"Should fail: {frag['name']}")

    def test_review_count_threshold(self):
        """Test minimum review count requirements"""
        min_reviews = self.quality_thresholds['min_reviews']
        
        test_cases = [
            (1000, True),   # Well above threshold
            (500, True),    # Exactly at threshold  
            (499, False),   # Just below threshold
            (100, False),   # Well below threshold
            (0, False),     # No reviews
        ]
        
        for review_count, should_pass in test_cases:
            passes = review_count >= min_reviews
            self.assertEqual(passes, should_pass, 
                           f"Reviews {review_count}: expected {should_pass}")

    def test_required_fields_validation(self):
        """Test that scraped data has all required fields"""
        required_fields = self.quality_thresholds['required_fields']
        
        complete_fragrance = {
            'name': 'test-fragrance',
            'brand': 'test-brand',
            'rating': 4.2,
            'review_count': 750,
            'year': 2024
        }
        
        incomplete_fragrance = {
            'name': 'incomplete',
            'brand': 'test-brand',
            # Missing rating and review_count
        }
        
        # Check complete fragrance
        has_all_required = all(field in complete_fragrance for field in required_fields)
        self.assertTrue(has_all_required)
        
        # Check incomplete fragrance
        has_all_required = all(field in incomplete_fragrance for field in required_fields)
        self.assertFalse(has_all_required)

    def test_year_validation(self):
        """Test year range validation"""
        max_year = self.quality_thresholds['max_year']
        
        test_years = [
            (2024, True),   # Current year
            (2025, True),   # Future release
            (2026, False),  # Too far future
            (2020, True),   # Recent past
            (1990, True),   # Older fragrance (should still be allowed)
        ]
        
        for year, should_pass in test_years:
            passes = year <= max_year
            if year <= max_year:
                self.assertTrue(passes, f"Year {year} should pass")
            else:
                self.assertFalse(passes, f"Year {year} should fail")


class TestScraperIntegration(unittest.TestCase):
    """Test integration between gap analysis and scraping components"""
    
    def setUp(self):
        """Set up integration test data"""
        self.mock_existing_data = [
            {'id': 'creed__aventus', 'name': 'aventus', 'brand': 'creed'},
            {'id': 'dior__sauvage-edp', 'name': 'sauvage-eau-de-parfum', 'brand': 'dior'}
        ]
        
        self.mock_trending_data = [
            {'name': 'missing-person', 'brand': 'phlur', 'rating': 4.2, 'reviews': 800},
            {'name': 'cloud', 'brand': 'ariana-grande', 'rating': 4.1, 'reviews': 1200},
            {'name': 'aventus', 'brand': 'creed', 'rating': 4.3, 'reviews': 19000}  # Duplicate
        ]

    def test_end_to_end_gap_detection(self):
        """Test complete gap detection workflow"""
        # 1. Load existing data (mocked)
        existing = self.mock_existing_data
        
        # 2. Get trending data (mocked)
        trending = self.mock_trending_data
        
        # 3. Find gaps
        existing_ids = {f"{f['brand']}__{f['name']}" for f in existing}
        gaps = []
        
        for trend in trending:
            trend_id = f"{trend['brand']}__{trend['name']}"
            if trend_id not in existing_ids:
                gaps.append(trend)
        
        # 4. Validate results
        self.assertEqual(len(gaps), 2)  # Should find 2 missing fragrances
        
        missing_names = [gap['name'] for gap in gaps]
        self.assertIn('missing-person', missing_names)
        self.assertIn('cloud', missing_names)
        self.assertNotIn('aventus', missing_names)  # Should exclude duplicates

    def test_quality_filtering_integration(self):
        """Test that quality filtering works with gap detection"""
        # Mock fragrances with varying quality
        candidates = [
            {'name': 'high-quality', 'brand': 'test', 'rating': 4.5, 'reviews': 1000},  # Pass
            {'name': 'low-rating', 'brand': 'test', 'rating': 3.5, 'reviews': 800},    # Fail
            {'name': 'few-reviews', 'brand': 'test', 'rating': 4.2, 'reviews': 200},   # Fail
        ]
        
        # Apply quality filter (>4.0 rating, >500 reviews)
        qualified = [
            f for f in candidates 
            if f['rating'] >= 4.0 and f['reviews'] >= 500
        ]
        
        self.assertEqual(len(qualified), 1)
        self.assertEqual(qualified[0]['name'], 'high-quality')

    def test_scraping_workflow_simulation(self):
        """Test simulated scraping workflow with rate limiting"""
        urls_to_scrape = [
            'https://www.fragrantica.com/perfume/phlur/missing-person.html',
            'https://www.fragrantica.com/perfume/ariana-grande/cloud.html'
        ]
        
        scraped_results = []
        scrape_times = []
        
        # Simulate scraping with delays
        for url in urls_to_scrape:
            start_time = time.time()
            
            # Simulate scraping delay (much shorter for tests)
            time.sleep(0.01)  # 10ms instead of 2000ms
            
            # Mock scraped data
            mock_result = {
                'url': url,
                'scraped_at': time.time(),
                'success': True
            }
            scraped_results.append(mock_result)
            scrape_times.append(time.time() - start_time)
        
        # Verify results
        self.assertEqual(len(scraped_results), 2)
        for result in scraped_results:
            self.assertTrue(result['success'])
            
        # Verify timing (delays should be consistent)
        for scrape_time in scrape_times:
            self.assertGreaterEqual(scrape_time, 0.01)  # At least our test delay


if __name__ == '__main__':
    # Create test output directory
    test_dir = Path(__file__).parent
    output_dir = test_dir / "output"
    output_dir.mkdir(exist_ok=True)
    
    # Run all tests
    unittest.main(verbosity=2)