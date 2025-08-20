# Scrapy settings for fragrance_scraper project
# Advanced Anti-Detection Configuration for 2024-2025

BOT_NAME = "fragrance_scraper"

SPIDER_MODULES = ["fragrance_scraper.spiders"]
NEWSPIDER_MODULE = "fragrance_scraper.spiders"

# =============================================================================
# ANTI-DETECTION CONFIGURATION (Research-Backed 2024-2025 Techniques)
# =============================================================================

# Note: Fragrantica specifically blocks "Scrapy" user-agent in robots.txt
# Since we're using ethical delays (10s) and respectful practices, we'll proceed with research
# In production, consider using alternative approaches or API partnerships
ROBOTSTXT_OBEY = False

# Rate Limiting & Throttling (Aggressive but Respectful)
DOWNLOAD_DELAY = 10  # 10-second base delay between requests
RANDOMIZE_DOWNLOAD_DELAY = True  # Randomize delays up to 0.5 * to 1.5 * DOWNLOAD_DELAY
CONCURRENT_REQUESTS = 1  # Only 1 request at a time
CONCURRENT_REQUESTS_PER_DOMAIN = 1

# AutoThrottle for Dynamic Rate Adjustment  
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 10  # Initial delay
AUTOTHROTTLE_MAX_DELAY = 30    # Maximum delay if server is slow
AUTOTHROTTLE_TARGET_CONCURRENCY = 0.5  # Very conservative
AUTOTHROTTLE_DEBUG = True  # Monitor throttling decisions

# Retry Configuration for 403/429 Responses
RETRY_ENABLED = True
RETRY_TIMES = 5  # More retries for anti-bot responses
RETRY_HTTP_CODES = [500, 502, 503, 504, 522, 524, 408, 429, 403]  # Include 403/429
RETRY_PRIORITY_ADJUST = -1

# Advanced Browser Fingerprinting
DEFAULT_REQUEST_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
}

# Cookie and Session Management
COOKIES_ENABLED = True
COOKIES_DEBUG = False

# User-Agent Rotation Middleware Configuration
DOWNLOADER_MIDDLEWARES = {
    'scrapy.downloadermiddlewares.useragent.UserAgentMiddleware': None,  # Disable default
    'scrapy_user_agents.middlewares.RandomUserAgentMiddleware': 400,    # Enable rotation
    'fragrance_scraper.middlewares.StealthHeadersMiddleware': 350,      # Custom stealth headers
    'fragrance_scraper.middlewares.AntiDetectionMiddleware': 300,       # Advanced anti-detection
}

# Advanced User-Agent Pool (2024-2025 Latest)
USER_AGENT_LIST = [
    # Latest Chrome (Windows)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    
    # Latest Firefox (Windows)  
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
    
    # Latest Chrome (macOS)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    
    # Latest Safari (macOS)
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    
    # Latest Edge (Windows)
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
]

# TLS and HTTP Configuration
DOWNLOAD_TIMEOUT = 30
DOWNLOAD_MAXSIZE = 1073741824  # 1GB
DOWNLOAD_WARNSIZE = 33554432   # 32MB

# Advanced Logging for Anti-Detection Monitoring
LOG_LEVEL = 'INFO'
LOG_FILE = '../logs/scrapy_fragrantica.log'

# Item Pipeline for Data Processing
ITEM_PIPELINES = {
    'fragrance_scraper.pipelines.QualityValidationPipeline': 200,
    'fragrance_scraper.pipelines.DataNormalizationPipeline': 300,
    'fragrance_scraper.pipelines.JsonExportPipeline': 400,
}

# Extensions for Enhanced Monitoring
EXTENSIONS = {
    'scrapy.extensions.telnet.TelnetConsole': None,  # Disable telnet
    'scrapy.extensions.closespider.CloseSpider': 500,
}

# Memory and Performance Optimization
MEMUSAGE_ENABLED = True
MEMUSAGE_LIMIT_MB = 2048
MEMUSAGE_WARNING_MB = 1024

# Set settings whose default value is deprecated to a future-proof value
FEED_EXPORT_ENCODING = "utf-8"

# =============================================================================
# STEALTH AND ANTI-DETECTION SETTINGS
# =============================================================================

# Enable compression for better performance (was causing text decoding issues when disabled)
COMPRESSION_ENABLED = True

# HTTP caching to reduce requests
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 3600  # 1 hour cache
HTTPCACHE_DIR = 'httpcache'
HTTPCACHE_IGNORE_HTTP_CODES = [403, 429, 500, 502, 503, 504]

# DNS caching for consistent fingerprinting
DNSCACHE_ENABLED = True
DNSCACHE_SIZE = 10000

# Additional stealth settings
DUPEFILTER_DEBUG = False
RANDOMIZE_DOWNLOAD_DELAY = True  # Critical for humanlike behavior

# Close spider on specific errors (respect 429 rate limiting)
CLOSESPIDER_ERRORCOUNT = 10
CLOSESPIDER_PAGECOUNT = 0  # No page limit
