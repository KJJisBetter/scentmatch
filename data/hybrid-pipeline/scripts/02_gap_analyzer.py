#!/usr/bin/env python3
"""
Gap Analyzer - Phase 2 of Hybrid Pipeline
Identifies missing popular fragrances through trend analysis and social media monitoring
"""

import json
import time
import requests
import re
from pathlib import Path
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Set, Optional

def load_config():
    """Load gap analysis and scraping configuration"""
    config_dir = Path(__file__).parent.parent / "config"
    
    with open(config_dir / "scraping_ethics.json") as f:
        ethics_config = json.load(f)
    
    with open(config_dir / "brand_priorities.json") as f:
        brand_config = json.load(f)
    
    return {
        'ethics': ethics_config,
        'brands': brand_config,
        'quality_thresholds': {
            'min_rating': 4.0,
            'min_reviews': 500,
            'max_year': 2025,
            'trend_lookback_days': 90
        }
    }

def load_existing_data(production_path: Path) -> List[Dict]:
    """Load existing fragrance data from processed Kaggle output"""
    fragrances_path = production_path / "fragrances_kaggle_processed.json"
    
    if not fragrances_path.exists():
        print(f"❌ Existing data not found at {fragrances_path}")
        return []
    
    with open(fragrances_path) as f:
        data = json.load(f)
    
    print(f"✅ Loaded {len(data)} existing fragrances from processed data")
    return data

def analyze_trending_fragrances(base_url: str = "https://www.fragrantica.com") -> List[Dict]:
    """
    Analyze trending fragrances from multiple sources
    Note: This is a mock implementation for now - real implementation would require web scraping
    """
    
    # Mock trending data based on research findings
    # In real implementation, this would scrape Fragrantica trending pages
    trending_sources = {
        'fragrantica_trending': [
            {'name': 'missing-person', 'brand': 'phlur', 'rating': 4.2, 'reviews': 850, 'year': 2024},
            {'name': 'cloud', 'brand': 'ariana-grande', 'rating': 4.1, 'reviews': 1200, 'year': 2018},
            {'name': 'glossier-you', 'brand': 'glossier', 'rating': 4.0, 'reviews': 650, 'year': 2017},
            {'name': 'another-13', 'brand': 'le-labo', 'rating': 4.3, 'reviews': 580, 'year': 2010},
            {'name': 'baccarat-rouge-540', 'brand': 'maison-francis-kurkdjian', 'rating': 4.4, 'reviews': 2100, 'year': 2015}
        ],
        'fragrantica_new_releases': [
            {'name': 'phantom-intense', 'brand': 'paco-rabanne', 'rating': 4.1, 'reviews': 520, 'year': 2024},
            {'name': 'libre-intense', 'brand': 'yves-saint-laurent', 'rating': 4.2, 'reviews': 680, 'year': 2023},
            {'name': 'my-way-intense', 'brand': 'giorgio-armani', 'rating': 4.0, 'reviews': 540, 'year': 2023}
        ],
        'social_media_viral': [
            {'name': 'sol-de-janeiro-cheirosa-71', 'brand': 'sol-de-janeiro', 'rating': 4.3, 'reviews': 950, 'year': 2023},
            {'name': 'dedcool-fragrance-01', 'brand': 'dedcool', 'rating': 4.1, 'reviews': 420, 'year': 2022},
            {'name': 'kayali-vanilla-28', 'brand': 'kayali', 'rating': 4.2, 'reviews': 780, 'year': 2021}
        ]
    }
    
    # Combine all trending sources
    all_trending = []
    for source, fragrances in trending_sources.items():
        for frag in fragrances:
            frag['trend_source'] = source
            frag['detected_at'] = datetime.now().isoformat()
            all_trending.append(frag)
    
    print(f"✅ Detected {len(all_trending)} trending fragrances from {len(trending_sources)} sources")
    return all_trending

def detect_missing_fragrances(existing_data: List[Dict], trending_data: List[Dict]) -> List[Dict]:
    """Identify trending fragrances that are missing from our database"""
    
    # Create set of existing fragrance identifiers
    existing_ids = set()
    for frag in existing_data:
        # Create multiple possible identifiers to catch variations
        brand = frag.get('brand_id', '').lower()
        name = frag.get('slug', '').lower()
        existing_ids.add(f"{brand}__{name}")
        
        # Also check against original name
        orig_name = frag.get('name', '').lower().replace(' ', '-')
        existing_ids.add(f"{brand}__{orig_name}")
    
    print(f"📊 Checking against {len(existing_ids)} existing fragrance identifiers")
    
    # Find missing fragrances
    missing_fragrances = []
    for trend in trending_data:
        brand = trend['brand'].lower().replace(' ', '-')
        name = trend['name'].lower().replace(' ', '-')
        trend_id = f"{brand}__{name}"
        
        if trend_id not in existing_ids:
            # Add normalized identifiers for later processing
            trend['normalized_brand'] = brand
            trend['normalized_name'] = name
            trend['priority_id'] = trend_id
            missing_fragrances.append(trend)
    
    print(f"🔍 Found {len(missing_fragrances)} missing fragrances from trending analysis")
    return missing_fragrances

def filter_by_quality_thresholds(candidates: List[Dict], config: Dict) -> List[Dict]:
    """Filter candidates by quality thresholds for scraping"""
    
    thresholds = config['quality_thresholds']
    qualified = []
    
    for candidate in candidates:
        rating = candidate.get('rating', 0)
        reviews = candidate.get('reviews', 0)
        year = candidate.get('year', 2000)
        
        # Apply quality filters
        if (rating >= thresholds['min_rating'] and 
            reviews >= thresholds['min_reviews'] and 
            year <= thresholds['max_year']):
            
            qualified.append(candidate)
        else:
            print(f"⚠️  Filtered out: {candidate['name']} (Rating: {rating}, Reviews: {reviews})")
    
    print(f"✅ {len(qualified)} fragrances passed quality thresholds")
    return qualified

def prioritize_by_brand_tier(candidates: List[Dict], config: Dict) -> List[Dict]:
    """Prioritize candidates based on brand tier configuration"""
    
    brand_tiers = {}
    for tier_name, tier_data in config['brands'].items():
        if isinstance(tier_data, dict) and 'brands' in tier_data:
            for brand in tier_data['brands']:
                brand_tiers[brand] = {
                    'tier': tier_name,
                    'priority': tier_data.get('boost_multiplier', 1.0)
                }
    
    # Add priority scores
    for candidate in candidates:
        brand = candidate['normalized_brand']
        if brand in brand_tiers:
            candidate['brand_tier'] = brand_tiers[brand]['tier']
            candidate['priority_score'] = brand_tiers[brand]['priority']
        else:
            candidate['brand_tier'] = 'unknown'
            candidate['priority_score'] = 1.0
    
    # Sort by priority (higher is better)
    candidates.sort(key=lambda x: x['priority_score'], reverse=True)
    
    print(f"📈 Prioritized candidates by brand tier")
    return candidates

def generate_scraping_targets(qualified_candidates: List[Dict]) -> List[Dict]:
    """Generate specific scraping targets with estimated URLs"""
    
    scraping_targets = []
    
    for candidate in qualified_candidates:
        # Generate likely Fragrantica URL
        brand_slug = candidate['normalized_brand'].replace(' ', '-')
        name_slug = candidate['normalized_name'].replace(' ', '-')
        
        # Construct probable URL
        estimated_url = f"https://www.fragrantica.com/perfume/{brand_slug}/{name_slug}.html"
        
        target = {
            'fragrance_id': candidate['priority_id'],
            'name': candidate['name'],
            'brand': candidate['brand'],
            'estimated_url': estimated_url,
            'priority_score': candidate['priority_score'],
            'brand_tier': candidate['brand_tier'],
            'trend_source': candidate['trend_source'],
            'expected_rating': candidate['rating'],
            'expected_reviews': candidate['reviews'],
            'scraping_priority': 'high' if candidate['priority_score'] > 1.5 else 'medium'
        }
        
        scraping_targets.append(target)
    
    return scraping_targets

def save_gap_analysis_report(missing_fragrances: List[Dict], scraping_targets: List[Dict], output_dir: Path):
    """Save comprehensive gap analysis report"""
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Summary report
    report = {
        'analysis_timestamp': datetime.now().isoformat(),
        'summary': {
            'total_missing_identified': len(missing_fragrances),
            'qualified_for_scraping': len(scraping_targets),
            'high_priority_targets': len([t for t in scraping_targets if t['scraping_priority'] == 'high']),
        },
        'missing_fragrances': missing_fragrances,
        'scraping_targets': scraping_targets,
        'brand_tier_breakdown': {}
    }
    
    # Brand tier breakdown
    for target in scraping_targets:
        tier = target['brand_tier']
        if tier not in report['brand_tier_breakdown']:
            report['brand_tier_breakdown'][tier] = 0
        report['brand_tier_breakdown'][tier] += 1
    
    # Save detailed report
    report_path = output_dir / f"gap_analysis_report_{timestamp}.json"
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    # Save scraping targets for next phase
    targets_path = output_dir / "scraping_targets.json"
    with open(targets_path, 'w') as f:
        json.dump(scraping_targets, f, indent=2)
    
    print(f"📄 Gap analysis report saved to: {report_path}")
    print(f"🎯 Scraping targets saved to: {targets_path}")
    
    return report_path, targets_path

def main():
    """Main gap analysis pipeline"""
    print("🔄 Starting Gap Analysis - Phase 2 of Hybrid Pipeline")
    
    # Load configuration
    config = load_config()
    
    # Set up paths
    pipeline_dir = Path(__file__).parent.parent
    production_dir = pipeline_dir.parent / "production"
    output_dir = pipeline_dir / "output"
    output_dir.mkdir(exist_ok=True)
    
    print("🔄 Loading existing fragrance data...")
    
    # Load existing processed data
    existing_data = load_existing_data(production_dir)
    if not existing_data:
        print("❌ No existing data found. Run Phase 1 (Kaggle processor) first.")
        return
    
    print("🔄 Analyzing trending fragrances...")
    
    # Get trending fragrances from multiple sources
    trending_data = analyze_trending_fragrances()
    
    print("🔄 Detecting gaps in our database...")
    
    # Identify missing fragrances
    missing_fragrances = detect_missing_fragrances(existing_data, trending_data)
    
    if not missing_fragrances:
        print("✅ No gaps detected - our database appears complete for trending fragrances!")
        return
    
    print("🔄 Filtering by quality thresholds...")
    
    # Filter by quality requirements
    qualified_candidates = filter_by_quality_thresholds(missing_fragrances, config)
    
    if not qualified_candidates:
        print("ℹ️  No trending fragrances meet quality thresholds for scraping.")
        return
    
    print("🔄 Prioritizing by brand tiers...")
    
    # Prioritize by brand importance
    prioritized_candidates = prioritize_by_brand_tier(qualified_candidates, config)
    
    print("🔄 Generating scraping targets...")
    
    # Generate specific scraping targets
    scraping_targets = generate_scraping_targets(prioritized_candidates)
    
    print("🔄 Saving gap analysis report...")
    
    # Save comprehensive report
    report_path, targets_path = save_gap_analysis_report(
        missing_fragrances, scraping_targets, output_dir
    )
    
    # Print summary
    print("\n📊 Gap Analysis Summary:")
    print(f"Total Missing Fragrances: {len(missing_fragrances)}")
    print(f"Qualified for Scraping: {len(scraping_targets)}")
    print(f"High Priority Targets: {len([t for t in scraping_targets if t['scraping_priority'] == 'high'])}")
    
    print(f"\n🏆 Top Priority Scraping Targets:")
    for target in scraping_targets[:5]:  # Top 5
        print(f"  {target['name']} by {target['brand']} (Priority: {target['priority_score']:.1f}, {target['brand_tier']})")
    
    print(f"\n🎯 Ready for Phase 2b: Ethical Scraping")
    print(f"   Scraping targets: {targets_path}")

if __name__ == "__main__":
    main()