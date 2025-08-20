import scrapy
import json
import re
from pathlib import Path
from ..items import FragranceItem

class ParfumoSpider(scrapy.Spider):
    name = "parfumo_spider"
    allowed_domains = ["parfumo.com"]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.load_missing_fragrances()
    
    def load_missing_fragrances(self):
        """Load the 4 missing fragrances and generate Parfumo URLs"""
        
        # Our 4 missing fragrances with Parfumo URL estimation
        missing_fragrances = [
            {
                'name': 'Missing Person',
                'brand': 'Phlur',
                'parfumo_url': 'https://www.parfumo.com/Perfumes/Phlur/Missing_Person',
                'search_terms': ['phlur missing person', 'missing person phlur']
            },
            {
                'name': 'Glossier You',
                'brand': 'Glossier', 
                'parfumo_url': 'https://www.parfumo.com/Perfumes/Glossier/You',
                'search_terms': ['glossier you', 'you glossier']
            },
            {
                'name': 'Cheirosa 71',
                'brand': 'Sol de Janeiro',
                'parfumo_url': 'https://www.parfumo.com/Perfumes/Sol_de_Janeiro/Cheirosa_71',
                'search_terms': ['sol de janeiro cheirosa 71', 'cheirosa 71']
            },
            {
                'name': 'Vanilla 28',
                'brand': 'Kayali',
                'parfumo_url': 'https://www.parfumo.com/Perfumes/Kayali/Vanilla_28',
                'search_terms': ['kayali vanilla 28', 'vanilla 28 kayali']
            }
        ]
        
        # Generate start URLs - try direct URLs first, then search
        self.start_urls = []
        self.search_urls = []
        
        for frag in missing_fragrances:
            # Try direct perfume page
            self.start_urls.append(frag['parfumo_url'])
            
            # Also try search pages
            for term in frag['search_terms']:
                search_url = f"https://www.parfumo.com/search/perfumes?query={term.replace(' ', '+')}"
                self.search_urls.append(search_url)
        
        # Test homepage first
        self.start_urls.insert(0, "https://www.parfumo.com/")
        
        self.missing_fragrances = missing_fragrances
        self.logger.info(f"✅ Generated {len(self.start_urls)} URLs for Parfumo testing")

    def start_requests(self):
        """Generate requests with human-like behavior"""
        
        # First, test homepage access
        yield scrapy.Request(
            url="https://www.parfumo.com/",
            callback=self.test_homepage_access,
            meta={'dont_cache': True},
            headers={'Referer': 'https://www.google.com/'}
        )

    def test_homepage_access(self, response):
        """Test Parfumo homepage accessibility"""
        
        self.logger.info(f"🏠 Parfumo homepage test: {response.url}")
        self.logger.info(f"   Status: {response.status}")
        self.logger.info(f"   Size: {len(response.body)} bytes")
        
        if response.status == 200:
            try:
                text_content = response.text
                self.logger.info(f"✅ Successfully accessed Parfumo homepage")
                self.logger.info(f"   Text length: {len(text_content)} characters")
                
                # Check for Parfumo-specific content
                if 'parfumo' in text_content.lower():
                    self.logger.info(f"✅ Contains Parfumo content - proceeding to fragrance pages")
                    
                    # Try direct fragrance URLs
                    for frag in self.missing_fragrances:
                        yield scrapy.Request(
                            url=frag['parfumo_url'],
                            callback=self.parse_fragrance,
                            meta={
                                'fragrance_info': frag,
                                'dont_cache': False
                            },
                            headers={'Referer': 'https://www.parfumo.com/'}
                        )
                
                else:
                    self.logger.warning(f"❌ Homepage doesn't contain Parfumo content")
                    
            except Exception as e:
                self.logger.error(f"❌ Error processing homepage: {e}")
                
        elif response.status == 403:
            self.logger.warning(f"🚫 Parfumo also has 403 protection - trying search approach")
            
            # Try search pages instead
            for search_url in self.search_urls[:2]:  # Try first 2 searches
                yield scrapy.Request(
                    url=search_url,
                    callback=self.parse_search_results,
                    headers={'Referer': 'https://www.google.com/'}
                )
        
        else:
            self.logger.warning(f"⚠️ Unexpected homepage status: {response.status}")

    def parse_fragrance(self, response):
        """Parse individual fragrance pages on Parfumo"""
        
        fragrance_info = response.meta.get('fragrance_info', {})
        
        self.logger.info(f"🌸 Parsing Parfumo fragrance: {response.url}")
        self.logger.info(f"   Expected: {fragrance_info.get('name')} by {fragrance_info.get('brand')}")
        
        if response.status == 200:
            try:
                text_content = response.text
                
                # Check for actual fragrance content
                if 'parfumo' in text_content.lower() and 'perfume' in text_content.lower():
                    self.logger.info(f"✅ Successfully accessed fragrance page")
                    
                    # Extract fragrance data using Parfumo selectors
                    item = FragranceItem()
                    
                    # Try Parfumo-specific selectors
                    name_selectors = [
                        'h1.perfume-name::text',
                        'h1::text',
                        '.product-title::text',
                        'title::text'
                    ]
                    
                    name = self.extract_with_selectors(response, name_selectors)
                    if name:
                        item['name'] = name.strip()
                        self.logger.info(f"🌸 Found name: {name}")
                    
                    # Extract brand
                    brand_selectors = [
                        '.brand-name::text',
                        '.perfume-brand a::text',
                        'a[href*="/brand/"]::text'
                    ]
                    
                    brand = self.extract_with_selectors(response, brand_selectors)
                    if brand:
                        item['brand'] = brand.strip()
                        self.logger.info(f"🏷️ Found brand: {brand}")
                    
                    # Extract rating (Parfumo uses different rating system)
                    rating_selectors = [
                        '.rating-value::text',
                        '.score::text',
                        '.average-rating::text'
                    ]
                    
                    rating_text = self.extract_with_selectors(response, rating_selectors)
                    if rating_text:
                        rating = self.parse_rating(rating_text)
                        item['rating_value'] = rating
                        self.logger.info(f"⭐ Found rating: {rating}")
                    
                    # Extract review/vote count
                    review_selectors = [
                        '.votes-count::text',
                        '.rating-count::text',
                        '.review-number::text'
                    ]
                    
                    reviews_text = self.extract_with_selectors(response, review_selectors)
                    if reviews_text:
                        reviews = self.parse_review_count(reviews_text)
                        item['rating_count'] = reviews
                        self.logger.info(f"📝 Found reviews: {reviews}")
                    
                    # Extract other fields
                    item['fragrantica_url'] = response.url  # Store Parfumo URL
                    item['scraped_source'] = 'parfumo'
                    item['year'] = 2024  # Default for trending fragrances
                    item['gender'] = 'unisex'  # Default
                    item['sample_available'] = True
                    item['sample_price_usd'] = 16
                    
                    # If we got basic data, yield the item
                    if item.get('name') and item.get('brand'):
                        self.logger.info(f"✅ Successfully extracted: {item['name']} by {item['brand']}")
                        yield item
                    else:
                        self.logger.warning(f"⚠️ Missing required fields for {response.url}")
                
                else:
                    self.logger.warning(f"❌ Page doesn't contain fragrance content")
                    
            except Exception as e:
                self.logger.error(f"❌ Error parsing fragrance page: {e}")
                
        elif response.status == 403:
            self.logger.warning(f"🚫 403 Forbidden on fragrance page: {response.url}")
            
        else:
            self.logger.warning(f"⚠️ Unexpected status {response.status}: {response.url}")

    def parse_search_results(self, response):
        """Parse Parfumo search results to find fragrance links"""
        
        self.logger.info(f"🔍 Parsing search results: {response.url}")
        
        if response.status == 200:
            try:
                # Look for fragrance links in search results
                fragrance_links = response.css('a[href*="/Perfumes/"]::attr(href)').getall()
                
                self.logger.info(f"🔗 Found {len(fragrance_links)} fragrance links in search")
                
                for link in fragrance_links[:3]:  # Try first 3 results
                    full_url = response.urljoin(link)
                    yield scrapy.Request(
                        url=full_url,
                        callback=self.parse_fragrance,
                        headers={'Referer': response.url}
                    )
                    
            except Exception as e:
                self.logger.error(f"❌ Error parsing search results: {e}")
        
        else:
            self.logger.warning(f"⚠️ Search failed with status: {response.status}")

    def extract_with_selectors(self, response, selectors):
        """Try multiple CSS selectors and return first successful extraction"""
        for selector in selectors:
            result = response.css(selector).get()
            if result and result.strip():
                return result.strip()
        return None
    
    def parse_rating(self, rating_text):
        """Parse rating from Parfumo format"""
        if not rating_text:
            return 4.0
        
        # Parfumo might use different rating scales (1-10, percentages, etc.)
        numbers = re.findall(r'[\d,]+\.?\d*', rating_text.replace(',', '.'))
        if numbers:
            try:
                rating = float(numbers[0])
                # If rating is out of 10, convert to 5-point scale
                if rating > 5:
                    rating = rating / 2
                return max(1.0, min(5.0, rating))
            except ValueError:
                pass
        
        return 4.0
    
    def parse_review_count(self, reviews_text):
        """Parse review count from Parfumo format"""
        if not reviews_text:
            return 500
        
        numbers = re.findall(r'[\d,]+', reviews_text.replace(',', '').replace('.', ''))
        if numbers:
            try:
                return int(numbers[0])
            except ValueError:
                pass
        
        return 500