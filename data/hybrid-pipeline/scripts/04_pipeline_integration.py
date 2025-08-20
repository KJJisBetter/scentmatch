#!/usr/bin/env python3
"""
Pipeline Integration - Complete Hybrid Pipeline
Combines Kaggle processed data with gap analysis results and prepares final dataset
"""

import json
import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Dict, List

def load_kaggle_processed_data(production_dir: Path) -> List[Dict]:
    """Load the processed Kaggle data (2,000 fragrances)"""
    fragrances_path = production_dir / "fragrances_kaggle_processed.json"
    
    if not fragrances_path.exists():
        print(f"❌ Kaggle processed data not found at {fragrances_path}")
        return []
    
    with open(fragrances_path) as f:
        data = json.load(f)
    
    print(f"✅ Loaded {len(data)} Kaggle-processed fragrances")
    return data

def load_scrapy_results(output_dir: Path) -> List[Dict]:
    """Load any successful Scrapy results"""
    scrapy_files = list(output_dir.glob("fragrances_scrapy_*.json"))
    
    scrapy_data = []
    for file_path in scrapy_files:
        try:
            with open(file_path) as f:
                data = json.load(f)
                if data:  # Only include non-empty files
                    scrapy_data.extend(data)
                    print(f"✅ Loaded {len(data)} fragrances from {file_path.name}")
        except Exception as e:
            print(f"⚠️ Could not load {file_path.name}: {e}")
    
    if not scrapy_data:
        print("ℹ️ No Scrapy results found (expected due to anti-bot protection)")
    
    return scrapy_data

def load_gap_analysis(output_dir: Path) -> Dict:
    """Load gap analysis results"""
    gap_files = list(output_dir.glob("gap_analysis_report_*.json"))
    
    if not gap_files:
        print("❌ No gap analysis found")
        return {}
    
    # Get the most recent gap analysis
    latest_file = max(gap_files, key=lambda f: f.stat().st_mtime)
    
    with open(latest_file) as f:
        gap_data = json.load(f)
    
    print(f"✅ Loaded gap analysis from {latest_file.name}")
    print(f"   Missing fragrances identified: {gap_data['summary']['total_missing_identified']}")
    print(f"   Qualified for scraping: {gap_data['summary']['qualified_for_scraping']}")
    
    return gap_data

def create_manual_collection_guide(gap_data: Dict, output_dir: Path) -> Path:
    """Create a guide for manual collection of missing fragrances"""
    
    if not gap_data or 'scraping_targets' not in gap_data:
        print("⚠️ No gap data available for manual collection guide")
        return None
    
    targets = gap_data['scraping_targets']
    
    # Create manual collection guide
    guide = {
        'collection_date': datetime.now().isoformat(),
        'purpose': 'Manual collection guide for missing trending fragrances',
        'instructions': [
            '1. Visit each URL below in a regular browser',
            '2. Extract the requested data fields',
            '3. Add to manual_collected_fragrances.json',
            '4. Run pipeline integration to merge with main dataset'
        ],
        'targets': []
    }
    
    for target in targets:
        guide_entry = {
            'fragrance_name': target['name'],
            'brand': target['brand'],
            'url': target['estimated_url'],
            'priority': target['scraping_priority'],
            'expected_rating': target['expected_rating'],
            'expected_reviews': target['expected_reviews'],
            'data_to_collect': {
                'name': 'Exact fragrance name from page',
                'brand': 'Brand name',
                'rating_value': 'Numeric rating (e.g., 4.2)',
                'rating_count': 'Number of reviews/votes',
                'year': 'Release year',
                'gender': 'men/women/unisex',
                'top_notes': 'Top notes list',
                'middle_notes': 'Middle/heart notes list', 
                'base_notes': 'Base notes list',
                'accords': 'Main accords/themes'
            }
        }
        guide['targets'].append(guide_entry)
    
    # Save guide
    guide_path = output_dir / "manual_collection_guide.json"
    with open(guide_path, 'w') as f:
        json.dump(guide, f, indent=2)
    
    print(f"📋 Manual collection guide saved to: {guide_path}")
    return guide_path

def load_manual_collection_data(output_dir: Path) -> List[Dict]:
    """Load manually collected fragrance data if available"""
    manual_path = output_dir / "manual_collected_fragrances.json"
    
    if not manual_path.exists():
        print("ℹ️ No manual collection data found (create manual_collected_fragrances.json)")
        return []
    
    with open(manual_path) as f:
        data = json.load(f)
    
    print(f"✅ Loaded {len(data)} manually collected fragrances")
    return data

def merge_all_datasets(kaggle_data: List[Dict], scrapy_data: List[Dict], manual_data: List[Dict]) -> List[Dict]:
    """Merge all data sources into final dataset"""
    
    print("🔄 Merging all data sources...")
    
    # Start with Kaggle data as base
    merged_data = list(kaggle_data)
    merged_count = len(merged_data)
    
    # Add Scrapy results
    for item in scrapy_data:
        # Check for duplicates by ID
        item_id = item.get('id', f"{item.get('brand_id', '')}__{item.get('slug', '')}")
        existing_ids = {frag.get('id') for frag in merged_data}
        
        if item_id not in existing_ids:
            merged_data.append(item)
            merged_count += 1
            print(f"   ➕ Added Scrapy result: {item.get('name')} by {item.get('brand')}")
    
    # Add manual collection results
    for item in manual_data:
        # Generate ID if not present
        if 'id' not in item and item.get('brand') and item.get('name'):
            import re
            brand_slug = re.sub(r'[^a-z0-9]+', '-', item['brand'].lower()).strip('-')
            name_slug = re.sub(r'[^a-z0-9]+', '-', item['name'].lower()).strip('-')
            item['id'] = f"{brand_slug}__{name_slug}"
            item['brand_id'] = brand_slug
            item['slug'] = name_slug
        
        # Check for duplicates
        item_id = item.get('id')
        existing_ids = {frag.get('id') for frag in merged_data}
        
        if item_id not in existing_ids:
            # Add metadata for manual collection
            item['scraped_source'] = 'manual_collection'
            item['sample_available'] = True
            item['sample_price_usd'] = 16  # Default sample price
            
            merged_data.append(item)
            merged_count += 1
            print(f"   ➕ Added manual collection: {item.get('name')} by {item.get('brand')}")
    
    print(f"✅ Final merged dataset: {len(merged_data)} fragrances")
    return merged_data

def create_database_import_files(merged_data: List[Dict], output_dir: Path) -> tuple:
    """Create final files ready for database import"""
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Create final fragrances dataset
    fragrances_path = output_dir / f"fragrances_final_{timestamp}.json"
    with open(fragrances_path, 'w') as f:
        json.dump(merged_data, f, indent=2, ensure_ascii=False)
    
    # Extract unique brands
    brands_data = {}
    for frag in merged_data:
        brand_id = frag.get('brand_id')
        brand_name = frag.get('brand', frag.get('brand_name'))
        
        if brand_id and brand_name:
            if brand_id not in brands_data:
                brands_data[brand_id] = {
                    'id': brand_id,
                    'name': brand_name,
                    'slug': brand_id,
                    'fragrance_count': 0
                }
            brands_data[brand_id]['fragrance_count'] += 1
    
    brands_list = list(brands_data.values())
    brands_path = output_dir / f"brands_final_{timestamp}.json"
    with open(brands_path, 'w') as f:
        json.dump(brands_list, f, indent=2, ensure_ascii=False)
    
    print(f"📦 Final fragrances dataset: {fragrances_path}")
    print(f"📦 Final brands dataset: {brands_path}")
    
    return fragrances_path, brands_path

def generate_pipeline_summary(merged_data: List[Dict], gap_data: Dict, output_dir: Path):
    """Generate comprehensive pipeline summary report"""
    
    # Calculate statistics
    total_fragrances = len(merged_data)
    kaggle_count = len([f for f in merged_data if f.get('scraped_source') == 'kaggle'])
    scrapy_count = len([f for f in merged_data if 'scrapy' in f.get('scraped_source', '')])
    manual_count = len([f for f in merged_data if f.get('scraped_source') == 'manual_collection'])
    
    # Brand statistics
    brand_counts = {}
    for frag in merged_data:
        brand = frag.get('brand', frag.get('brand_name', 'Unknown'))
        brand_counts[brand] = brand_counts.get(brand, 0) + 1
    
    top_brands = sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Rating statistics
    ratings = [f['rating_value'] for f in merged_data if f.get('rating_value')]
    reviews = [f['rating_count'] for f in merged_data if f.get('rating_count')]
    
    summary = {
        'pipeline_completion_date': datetime.now().isoformat(),
        'total_statistics': {
            'total_fragrances': total_fragrances,
            'target_achieved': total_fragrances >= 2000,
            'data_sources': {
                'kaggle_processed': kaggle_count,
                'scrapy_collected': scrapy_count,
                'manual_collected': manual_count
            }
        },
        'quality_metrics': {
            'average_rating': sum(ratings) / len(ratings) if ratings else 0,
            'total_reviews_represented': sum(reviews) if reviews else 0,
            'rating_distribution': {
                '4.5+': len([r for r in ratings if r >= 4.5]),
                '4.0-4.5': len([r for r in ratings if 4.0 <= r < 4.5]),
                '3.5-4.0': len([r for r in ratings if 3.5 <= r < 4.0]),
                'below_3.5': len([r for r in ratings if r < 3.5])
            }
        },
        'brand_coverage': {
            'total_brands': len(brand_counts),
            'top_10_brands': top_brands
        },
        'gap_analysis_summary': gap_data.get('summary', {}),
        'scraping_challenges': {
            'fragrantica_access': 'Homepage accessible, fragrance pages blocked by anti-bot',
            'robots_txt_blocking': 'Scrapy explicitly blocked in robots.txt',
            'alternative_approaches': [
                'Manual collection for trending fragrances',
                'API partnerships with fragrance databases',
                'Alternative data sources (Parfumo, Basenotes)',
                'Slower scraping with residential proxies'
            ]
        },
        'next_steps': [
            'Import merged dataset into Supabase',
            'Generate embeddings for recommendation engine',
            'Set up continuous monitoring for new releases',
            'Consider manual collection for identified gaps'
        ]
    }
    
    summary_path = output_dir / f"hybrid_pipeline_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"📊 Pipeline summary saved to: {summary_path}")
    return summary

def main():
    """Main pipeline integration"""
    print("🔗 Starting Pipeline Integration - Hybrid Data Pipeline")
    
    # Set up paths
    pipeline_dir = Path(__file__).parent.parent
    production_dir = pipeline_dir.parent / "production"
    output_dir = pipeline_dir / "output"
    
    print("🔄 Loading all data sources...")
    
    # Load processed Kaggle data
    kaggle_data = load_kaggle_processed_data(production_dir)
    
    # Load Scrapy results (if any)
    scrapy_data = load_scrapy_results(output_dir)
    
    # Load manual collection results (if any)
    manual_data = load_manual_collection_data(output_dir)
    
    # Load gap analysis
    gap_data = load_gap_analysis(output_dir)
    
    print("🔄 Creating manual collection guide...")
    
    # Create manual collection guide for missing fragrances
    guide_path = create_manual_collection_guide(gap_data, output_dir)
    
    print("🔄 Merging all datasets...")
    
    # Merge all data sources
    merged_data = merge_all_datasets(kaggle_data, scrapy_data, manual_data)
    
    print("🔄 Creating database import files...")
    
    # Create final database import files
    fragrances_path, brands_path = create_database_import_files(merged_data, output_dir)
    
    print("🔄 Generating pipeline summary...")
    
    # Generate comprehensive summary
    summary = generate_pipeline_summary(merged_data, gap_data, output_dir)
    
    # Print final summary
    print("\n" + "="*60)
    print("🏁 HYBRID DATA PIPELINE COMPLETE")
    print("="*60)
    
    print(f"\n📊 Final Results:")
    print(f"   Total Fragrances: {len(merged_data)}")
    print(f"   Average Rating: {summary['quality_metrics']['average_rating']:.2f}")
    print(f"   Total Reviews: {summary['quality_metrics']['total_reviews_represented']:,}")
    print(f"   Brands Covered: {summary['brand_coverage']['total_brands']}")
    
    print(f"\n📦 Data Sources:")
    sources = summary['total_statistics']['data_sources']
    print(f"   Kaggle Processed: {sources['kaggle_processed']}")
    print(f"   Scrapy Collected: {sources['scrapy_collected']}")
    print(f"   Manual Collected: {sources['manual_collected']}")
    
    print(f"\n🏆 Top Brands:")
    for brand, count in summary['brand_coverage']['top_10_brands'][:5]:
        print(f"   {brand}: {count} fragrances")
    
    print(f"\n📁 Ready for Database Import:")
    print(f"   Fragrances: {fragrances_path}")
    print(f"   Brands: {brands_path}")
    
    if guide_path:
        print(f"\n📋 Manual Collection Guide:")
        print(f"   Guide: {guide_path}")
        print(f"   Missing trending fragrances can be manually collected")
    
    print(f"\n🎯 Next Phase: Database Integration & Embedding Generation")

if __name__ == "__main__":
    main()