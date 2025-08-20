#!/usr/bin/env python3
"""
Perfect Brands Data with Industry Standards
Apply professional brand formatting based on FragranceX/FragranceNet research
"""

import json
import os

def perfect_brands_data():
    """Apply industry-standard brand formatting"""
    
    # Load brand data
    input_file = 'output/brands_final_20250819_142442.json'
    
    with open(input_file, 'r', encoding='utf-8') as f:
        brands = json.load(f)
    
    print(f"📊 Perfecting {len(brands)} brands...")
    
    # Brand formatting standards
    brand_display_names = {
        'creed': 'Creed',
        'tom-ford': 'Tom Ford', 
        'dior': 'Christian Dior',
        'chanel': 'Chanel',
        'yves-saint-laurent': 'Yves Saint Laurent',
        'giorgio-armani': 'Giorgio Armani',
        'dolce-gabbana': 'Dolce & Gabbana',
        'calvin-klein': 'Calvin Klein',
        'paco-rabanne': 'Paco Rabanne',
        'jean-paul-gaultier': 'Jean Paul Gaultier',
        'guerlain': 'Guerlain',
        'hermès': 'Hermès',
        'givenchy': 'Givenchy',
        'versace': 'Versace',
        'hugo-boss': 'Hugo Boss',
        'ralph-lauren': 'Ralph Lauren',
        'burberry': 'Burberry',
        'montblanc': 'Montblanc',
        'valentino': 'Valentino',
        'bottega-veneta': 'Bottega Veneta',
        'by-kilian': 'By Kilian',
        'amouage': 'Amouage',
        'maison-margiela': 'Maison Margiela',
        'le-labo': 'Le Labo',
        'diptyque': 'Diptyque',
        'carolina-herrera': 'Carolina Herrera',
        'escentric-molecules': 'Escentric Molecules',
        'juliette-has-a-gun': 'Juliette Has A Gun',
        'comme-des-garcons': 'Comme des Garçons'
    }
    
    # Brand tier classifications
    brand_tiers = {
        'luxury': ['creed', 'tom-ford', 'amouage', 'clive-christian', 'roja-dove'],
        'premium': ['dior', 'chanel', 'guerlain', 'hermès', 'yves-saint-laurent', 'givenchy'],
        'niche': ['le-labo', 'diptyque', 'maison-margiela', 'escentric-molecules', 'by-kilian', 'juliette-has-a-gun', 'comme-des-garcons'],
        'celebrity': ['ariana-grande', 'britney-spears', 'jennifer-lopez', 'kim-kardashian'],
        'designer': []  # Default for all others
    }
    
    # Perfect each brand
    perfected_brands = []
    
    for brand in brands:
        perfected = brand.copy()
        
        brand_id = brand.get('id', '')
        
        # Add display name
        perfected['display_name'] = brand_display_names.get(brand_id, 
                                    brand.get('name', brand_id).replace('-', ' ').title())
        
        # Add brand tier
        tier = 'designer'  # Default
        for tier_name, tier_brands in brand_tiers.items():
            if brand_id in tier_brands:
                tier = tier_name
                break
        
        perfected['brand_tier'] = tier
        
        # Add prestige score
        prestige_scores = {
            'luxury': 1.20, 'premium': 1.15, 'niche': 1.18,
            'designer': 1.10, 'celebrity': 0.95, 'mass': 1.0
        }
        perfected['prestige_score'] = prestige_scores.get(tier, 1.0)
        
        # Ensure required fields
        perfected['is_active'] = True
        perfected['affiliate_supported'] = False
        perfected['sample_availability_score'] = 85 if tier in ['luxury', 'premium'] else 70
        
        perfected_brands.append(perfected)
    
    # Save perfected brands
    output_file = 'output/brands_industry_perfected.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(perfected_brands, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Perfected {len(perfected_brands)} brands")
    print(f"💾 Saved to: {output_file}")
    
    return perfected_brands

if __name__ == '__main__':
    perfect_brands_data()