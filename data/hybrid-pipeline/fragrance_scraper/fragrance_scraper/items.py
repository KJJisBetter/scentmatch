# Define here the models for your scraped items
#
# Fragrance data model for Scrapy pipeline integration

import scrapy

class FragranceItem(scrapy.Item):
    """Fragrance data item matching our database schema"""
    
    # Core identification
    id = scrapy.Field()  # Generated: brand_id__slug
    name = scrapy.Field()  # Fragrance name (cleaned)
    slug = scrapy.Field()  # URL-friendly name
    brand = scrapy.Field()  # Brand display name
    brand_id = scrapy.Field()  # URL-friendly brand ID
    
    # Quality metrics
    rating_value = scrapy.Field()  # Float rating (e.g., 4.2)
    rating_count = scrapy.Field()  # Integer review count
    year = scrapy.Field()  # Release year
    
    # Classification
    gender = scrapy.Field()  # 'men', 'women', 'unisex'
    accords = scrapy.Field()  # List of main accords
    
    # Fragrance composition
    top_notes = scrapy.Field()  # Top notes string
    middle_notes = scrapy.Field()  # Middle notes string  
    base_notes = scrapy.Field()  # Base notes string
    perfumers = scrapy.Field()  # List of perfumer names
    
    # Source and metadata
    fragrantica_url = scrapy.Field()  # Original URL
    scraped_at = scrapy.Field()  # ISO timestamp
    scraped_source = scrapy.Field()  # 'fragrantica_scrapy'
    pipeline_version = scrapy.Field()  # Pipeline version
    
    # Commercial data
    sample_available = scrapy.Field()  # Boolean
    sample_price_usd = scrapy.Field()  # Sample price estimate
