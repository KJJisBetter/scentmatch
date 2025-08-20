# Define your item pipelines here
#
# Advanced pipelines for fragrance data processing and quality assurance

import json
import re
from datetime import datetime
from pathlib import Path
from itemadapter import ItemAdapter
from scrapy.exceptions import DropItem

class QualityValidationPipeline:
    """Validate scraped fragrances meet quality thresholds"""
    
    def __init__(self):
        self.quality_thresholds = {
            'min_rating': 4.0,
            'min_reviews': 500,
            'max_year': 2025,
            'required_fields': ['name', 'brand', 'rating_value', 'rating_count']
        }
        self.processed_count = 0
        self.dropped_count = 0
    
    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        # Check required fields
        for field in self.quality_thresholds['required_fields']:
            if not adapter.get(field):
                self.dropped_count += 1
                raise DropItem(f"Missing required field: {field}")
        
        # Validate rating threshold
        rating = float(adapter.get('rating_value', 0))
        if rating < self.quality_thresholds['min_rating']:
            self.dropped_count += 1
            raise DropItem(f"Rating {rating} below minimum {self.quality_thresholds['min_rating']}")
        
        # Validate review count threshold
        reviews = int(adapter.get('rating_count', 0))
        if reviews < self.quality_thresholds['min_reviews']:
            self.dropped_count += 1
            raise DropItem(f"Reviews {reviews} below minimum {self.quality_thresholds['min_reviews']}")
        
        # Validate year range
        year = int(adapter.get('year', 2024))
        if year > self.quality_thresholds['max_year']:
            self.dropped_count += 1
            raise DropItem(f"Year {year} beyond maximum {self.quality_thresholds['max_year']}")
        
        self.processed_count += 1
        spider.logger.info(f"✅ Quality validation passed: {adapter['name']} (Rating: {rating}, Reviews: {reviews})")
        
        return item
    
    def close_spider(self, spider):
        spider.logger.info(f"📊 Quality Pipeline Summary: {self.processed_count} passed, {self.dropped_count} dropped")

class DataNormalizationPipeline:
    """Normalize and clean scraped fragrance data"""
    
    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        # Normalize name (remove extra whitespace, title case)
        if adapter.get('name'):
            adapter['name'] = re.sub(r'\s+', ' ', adapter['name']).strip().title()
        
        # Normalize brand (title case, remove extra whitespace)
        if adapter.get('brand'):
            adapter['brand'] = re.sub(r'\s+', ' ', adapter['brand']).strip().title()
        
        # Generate normalized IDs
        if adapter.get('brand') and adapter.get('name'):
            brand_slug = re.sub(r'[^a-z0-9]+', '-', adapter['brand'].lower()).strip('-')
            name_slug = re.sub(r'[^a-z0-9]+', '-', adapter['name'].lower()).strip('-')
            
            adapter['brand_id'] = brand_slug
            adapter['slug'] = name_slug
            adapter['id'] = f"{brand_slug}__{name_slug}"
        
        # Normalize rating (ensure float)
        if adapter.get('rating_value'):
            try:
                adapter['rating_value'] = float(adapter['rating_value'])
            except (ValueError, TypeError):
                adapter['rating_value'] = 4.0
        
        # Normalize review count (ensure integer)
        if adapter.get('rating_count'):
            try:
                adapter['rating_count'] = int(adapter['rating_count'])
            except (ValueError, TypeError):
                adapter['rating_count'] = 500
        
        # Normalize year (ensure integer)
        if adapter.get('year'):
            try:
                adapter['year'] = int(adapter['year'])
            except (ValueError, TypeError):
                adapter['year'] = 2024
        
        # Add metadata
        adapter['scraped_at'] = datetime.now().isoformat()
        adapter['scraped_source'] = 'fragrantica_scrapy'
        adapter['pipeline_version'] = '2.0_research_backed'
        
        spider.logger.info(f"🔧 Normalized: {adapter['name']} by {adapter['brand']}")
        
        return item

class JsonExportPipeline:
    """Export scraped data to JSON with proper formatting"""
    
    def __init__(self):
        self.items = []
        self.file_path = None
    
    def open_spider(self, spider):
        # Create output directory in hybrid pipeline
        pipeline_dir = Path(__file__).parent.parent.parent.parent
        output_dir = pipeline_dir / "output"
        output_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.file_path = output_dir / f"fragrances_scrapy_{timestamp}.json"
        
        spider.logger.info(f"📦 JSON export will save to: {self.file_path}")
    
    def process_item(self, item, spider):
        self.items.append(ItemAdapter(item).asdict())
        return item
    
    def close_spider(self, spider):
        # Save all items to JSON
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(self.items, f, indent=2, ensure_ascii=False)
        
        spider.logger.info(f"📄 Exported {len(self.items)} fragrances to {self.file_path}")
        
        # Also create a summary report
        if self.items:
            summary = {
                'export_timestamp': datetime.now().isoformat(),
                'total_fragrances': len(self.items),
                'average_rating': sum(item['rating_value'] for item in self.items) / len(self.items),
                'total_reviews': sum(item['rating_count'] for item in self.items),
                'brands_scraped': list(set(item['brand'] for item in self.items)),
                'year_range': {
                    'min': min(item['year'] for item in self.items if item.get('year')),
                    'max': max(item['year'] for item in self.items if item.get('year'))
                }
            }
            
            summary_path = self.file_path.with_name(f"scrapy_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
            with open(summary_path, 'w', encoding='utf-8') as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            
            spider.logger.info(f"📊 Summary report saved to: {summary_path}")
