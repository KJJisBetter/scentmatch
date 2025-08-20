import scrapy
from ..items import FragranceItem

class SingleTestSpider(scrapy.Spider):
    name = "single_test"
    allowed_domains = ["fragrantica.com"]
    
    # Test just the URL that worked in our logs
    start_urls = [
        "https://www.fragrantica.com/perfume/Chanel/Bleu-de-Chanel-9099.html"
    ]
    
    def parse(self, response):
        """Parse the successful fragrance page"""
        
        self.logger.info(f"🎯 Testing single URL: {response.url}")
        self.logger.info(f"   Status: {response.status}")
        self.logger.info(f"   Size: {len(response.body)} bytes")
        self.logger.info(f"   Content-Type: {response.headers.get('content-type', b'').decode()}")
        
        if response.status == 200:
            try:
                # Check if we can access the text content now
                text_content = response.text
                self.logger.info(f"✅ Successfully decoded text content")
                self.logger.info(f"   Text length: {len(text_content)} characters")
                
                # Check for Fragrantica content
                if 'fragrantica' in text_content.lower():
                    self.logger.info(f"✅ Contains Fragrantica content")
                    
                    # Try to extract fragrance data
                    item = FragranceItem()
                    
                    # Extract title for verification
                    title = response.css('title::text').get()
                    if title:
                        self.logger.info(f"📄 Page title: {title}")
                    
                    # Try our fragrance selectors
                    name_selectors = [
                        'h1[itemprop="name"]::text',
                        'h1::text',
                        '.main-info h1::text',
                        'title::text'
                    ]
                    
                    for selector in name_selectors:
                        name = response.css(selector).get()
                        if name and name.strip():
                            self.logger.info(f"🌸 Found name with '{selector}': {name.strip()}")
                            item['name'] = name.strip()
                            break
                    
                    # Try brand selectors
                    brand_selectors = [
                        'span[itemprop="brand"]::text',
                        'a.brand-name::text',
                        '.brand-info a::text'
                    ]
                    
                    for selector in brand_selectors:
                        brand = response.css(selector).get()
                        if brand and brand.strip():
                            self.logger.info(f"🏷️ Found brand with '{selector}': {brand.strip()}")
                            item['brand'] = brand.strip()
                            break
                    
                    # Try rating selectors
                    rating_selectors = [
                        'span[itemprop="ratingValue"]::text',
                        '.rating-value::text',
                        '.stars-rating::text'
                    ]
                    
                    for selector in rating_selectors:
                        rating = response.css(selector).get()
                        if rating and rating.strip():
                            self.logger.info(f"⭐ Found rating with '{selector}': {rating.strip()}")
                            try:
                                item['rating_value'] = float(rating.strip().replace(',', '.'))
                            except:
                                item['rating_value'] = 4.0
                            break
                    
                    # Show HTML structure for debugging
                    self.logger.info(f"🔍 Sample HTML structure:")
                    h1_tags = response.css('h1').getall()
                    self.logger.info(f"   H1 tags found: {len(h1_tags)}")
                    for i, h1 in enumerate(h1_tags[:3]):  # Show first 3
                        self.logger.info(f"   H1[{i}]: {h1[:100]}...")
                    
                    # Check for specific Fragrantica elements
                    specific_elements = [
                        '.rating',
                        '.votes', 
                        '.brand',
                        '.main-info',
                        '.perfume-name'
                    ]
                    
                    for element in specific_elements:
                        found = response.css(element).get()
                        if found:
                            self.logger.info(f"🎯 Found element '{element}': {found[:100]}...")
                    
                    # If we got some data, yield the item
                    if item.get('name'):
                        self.logger.info(f"✅ Successfully extracted fragrance data!")
                        yield item
                    else:
                        self.logger.warning(f"⚠️ Could not extract fragrance name")
                
                else:
                    self.logger.warning(f"❌ No Fragrantica content found in text")
                    # Show a sample of what we got
                    sample = text_content[:500]
                    self.logger.info(f"📝 Content sample: {sample}")
                    
            except Exception as e:
                self.logger.error(f"❌ Error processing content: {e}")
                
        else:
            self.logger.warning(f"❌ Non-200 status: {response.status}")