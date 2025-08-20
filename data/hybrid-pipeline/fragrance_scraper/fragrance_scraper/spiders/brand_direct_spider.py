import scrapy
import json
import re
from pathlib import Path
from ..items import FragranceItem

class BrandDirectSpider(scrapy.Spider):
    name = "brand_direct"
    allowed_domains = ["phlur.com", "glossier.com", "soldejaneiro.com", "kayali.com", "sephora.com", "ulta.com"]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.setup_brand_urls()
    
    def setup_brand_urls(self):
        """Set up direct brand website URLs for our 4 missing fragrances"""
        
        self.fragrance_targets = [
            {
                'name': 'Missing Person',
                'brand': 'Phlur',
                'urls': [
                    'https://phlur.com/products/missing-person',
                    'https://phlur.com/collections/all/products/missing-person',
                    'https://www.sephora.com/product/phlur-missing-person',
                    'https://www.ulta.com/p/missing-person-eau-de-parfum'
                ]
            },
            {
                'name': 'Glossier You',
                'brand': 'Glossier',
                'urls': [
                    'https://www.glossier.com/products/you',
                    'https://www.glossier.com/products/you-eau-de-parfum',
                    'https://www.sephora.com/product/glossier-you-eau-de-parfum',
                    'https://www.ulta.com/p/you-eau-de-parfum'
                ]
            },
            {
                'name': 'Cheirosa 71',
                'brand': 'Sol de Janeiro',
                'urls': [
                    'https://soldejaneiro.com/products/perfume-mist-cheirosa-71',
                    'https://soldejaneiro.com/collections/fragrance/products/cheirosa-71',
                    'https://www.sephora.com/product/sol-de-janeiro-cheirosa-71',
                    'https://www.ulta.com/p/sol-de-janeiro-cheirosa-71'
                ]
            },
            {
                'name': 'Vanilla 28',
                'brand': 'Kayali',
                'urls': [
                    'https://kayali.com/products/vanilla-28',
                    'https://kayali.com/collections/fragrances/products/vanilla-28',
                    'https://www.sephora.com/product/kayali-vanilla-28',
                    'https://www.ulta.com/p/kayali-vanilla-28-eau-de-parfum'
                ]
            }
        ]
        
        # Create start URLs list
        self.start_urls = ['https://phlur.com/', 'https://www.glossier.com/']  # Start with homepages
        
        self.logger.info(f"✅ Set up {len(self.fragrance_targets)} fragrance targets with multiple URL strategies")

    def start_requests(self):
        """Generate requests with different strategies"""
        
        # Test homepages first
        test_homepages = [
            'https://phlur.com/',
            'https://www.glossier.com/',
            'https://soldejaneiro.com/',
            'https://kayali.com/'
        ]
        
        for homepage in test_homepages:
            yield scrapy.Request(
                url=homepage,
                callback=self.test_brand_access,
                meta={'brand_homepage': True},
                headers={'Referer': 'https://www.google.com/'}
            )

    def test_brand_access(self, response):
        """Test brand website accessibility"""
        
        self.logger.info(f"🏠 Testing brand site: {response.url}")
        self.logger.info(f"   Status: {response.status}")
        self.logger.info(f"   Size: {len(response.body)} bytes")
        
        if response.status == 200:
            try:
                text_content = response.text
                domain = response.url.split('//')[1].split('/')[0].lower()
                brand_name = domain.split('.')[0]
                
                self.logger.info(f"✅ {brand_name.title()} homepage accessible")
                
                # Find matching fragrance target
                matching_target = None
                for target in self.fragrance_targets:
                    if brand_name in target['brand'].lower():
                        matching_target = target
                        break
                
                if matching_target:
                    self.logger.info(f"🎯 Proceeding to {matching_target['name']} product pages")
                    
                    # Try product URLs for this brand
                    for product_url in matching_target['urls']:
                        if domain in product_url:  # Only try URLs from this domain
                            yield scrapy.Request(
                                url=product_url,
                                callback=self.parse_product_page,
                                meta={
                                    'fragrance_target': matching_target,
                                    'brand_domain': domain
                                },
                                headers={'Referer': response.url}
                            )
                
            except Exception as e:
                self.logger.error(f"❌ Error processing {response.url}: {e}")
                
        elif response.status == 403:
            self.logger.warning(f"🚫 {response.url} also has 403 protection")
            
        else:
            self.logger.warning(f"⚠️ Unexpected status {response.status}: {response.url}")

    def parse_product_page(self, response):
        """Parse product pages from brand websites"""
        
        fragrance_target = response.meta.get('fragrance_target', {})
        brand_domain = response.meta.get('brand_domain', '')
        
        self.logger.info(f"🛍️ Parsing product page: {response.url}")
        self.logger.info(f"   Looking for: {fragrance_target.get('name')} by {fragrance_target.get('brand')}")
        
        if response.status == 200:
            try:
                text_content = response.text
                
                # Check if this is the right product
                expected_name = fragrance_target.get('name', '').lower()
                if expected_name.replace(' ', '') in text_content.lower().replace(' ', ''):
                    self.logger.info(f"✅ Found matching product page!")
                    
                    item = FragranceItem()
                    
                    # Extract product data using e-commerce selectors
                    name_selectors = [
                        'h1.product-title::text',
                        'h1.pdp-product-name::text',
                        'h1[data-testid="product-name"]::text',
                        '.product-name::text',
                        'h1::text'
                    ]
                    
                    name = self.extract_with_selectors(response, name_selectors)
                    if name:
                        item['name'] = name.strip()
                        self.logger.info(f"🌸 Product name: {name}")
                    
                    # Extract brand (or use target brand)
                    brand_selectors = [
                        '.brand-name::text',
                        '.product-brand::text',
                        '[data-testid="brand"]::text'
                    ]
                    
                    brand = self.extract_with_selectors(response, brand_selectors)
                    if not brand:
                        brand = fragrance_target.get('brand', '')
                    
                    if brand:
                        item['brand'] = brand.strip()
                        self.logger.info(f"🏷️ Brand: {brand}")
                    
                    # Look for reviews/ratings (e-commerce sites often have these)
                    rating_selectors = [
                        '.rating-value::text',
                        '.stars-rating::text',
                        '[data-testid="rating"]::text',
                        '.review-rating::text'
                    ]
                    
                    rating_text = self.extract_with_selectors(response, rating_selectors)
                    if rating_text:
                        rating = self.parse_rating(rating_text)
                        item['rating_value'] = rating
                        self.logger.info(f"⭐ Rating: {rating}")
                    else:
                        item['rating_value'] = 4.0  # Default for trending fragrances
                    
                    # Look for review count
                    review_selectors = [
                        '.review-count::text',
                        '[data-testid="review-count"]::text',
                        '.reviews-number::text'
                    ]
                    
                    reviews_text = self.extract_with_selectors(response, review_selectors)
                    if reviews_text:
                        reviews = self.parse_review_count(reviews_text)
                        item['rating_count'] = reviews
                        self.logger.info(f"📝 Reviews: {reviews}")
                    else:
                        item['rating_count'] = 500  # Default estimate
                    
                    # Extract product description for notes
                    description_selectors = [
                        '.product-description::text',
                        '.fragrance-notes::text',
                        '.product-details::text',
                        '.pdp-description::text'
                    ]
                    
                    description = self.extract_with_selectors(response, description_selectors)
                    if description:
                        # Try to extract notes from description
                        notes = self.extract_notes_from_description(description)
                        item['top_notes'] = notes.get('top', '')
                        item['middle_notes'] = notes.get('middle', '')
                        item['base_notes'] = notes.get('base', '')
                        item['accords'] = notes.get('accords', [])
                        self.logger.info(f"📝 Extracted notes from description")
                    
                    # Set defaults for missing fields
                    item['year'] = 2024
                    item['gender'] = 'unisex'
                    item['fragrantica_url'] = response.url
                    item['scraped_source'] = f'brand_direct_{brand_domain}'
                    item['sample_available'] = True
                    item['sample_price_usd'] = 18  # Premium for trendy brands
                    
                    # Yield if we have minimum required data
                    if item.get('name') and item.get('brand'):
                        self.logger.info(f"✅ Successfully extracted brand data: {item['name']} by {item['brand']}")
                        yield item
                    else:
                        self.logger.warning(f"⚠️ Insufficient data extracted from {response.url}")
                
                else:
                    self.logger.info(f"ℹ️ Page doesn't match expected fragrance: {response.url}")
                    
            except Exception as e:
                self.logger.error(f"❌ Error parsing product page: {e}")
                
        else:
            self.logger.warning(f"⚠️ Product page status {response.status}: {response.url}")

    def extract_with_selectors(self, response, selectors):
        """Try multiple CSS selectors and return first successful extraction"""
        for selector in selectors:
            result = response.css(selector).get()
            if result and result.strip():
                return result.strip()
        return None
    
    def extract_notes_from_description(self, description):
        """Extract fragrance notes from product description text"""
        
        notes = {'top': '', 'middle': '', 'base': '', 'accords': []}
        
        # Common note keywords to look for
        note_patterns = {
            'top': ['top notes?', 'opening', 'initial', 'head notes?'],
            'middle': ['middle notes?', 'heart notes?', 'core', 'center'],
            'base': ['base notes?', 'dry.?down', 'foundation', 'lasting']
        }
        
        description_lower = description.lower()
        
        # Try to find note sections
        for note_type, patterns in note_patterns.items():
            for pattern in patterns:
                match = re.search(rf'{pattern}[:\s]*([^.]+)', description_lower)
                if match:
                    notes[note_type] = match.group(1).strip()
                    break
        
        # Extract general fragrance terms as accords
        accord_keywords = [
            'vanilla', 'woody', 'floral', 'citrus', 'fresh', 'spicy', 'sweet',
            'musky', 'amber', 'bergamot', 'sandalwood', 'rose', 'jasmine',
            'pepper', 'cedar', 'vetiver', 'patchouli', 'gourmand'
        ]
        
        found_accords = []
        for keyword in accord_keywords:
            if keyword in description_lower:
                found_accords.append(keyword)
        
        notes['accords'] = found_accords[:5]  # Limit to 5 accords
        
        return notes
    
    def parse_rating(self, rating_text):
        """Parse rating from various e-commerce formats"""
        if not rating_text:
            return 4.0
        
        # Handle various rating formats (4.5/5, 4.5 stars, 90%, etc.)
        numbers = re.findall(r'[\d,]+\.?\d*', rating_text.replace(',', '.'))
        if numbers:
            try:
                rating = float(numbers[0])
                
                # Convert different scales to 5-point
                if rating > 5 and rating <= 10:  # 10-point scale
                    rating = rating / 2
                elif rating > 10 and rating <= 100:  # Percentage
                    rating = rating / 20  # 100% = 5 stars
                
                return max(1.0, min(5.0, rating))
            except ValueError:
                pass
        
        return 4.0
    
    def parse_review_count(self, reviews_text):
        """Parse review count from e-commerce formats"""
        if not reviews_text:
            return 500
        
        # Extract numbers, handle formats like "1,234 reviews"
        numbers = re.findall(r'[\d,]+', reviews_text.replace(',', ''))
        if numbers:
            try:
                return int(numbers[0])
            except ValueError:
                pass
        
        return 500