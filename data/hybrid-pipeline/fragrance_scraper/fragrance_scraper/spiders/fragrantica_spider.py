import scrapy
import json
import re
from pathlib import Path
from ..items import FragranceItem

class FragranticaSpiderSpider(scrapy.Spider):
    name = "fragrantica_spider"
    allowed_domains = ["fragrantica.com"]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.load_scraping_targets()
    
    def load_scraping_targets(self):
        """Load scraping targets from gap analysis"""
        pipeline_dir = Path(__file__).parent.parent.parent.parent
        targets_path = pipeline_dir / "output" / "scraping_targets.json"
        
        if targets_path.exists():
            with open(targets_path) as f:
                targets = json.load(f)
            
            # Use estimated URLs as start URLs
            self.start_urls = [target['estimated_url'] for target in targets]
            self.targets_data = {target['estimated_url']: target for target in targets}
            
            self.logger.info(f"✅ Loaded {len(self.start_urls)} scraping targets")
        else:
            self.logger.warning("⚠️ No scraping targets found, using default URLs")
            self.start_urls = ["https://www.fragrantica.com/trending/"]
            self.targets_data = {}

    def start_requests(self):
        """Generate initial requests with stealth behavior"""
        
        # First, browse the homepage to establish session (human-like behavior)
        yield scrapy.Request(
            url="https://www.fragrantica.com/",
            callback=self.parse_homepage,
            meta={'dont_cache': True},
            headers={'Referer': 'https://www.google.com/'}
        )
        
        # Then proceed to actual targets with delays
        for url in self.start_urls:
            yield scrapy.Request(
                url=url,
                callback=self.parse_fragrance,
                meta={
                    'target_data': self.targets_data.get(url, {}),
                    'dont_cache': False  # Allow caching for efficiency
                },
                headers={'Referer': 'https://www.fragrantica.com/trending/'}
            )

    def parse_homepage(self, response):
        """Parse homepage to establish session (human-like browsing)"""
        self.logger.info(f"🏠 Homepage loaded: {response.status}")
        
        # Don't extract anything, just establish session
        # Real users typically browse a bit before going to specific pages
        return []

    def parse_fragrance(self, response):
        """Parse individual fragrance pages with advanced selectors"""
        
        self.logger.info(f"🌸 Parsing fragrance page: {response.url}")
        
        # Check for anti-bot detection pages
        if self.is_anti_bot_page(response):
            self.logger.warning(f"🤖 Anti-bot page detected, skipping: {response.url}")
            return
        
        # Create fragrance item
        item = FragranceItem()
        
        try:
            # Extract fragrance name - multiple selector strategies
            name_selectors = [
                'h1[itemprop="name"]::text',
                'h1.fragrance-name::text',
                'h1::text',
                '.main-info h1::text',
                '.perfume-details h1::text'
            ]
            name = self.extract_with_selectors(response, name_selectors)
            if not name:
                self.logger.warning(f"❌ Could not extract name from {response.url}")
                return
            
            # Extract brand - multiple strategies
            brand_selectors = [
                'span[itemprop="brand"]::text',
                'a.brand-name::text',
                '.brand-info a::text',
                '.main-info .brand::text',
                'h2.brand::text'
            ]
            brand = self.extract_with_selectors(response, brand_selectors)
            
            # Extract rating
            rating_selectors = [
                'span[itemprop="ratingValue"]::text',
                '.rating-value::text',
                '.stars-rating span::text',
                '.rating .value::text'
            ]
            rating_text = self.extract_with_selectors(response, rating_selectors)
            rating = self.parse_rating(rating_text)
            
            # Extract review count
            reviews_selectors = [
                'span[itemprop="reviewCount"]::text',
                '.review-count::text',
                '.votes-count::text',
                '.ratings-info .count::text'
            ]
            reviews_text = self.extract_with_selectors(response, reviews_selectors)
            review_count = self.parse_review_count(reviews_text)
            
            # Extract year
            year_selectors = [
                'span[itemprop="datePublished"]::text',
                '.launch-year::text',
                '.release-year::text',
                '.year::text'
            ]
            year_text = self.extract_with_selectors(response, year_selectors)
            year = self.parse_year(year_text)
            
            # Extract gender
            gender_selectors = [
                'span[itemprop="gender"]::text',
                '.gender-info::text',
                '.audience::text',
                '.for-gender::text'
            ]
            gender_text = self.extract_with_selectors(response, gender_selectors)
            gender = self.normalize_gender(gender_text)
            
            # Extract accords/notes
            accord_selectors = [
                '.accord-bar::text',
                '.main-accords .accord::text',
                '.note-pyramid .note::text',
                '.fragrance-notes .note::text'
            ]
            accords = response.css(' , '.join(accord_selectors)).getall()
            accords = [accord.strip() for accord in accords if accord.strip()][:5]
            
            # Extract notes by category
            top_notes = self.extract_notes(response, ['top-notes', 'head-notes', 'opening-notes'])
            middle_notes = self.extract_notes(response, ['middle-notes', 'heart-notes', 'middle'])
            base_notes = self.extract_notes(response, ['base-notes', 'dry-down', 'bottom-notes'])
            
            # Extract perfumers
            perfumer_selectors = [
                'span[itemprop="author"]::text',
                '.perfumer-name::text',
                '.nose .name::text',
                '.created-by a::text'
            ]
            perfumers = response.css(' , '.join(perfumer_selectors)).getall()
            perfumers = [p.strip() for p in perfumers if p.strip() and p.strip().lower() != 'unknown']
            
            # Calculate sample price based on rating and brand
            sample_price = self.calculate_sample_price(brand, rating)
            
            # Populate item
            item['name'] = name.strip()
            item['brand'] = brand.strip() if brand else 'Unknown Brand'
            item['rating_value'] = rating
            item['rating_count'] = review_count
            item['year'] = year
            item['gender'] = gender
            item['accords'] = accords
            item['top_notes'] = top_notes
            item['middle_notes'] = middle_notes
            item['base_notes'] = base_notes
            item['perfumers'] = perfumers
            item['fragrantica_url'] = response.url
            item['sample_available'] = True
            item['sample_price_usd'] = sample_price
            
            self.logger.info(f"✅ Extracted: {name} by {brand} (Rating: {rating}, Reviews: {review_count})")
            
            yield item
            
        except Exception as e:
            self.logger.error(f"❌ Error parsing {response.url}: {e}")
    
    def extract_with_selectors(self, response, selectors):
        """Try multiple CSS selectors and return first successful extraction"""
        for selector in selectors:
            result = response.css(selector).get()
            if result and result.strip():
                return result.strip()
        return None
    
    def extract_notes(self, response, class_patterns):
        """Extract notes for specific categories (top, middle, base)"""
        notes = []
        for pattern in class_patterns:
            # Try multiple selector strategies
            selectors = [
                f'.{pattern} .note::text',
                f'.{pattern}::text',
                f'[class*="{pattern}"] .ingredient::text',
                f'[class*="{pattern}"]::text'
            ]
            
            for selector in selectors:
                found_notes = response.css(selector).getall()
                if found_notes:
                    notes.extend([note.strip() for note in found_notes if note.strip()])
                    break
        
        return ', '.join(notes[:10]) if notes else ''  # Limit to 10 notes
    
    def parse_rating(self, rating_text):
        """Parse rating from various text formats"""
        if not rating_text:
            return 4.0
        
        # Extract number from text (handle European decimals)
        numbers = re.findall(r'[\d,]+\.?\d*', rating_text.replace(',', '.'))
        if numbers:
            try:
                rating = float(numbers[0])
                return max(1.0, min(5.0, rating))  # Clamp to 1-5 range
            except ValueError:
                pass
        
        return 4.0  # Default rating
    
    def parse_review_count(self, reviews_text):
        """Parse review count from various text formats"""
        if not reviews_text:
            return 500
        
        # Extract numbers, handle thousands separators
        numbers = re.findall(r'[\d,]+', reviews_text.replace(',', '').replace('.', ''))
        if numbers:
            try:
                return int(numbers[0])
            except ValueError:
                pass
        
        return 500  # Default review count
    
    def parse_year(self, year_text):
        """Parse release year from text"""
        if not year_text:
            return 2024
        
        # Extract 4-digit year
        years = re.findall(r'\d{4}', year_text)
        if years:
            year = int(years[0])
            if 1900 <= year <= 2025:  # Reasonable year range
                return year
        
        return 2024  # Default year
    
    def normalize_gender(self, gender_text):
        """Normalize gender classification"""
        if not gender_text:
            return 'unisex'
        
        gender_lower = gender_text.lower()
        if 'women' in gender_lower and 'men' not in gender_lower.replace('women', ''):
            return 'women'
        elif 'men' in gender_lower and 'women' not in gender_lower:
            return 'men'
        else:
            return 'unisex'
    
    def calculate_sample_price(self, brand, rating):
        """Calculate sample price based on brand tier and rating"""
        if not brand:
            return 16
        
        brand_lower = brand.lower()
        luxury_brands = ['dior', 'chanel', 'tom ford', 'creed', 'hermès', 'guerlain']
        premium_brands = ['yves saint laurent', 'paco rabanne', 'versace', 'armani']
        
        if any(lux in brand_lower for lux in luxury_brands):
            return 20
        elif any(prem in brand_lower for prem in premium_brands):
            return 18
        elif rating >= 4.5:
            return 18
        elif rating >= 4.0:
            return 16
        else:
            return 15
    
    def is_anti_bot_page(self, response):
        """Detect anti-bot or CAPTCHA pages"""
        if response.status != 200:
            return False
        
        body_text = response.text.lower()
        anti_bot_indicators = [
            'access denied', 'bot detected', 'captcha', 'cloudflare',
            'please wait', 'checking your browser', 'ray id', 'security check'
        ]
        
        return any(indicator in body_text for indicator in anti_bot_indicators)
