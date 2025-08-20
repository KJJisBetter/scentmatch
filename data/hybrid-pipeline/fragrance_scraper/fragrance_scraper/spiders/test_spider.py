import scrapy
import json

class TestSpider(scrapy.Spider):
    name = "test_spider"
    allowed_domains = ["fragrantica.com"]
    
    # Test various Fragrantica URLs to find accessible endpoints
    start_urls = [
        "https://www.fragrantica.com/",  # Homepage
        "https://www.fragrantica.com/trending/",  # Trending page
        "https://www.fragrantica.com/new_releases/",  # New releases
        "https://www.fragrantica.com/brands/",  # Brand listing
        # Try some popular fragrances that might be less protected
        "https://www.fragrantica.com/perfume/Dior/Sauvage-31861.html",
        "https://www.fragrantica.com/perfume/Chanel/Bleu-de-Chanel-9099.html",
        "https://www.fragrantica.com/perfume/Creed/Aventus-9828.html",
    ]
    
    def parse(self, response):
        """Parse response and log accessibility"""
        
        url = response.url
        status = response.status
        size = len(response.body)
        
        self.logger.info(f"📊 URL: {url}")
        self.logger.info(f"    Status: {status}")
        self.logger.info(f"    Size: {size} bytes")
        
        if status == 200:
            try:
                # Handle different response types (binary/text)
                try:
                    text = response.text.lower()
                except AttributeError:
                    # Handle binary responses
                    text = response.body.decode('utf-8', errors='ignore').lower()
                
                # Look for Fragrantica-specific content
                if 'fragrantica' in text:
                    self.logger.info(f"✅ SUCCESS: Got actual Fragrantica content")
                    
                    # Try to extract some basic info to see what's accessible
                    title = response.css('title::text').get()
                    if title:
                        self.logger.info(f"    Title: {title}")
                    
                    # Look for fragrance-specific elements
                    fragrance_name = response.css('h1::text').get()
                    if fragrance_name:
                        self.logger.info(f"    Fragrance: {fragrance_name}")
                    
                    # Check for anti-bot indicators
                    anti_bot_terms = ['cloudflare', 'checking your browser', 'ray id', 'access denied']
                    detected_terms = [term for term in anti_bot_terms if term in text]
                    if detected_terms:
                        self.logger.warning(f"🤖 Anti-bot indicators detected: {detected_terms}")
                    else:
                        self.logger.info(f"✅ No anti-bot indicators detected")
                        
                        # If this is a fragrance page, try to extract basic data
                        if '/perfume/' in url:
                            self.extract_fragrance_data(response)
                
                else:
                    self.logger.warning(f"❌ Got response but not Fragrantica content")
                    
            except Exception as e:
                self.logger.error(f"❌ Error processing response: {e}")
                
        elif status == 403:
            self.logger.warning(f"🚫 403 Forbidden - anti-bot protection active")
            
        elif status == 429:
            self.logger.warning(f"🚦 429 Rate Limited - need slower requests")
            
        else:
            self.logger.warning(f"⚠️ Unexpected status: {status}")
    
    def extract_fragrance_data(self, response):
        """Try to extract fragrance data if accessible"""
        try:
            # Try multiple selectors for fragrance name
            name_selectors = [
                'h1[itemprop="name"]::text',
                'h1::text',
                '.main-info h1::text',
                'title::text'
            ]
            
            for selector in name_selectors:
                name = response.css(selector).get()
                if name and name.strip():
                    self.logger.info(f"🌸 Found fragrance name: {name.strip()}")
                    break
            
            # Try to find rating
            rating_selectors = [
                'span[itemprop="ratingValue"]::text',
                '.rating-value::text',
                '.stars-rating::text'
            ]
            
            for selector in rating_selectors:
                rating = response.css(selector).get()
                if rating and rating.strip():
                    self.logger.info(f"⭐ Found rating: {rating.strip()}")
                    break
            
            # Try to find review count
            review_selectors = [
                'span[itemprop="reviewCount"]::text',
                '.review-count::text',
                '.votes-count::text'
            ]
            
            for selector in review_selectors:
                reviews = response.css(selector).get()
                if reviews and reviews.strip():
                    self.logger.info(f"📝 Found reviews: {reviews.strip()}")
                    break
                    
        except Exception as e:
            self.logger.error(f"❌ Error extracting fragrance data: {e}")