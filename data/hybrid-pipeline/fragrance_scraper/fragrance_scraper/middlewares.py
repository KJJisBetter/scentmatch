# Define here the models for your spider middleware
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/spider-middleware.html

from scrapy import signals

# useful for handling different item types with a single interface
from itemadapter import ItemAdapter


class FragranceScraperSpiderMiddleware:
    # Not all methods need to be defined. If a method is not defined,
    # scrapy acts as if the spider middleware does not modify the
    # passed objects.

    @classmethod
    def from_crawler(cls, crawler):
        # This method is used by Scrapy to create your spiders.
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_spider_input(self, response, spider):
        # Called for each response that goes through the spider
        # middleware and into the spider.

        # Should return None or raise an exception.
        return None

    def process_spider_output(self, response, result, spider):
        # Called with the results returned from the Spider, after
        # it has processed the response.

        # Must return an iterable of Request, or item objects.
        for i in result:
            yield i

    def process_spider_exception(self, response, exception, spider):
        # Called when a spider or process_spider_input() method
        # (from other spider middleware) raises an exception.

        # Should return either None or an iterable of Request or item objects.
        pass

    async def process_start(self, start):
        # Called with an async iterator over the spider start() method or the
        # maching method of an earlier spider middleware.
        async for item_or_request in start:
            yield item_or_request

    def spider_opened(self, spider):
        spider.logger.info("Spider opened: %s" % spider.name)


class FragranceScraperDownloaderMiddleware:
    # Not all methods need to be defined. If a method is not defined,
    # scrapy acts as if the downloader middleware does not modify the
    # passed objects.

    @classmethod
    def from_crawler(cls, crawler):
        # This method is used by Scrapy to create your spiders.
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_request(self, request, spider):
        # Called for each request that goes through the downloader
        # middleware.

        # Must either:
        # - return None: continue processing this request
        # - or return a Response object
        # - or return a Request object
        # - or raise IgnoreRequest: process_exception() methods of
        #   installed downloader middleware will be called
        return None

    def process_response(self, request, response, spider):
        # Called with the response returned from the downloader.

        # Must either;
        # - return a Response object
        # - return a Request object
        # - or raise IgnoreRequest
        return response

    def process_exception(self, request, exception, spider):
        # Called when a download handler or a process_request()
        # (from other downloader middleware) raises an exception.

        # Must either:
        # - return None: continue processing this exception
        # - return a Response object: stops process_exception() chain
        # - return a Request object: stops process_exception() chain
        pass

    def spider_opened(self, spider):
        spider.logger.info("Spider opened: %s" % spider.name)


# =============================================================================
# ADVANCED ANTI-DETECTION MIDDLEWARE (2024-2025 Research-Backed)
# =============================================================================

import random
import time
import json
from scrapy.downloadermiddlewares.retry import RetryMiddleware
from scrapy.exceptions import IgnoreRequest

class StealthHeadersMiddleware:
    """Advanced stealth headers middleware for browser fingerprint masking"""
    
    def __init__(self):
        # Chrome-like header variations for different scenarios
        self.header_variants = {
            'chrome_desktop': {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'max-age=0',
                'sec-ch-ua': '"Google Chrome";v="120", "Chromium";v="120", "Not-A.Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            },
            'firefox_desktop': {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'max-age=0',
                'Upgrade-Insecure-Requests': '1',
                'TE': 'trailers',
            }
        }
    
    def process_request(self, request, spider):
        """Add stealth headers with randomization"""
        # Choose random header variant
        variant = random.choice(list(self.header_variants.keys()))
        headers = self.header_variants[variant].copy()
        
        # Add randomized viewport sizes (common desktop resolutions)
        viewports = ['1920,1080', '1366,768', '1536,864', '1440,900', '1280,720']
        
        # Add browser-specific headers
        if 'chrome' in variant:
            headers['sec-ch-viewport-width'] = random.choice(viewports).split(',')[0]
            headers['sec-ch-dpr'] = random.choice(['1', '1.25', '1.5', '2'])
        
        # Update request headers
        for key, value in headers.items():
            request.headers[key] = value
        
        # Add random referrer for some requests (simulate browsing)
        if random.random() < 0.3:  # 30% chance
            referrers = [
                'https://www.google.com/',
                'https://www.fragrantica.com/',
                'https://www.fragrantica.com/trending/',
            ]
            request.headers['Referer'] = random.choice(referrers)
        
        return None

class AntiDetectionMiddleware(RetryMiddleware):
    """Advanced anti-detection middleware with adaptive behavior"""
    
    def __init__(self, settings):
        super().__init__(settings)
        self.request_count = 0
        self.last_403_time = 0
        self.adaptive_delay = 10  # Start with base delay
        
    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler.settings)
    
    def process_request(self, request, spider):
        """Pre-process requests with adaptive anti-detection"""
        self.request_count += 1
        
        # Adaptive delay based on recent 403s
        current_time = time.time()
        if self.last_403_time > 0 and (current_time - self.last_403_time) < 300:  # 5 minutes
            # Increase delay if we got recent 403s
            self.adaptive_delay = min(30, self.adaptive_delay * 1.5)
            spider.logger.info(f"🔄 Adaptive delay increased to {self.adaptive_delay:.1f}s due to recent blocks")
        
        # Add session-like behavior (occasionally browse categories first)
        if self.request_count == 1 or random.random() < 0.1:  # 10% chance
            # Simulate browsing behavior by hitting homepage first
            request.meta['browse_first'] = True
        
        # Add request fingerprinting data
        request.meta['request_fingerprint'] = {
            'timestamp': current_time,
            'count': self.request_count,
            'adaptive_delay': self.adaptive_delay
        }
        
        return None
    
    def process_response(self, request, response, spider):
        """Process responses with anti-detection learning"""
        
        # Monitor for anti-bot indicators
        if response.status == 403:
            self.last_403_time = time.time()
            spider.logger.warning(f"🚫 403 Forbidden - adjusting behavior")
            
            # Exponentially increase delays for future requests
            self.adaptive_delay = min(60, self.adaptive_delay * 2)
            
        elif response.status == 429:
            self.last_403_time = time.time()
            spider.logger.warning(f"🚦 429 Rate Limited - backing off significantly")
            self.adaptive_delay = min(120, self.adaptive_delay * 3)
            
        elif response.status == 200:
            # Success - gradually reduce adaptive delay
            if self.adaptive_delay > 10:
                self.adaptive_delay = max(10, self.adaptive_delay * 0.9)
        
        # Check for anti-bot pages (common patterns) - handle binary responses
        if response.status == 200:
            try:
                body_text = response.text.lower()
                anti_bot_indicators = [
                    'access denied', 'bot detected', 'captcha', 'cloudflare',
                    'please wait', 'checking your browser', 'ray id'
                ]
                
                for indicator in anti_bot_indicators:
                    if indicator in body_text:
                        spider.logger.warning(f"🤖 Anti-bot page detected: {indicator}")
                        # Treat as soft block and retry with longer delay
                        self.adaptive_delay = min(90, self.adaptive_delay * 2)
                        return self.retry(request, f"Anti-bot page detected: {indicator}", spider)
            except (AttributeError, UnicodeDecodeError):
                # Handle binary responses or decode errors
                spider.logger.debug(f"📄 Binary or non-text response, skipping content check")
        
        return response
    
    def process_exception(self, request, exception, spider):
        """Handle connection exceptions with adaptive behavior"""
        spider.logger.warning(f"🔗 Connection exception: {exception}")
        
        # Increase delay for connection issues
        self.adaptive_delay = min(45, self.adaptive_delay * 1.2)
        
        return super().process_exception(request, exception, spider)
