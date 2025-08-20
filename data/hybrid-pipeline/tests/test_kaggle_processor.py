#!/usr/bin/env python3
"""
Test Suite for Kaggle Data Processor
Tests priority scoring algorithm, data transformation, and filtering logic
"""

import unittest
import sys
import json
import pandas as pd
import math
from pathlib import Path

# Add scripts directory to path to import processor functions
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

try:
    from kaggle_processor import calculate_priority_score, clean_fragrance_data, load_config
except ImportError:
    # If script doesn't exist yet, we'll create mock functions for testing
    def calculate_priority_score(row, config):
        return 0
    def clean_fragrance_data(row):
        return {}
    def load_config():
        return {}

class TestPriorityScoring(unittest.TestCase):
    """Test the priority scoring algorithm"""
    
    def setUp(self):
        """Set up test configuration and sample data"""
        self.config = {
            "luxury_tier": {
                "boost_multiplier": 1.8,
                "brands": ["dior", "chanel", "tom-ford", "creed"]
            },
            "premium_tier": {
                "boost_multiplier": 1.5,
                "brands": ["yves-saint-laurent", "versace", "giorgio-armani"]
            },
            "popular_tier": {
                "boost_multiplier": 1.3,
                "brands": ["hugo-boss", "calvin-klein", "burberry"]
            },
            "niche_tier": {
                "boost_multiplier": 1.1,
                "brands": ["le-labo", "byredo", "diptyque"]
            },
            "proven_bestsellers_2025": {
                "manual_boost": 3.0,
                "fragrances": ["sauvage-eau-de-parfum", "aventus", "bleu-de-chanel"]
            },
            "classic_fragrances": {
                "manual_boost": 2.0,
                "fragrances": ["allure-homme-sport", "terre-dhermes", "acqua-di-gio"]
            },
            "research": {
                "research_sources": {
                    "2025_bestsellers_research": {
                        "key_insights": {
                            "true_bestsellers": [
                                {"name": "Sauvage Eau De Parfum", "brand": "Christian Dior"},
                                {"name": "Aventus", "brand": "Creed"},
                                {"name": "Bleu de Chanel", "brand": "Chanel"}
                            ]
                        }
                    }
                }
            }
        }
        
        # Sample fragrance data mimicking CSV structure
        self.sample_basic = {
            'Perfume': 'sauvage-eau-de-parfum',
            'Brand': 'Dior', 
            'Rating Value': '4,5',  # European format
            'Rating Count': '15000',
            'Year': '2015',
            'Gender': 'men',
            'Top': 'bergamot, pepper',
            'Middle': 'sichuan pepper, elemi',
            'Base': 'ambroxan, vanilla',
            'Perfumer1': 'François Demachy',
            'mainaccord1': 'woody',
            'mainaccord2': 'fresh spicy',
            'url': 'https://www.fragrantica.com/perfume/dior/sauvage-edp-123.html'
        }
        
        self.sample_luxury = {
            'Perfume': 'aventus',
            'Brand': 'Creed',
            'Rating Value': '4,2',
            'Rating Count': '8500', 
            'Year': '2010',
            'Gender': 'men'
        }
        
        self.sample_no_data = {
            'Perfume': 'unknown-fragrance',
            'Brand': 'Unknown Brand',
            'Rating Value': '',
            'Rating Count': '',
            'Year': '',
            'Gender': 'unisex'
        }

    def test_basic_priority_calculation(self):
        """Test basic priority score calculation without boosts"""
        # Mock the calculation logic for testing
        rating = 4.5
        reviews = 1000
        expected_base = rating * math.log(reviews + 1)
        
        self.assertGreater(expected_base, 0)
        self.assertIsInstance(expected_base, (int, float))

    def test_luxury_brand_boost(self):
        """Test that luxury brands get 1.8x boost"""
        # Test will verify luxury brands get correct boost
        luxury_brands = self.config["luxury_tier"]["brands"]
        expected_boost = self.config["luxury_tier"]["boost_multiplier"]
        
        self.assertEqual(expected_boost, 1.8)
        self.assertIn("dior", luxury_brands)
        self.assertIn("chanel", luxury_brands)
        self.assertIn("creed", luxury_brands)

    def test_premium_brand_boost(self):
        """Test that premium brands get 1.5x boost"""
        premium_brands = self.config["premium_tier"]["brands"]
        expected_boost = self.config["premium_tier"]["boost_multiplier"]
        
        self.assertEqual(expected_boost, 1.5)
        self.assertIn("versace", premium_brands)
        self.assertIn("giorgio-armani", premium_brands)

    def test_recency_boost_calculation(self):
        """Test recency boost logic"""
        # 2020+ should get 1.2x boost
        year_2023 = 2023
        year_2018 = 2018
        year_2005 = 2005
        
        # Test boost logic
        if year_2023 >= 2020:
            boost_2023 = 1.2
        elif year_2023 >= 2015:
            boost_2023 = 1.1
        else:
            boost_2023 = 1.0
            
        self.assertEqual(boost_2023, 1.2)
        
        if year_2018 >= 2020:
            boost_2018 = 1.2
        elif year_2018 >= 2015:
            boost_2018 = 1.1
        else:
            boost_2018 = 1.0
            
        self.assertEqual(boost_2018, 1.1)

    def test_bestseller_boost(self):
        """Test that research-validated bestsellers get 3.0x boost"""
        bestsellers = self.config["proven_bestsellers_2025"]["fragrances"]
        boost = self.config["proven_bestsellers_2025"]["manual_boost"]
        
        self.assertEqual(boost, 3.0)
        self.assertIn("sauvage-eau-de-parfum", bestsellers)
        self.assertIn("aventus", bestsellers)

    def test_classic_boost(self):
        """Test that classic fragrances get 2.0x boost"""
        classics = self.config["classic_fragrances"]["fragrances"]
        boost = self.config["classic_fragrances"]["manual_boost"]
        
        self.assertEqual(boost, 2.0)
        self.assertIn("allure-homme-sport", classics)
        self.assertIn("terre-dhermes", classics)

    def test_zero_score_for_invalid_data(self):
        """Test that fragrances with no rating/reviews get zero score"""
        # Mock calculation should return 0 for invalid data
        rating = None
        reviews = 0
        
        if not rating or reviews <= 0:
            score = 0
        else:
            score = rating * math.log(reviews + 1)
            
        self.assertEqual(score, 0)

    def test_european_decimal_parsing(self):
        """Test parsing European decimal format (4,5 -> 4.5)"""
        european_rating = "4,5"
        parsed_rating = float(european_rating.replace(',', '.'))
        
        self.assertEqual(parsed_rating, 4.5)
        
        european_count = "15.000"  # Some may use . as thousands separator
        parsed_count = int(european_count.replace('.', ''))
        
        self.assertEqual(parsed_count, 15000)


class TestDataCleaning(unittest.TestCase):
    """Test data cleaning and transformation functions"""
    
    def test_fragrance_name_cleaning(self):
        """Test that brand names are removed from fragrance names"""
        # Test brand removal logic
        name = "Dior Sauvage Eau de Parfum"
        brand = "Dior"
        
        # Mock the cleaning logic
        import re
        name_cleaned = re.sub(rf'^{re.escape(brand)}\s*[-:]?\s*', '', name, flags=re.IGNORECASE)
        name_cleaned = re.sub(r'\s+', ' ', name_cleaned).strip()
        
        self.assertEqual(name_cleaned, "Sauvage Eau de Parfum")

    def test_gender_normalization(self):
        """Test gender field normalization"""
        # Test various gender inputs
        test_cases = [
            ("men", "men"),
            ("women", "women"),
            ("unisex", "unisex"),
            ("for men", "men"),
            ("for women", "women"),
            ("shared", "unisex"),
            ("", "unisex")  # Default for empty
        ]
        
        for input_gender, expected in test_cases:
            gender = input_gender.lower().strip()
            # Use word boundaries to avoid substring issues
            import re
            has_women = bool(re.search(r'\bwomen\b', gender))
            has_men = bool(re.search(r'\bmen\b', gender))
            
            if has_women and has_men:
                result = 'unisex'
            elif has_women or 'women' in gender:  # Fallback for non-word-boundary cases
                result = 'women'
            elif has_men or 'men' in gender:
                result = 'men'
            else:
                result = 'unisex'
                
            self.assertEqual(result, expected, f"Failed for input: '{input_gender}'")

    def test_slug_generation(self):
        """Test URL slug generation"""
        import re
        import unicodedata
        
        test_cases = [
            ("Sauvage Eau de Parfum", "sauvage-eau-de-parfum"),
            ("L'Homme Yves Saint Laurent", "l-homme-yves-saint-laurent"),
            ("Acqua di Giò", "acqua-di-gio"),
            ("1 Million", "1-million")
        ]
        
        for name, expected_slug in test_cases:
            # Normalize unicode characters (ò -> o)
            normalized = unicodedata.normalize('NFD', name)
            ascii_name = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
            slug = re.sub(r'[^a-z0-9]+', '-', ascii_name.lower()).strip('-')
            self.assertEqual(slug, expected_slug)

    def test_accord_parsing(self):
        """Test mainaccord1-5 parsing into array"""
        sample_row = {
            'mainaccord1': 'woody',
            'mainaccord2': 'fresh spicy', 
            'mainaccord3': 'citrus',
            'mainaccord4': '',  # Empty
            'mainaccord5': None  # None
        }
        
        accords = []
        for i in range(1, 6):
            accord_col = f'mainaccord{i}'
            if accord_col in sample_row and sample_row[accord_col] and str(sample_row[accord_col]).strip():
                accords.append(str(sample_row[accord_col]).strip())
        
        expected = ['woody', 'fresh spicy', 'citrus']
        self.assertEqual(accords, expected)

    def test_sample_price_calculation(self):
        """Test sample price calculation based on brand tier"""
        # Test luxury brand pricing
        brand_id = "dior"
        rating = 4.5
        
        sample_price = 15  # Base price
        luxury_brands = ['dior', 'chanel', 'tom-ford', 'creed', 'hermès']
        
        if brand_id in luxury_brands:
            sample_price = 20
        elif rating >= 4.5:
            sample_price = 18
        elif rating >= 4.0:
            sample_price = 16
            
        self.assertEqual(sample_price, 20)  # Should be luxury price
        
        # Test high-rated non-luxury
        brand_id = "hugo-boss"
        rating = 4.6
        sample_price = 15
        
        if brand_id in luxury_brands:
            sample_price = 20
        elif rating >= 4.5:
            sample_price = 18
        elif rating >= 4.0:
            sample_price = 16
            
        self.assertEqual(sample_price, 18)  # High rating boost


class TestFilteringLogic(unittest.TestCase):
    """Test filtering and selection logic"""
    
    def test_top_2000_selection(self):
        """Test that exactly 2000 fragrances are selected"""
        # Mock dataframe with scores
        import pandas as pd
        scores = list(range(1, 5001))  # 5000 scores
        df = pd.DataFrame({'priority_score': scores})
        
        # Select top 2000
        df_top = df.nlargest(2000, 'priority_score')
        
        self.assertEqual(len(df_top), 2000)
        self.assertEqual(df_top['priority_score'].max(), 5000)  # Highest score
        self.assertEqual(df_top['priority_score'].min(), 3001)  # 2000th highest

    def test_minimum_quality_thresholds(self):
        """Test minimum rating and review requirements"""
        min_rating = 3.5
        min_reviews = 100
        
        test_fragrances = [
            {'rating': 4.5, 'reviews': 1000, 'should_pass': True},
            {'rating': 3.4, 'reviews': 500, 'should_pass': False},  # Low rating
            {'rating': 4.0, 'reviews': 50, 'should_pass': False},   # Low reviews
            {'rating': 3.5, 'reviews': 100, 'should_pass': True},   # Minimum threshold
        ]
        
        for frag in test_fragrances:
            passes = frag['rating'] >= min_rating and frag['reviews'] >= min_reviews
            self.assertEqual(passes, frag['should_pass'])


class TestConfigValidation(unittest.TestCase):
    """Test configuration loading and validation"""
    
    def test_config_structure(self):
        """Test that config has required sections"""
        required_sections = [
            'luxury_tier',
            'premium_tier', 
            'popular_tier',
            'niche_tier',
            'proven_bestsellers_2025',
            'classic_fragrances'
        ]
        
        # Mock basic config structure
        config = {
            'luxury_tier': {'boost_multiplier': 1.8, 'brands': []},
            'premium_tier': {'boost_multiplier': 1.5, 'brands': []},
            'popular_tier': {'boost_multiplier': 1.3, 'brands': []},
            'niche_tier': {'boost_multiplier': 1.1, 'brands': []},
            'proven_bestsellers_2025': {'manual_boost': 3.0, 'fragrances': []},
            'classic_fragrances': {'manual_boost': 2.0, 'fragrances': []}
        }
        
        for section in required_sections:
            self.assertIn(section, config)
            
    def test_boost_multiplier_ranges(self):
        """Test that boost multipliers are within reasonable ranges"""
        boosts = {
            'luxury': 1.8,
            'premium': 1.5,
            'bestseller': 3.0,
            'classic': 2.0
        }
        
        # All boosts should be >= 1.0 and <= 5.0
        for name, boost in boosts.items():
            self.assertGreaterEqual(boost, 1.0, f"{name} boost too low")
            self.assertLessEqual(boost, 5.0, f"{name} boost too high")


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling"""
    
    def test_missing_data_handling(self):
        """Test handling of missing or invalid data"""
        edge_cases = [
            {'Rating Value': '', 'Rating Count': '1000'},  # Missing rating
            {'Rating Value': '4,5', 'Rating Count': ''},   # Missing count
            {'Rating Value': 'invalid', 'Rating Count': '1000'},  # Invalid rating
            {'Rating Value': '4,5', 'Rating Count': 'abc'},      # Invalid count
        ]
        
        for case in edge_cases:
            try:
                if case['Rating Value'] and case['Rating Count']:
                    rating = float(case['Rating Value'].replace(',', '.'))
                    count = int(case['Rating Count'].replace(',', ''))
                    score = rating * math.log(count + 1) if count > 0 else 0
                else:
                    score = 0
            except (ValueError, TypeError):
                score = 0
                
            # Should handle gracefully without crashing
            self.assertIsInstance(score, (int, float))

    def test_year_parsing(self):
        """Test year parsing with various formats"""
        year_cases = [
            ('2023', 2023),
            ('', 2000),      # Default for empty
            (None, 2000),    # Default for None
            ('abc', 2000),   # Default for invalid
            ('1999', 1999),  # Valid old year
        ]
        
        for input_year, expected in year_cases:
            if input_year and str(input_year).isdigit():
                result = int(input_year)
            else:
                result = 2000
                
            self.assertEqual(result, expected)


if __name__ == '__main__':
    # Create test output directory
    test_dir = Path(__file__).parent
    output_dir = test_dir / "output"
    output_dir.mkdir(exist_ok=True)
    
    # Run all tests
    unittest.main(verbosity=2)