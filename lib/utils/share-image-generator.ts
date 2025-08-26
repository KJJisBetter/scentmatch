import type { ShareableData } from '@/lib/services/social-sharing';
import type { SharePlatform } from '@/lib/types/collection-analytics';

/**
 * Share Image Generator Utility - Task 3.1 (Phase 1C)
 * 
 * Generates beautiful, platform-optimized images for social sharing.
 * Creates visual cards for collections and quiz results with branding.
 * 
 * Features:
 * - Platform-specific dimensions and styling
 * - Multiple themes and layouts
 * - HTML/CSS to image conversion
 * - Fragrance imagery integration
 * - Brand-consistent design system
 * - Performance optimized generation
 */

interface ImageGenerationConfig {
  width: number;
  height: number;
  platform: SharePlatform;
  theme: 'personality' | 'recommendations' | 'insights' | 'collection';
  data: ShareableData;
  branding?: {
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
  };
}

interface GeneratedImage {
  success: boolean;
  image_url?: string;
  image_data?: string; // base64 data URL
  error?: string;
  generation_time_ms?: number;
}

export class ShareImageGenerator {
  private static instance: ShareImageGenerator;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    // Initialize canvas in browser environment
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  static getInstance(): ShareImageGenerator {
    if (!ShareImageGenerator.instance) {
      ShareImageGenerator.instance = new ShareImageGenerator();
    }
    return ShareImageGenerator.instance;
  }

  /**
   * Generate platform-optimized sharing image
   */
  async generateImage(config: ImageGenerationConfig): Promise<GeneratedImage> {
    const startTime = performance.now();

    try {
      // Validate config
      if (!this.validateConfig(config)) {
        return {
          success: false,
          error: 'Invalid image generation configuration'
        };
      }

      // Generate image based on method available
      let result: GeneratedImage;

      if (typeof window !== 'undefined' && this.canvas && this.ctx) {
        // Client-side generation with Canvas API
        result = await this.generateWithCanvas(config);
      } else {
        // Server-side generation with HTML/CSS approach
        result = await this.generateWithHTML(config);
      }

      const endTime = performance.now();
      result.generation_time_ms = Math.round(endTime - startTime);

      return result;

    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: 'Failed to generate sharing image',
        generation_time_ms: Math.round(performance.now() - startTime)
      };
    }
  }

  /**
   * Generate image using Canvas API (client-side)
   */
  private async generateWithCanvas(config: ImageGenerationConfig): Promise<GeneratedImage> {
    if (!this.canvas || !this.ctx) {
      throw new Error('Canvas not available');
    }

    const { width, height, theme, data } = config;
    
    // Set canvas dimensions
    this.canvas.width = width;
    this.canvas.height = height;

    // Get theme styling
    const themeColors = this.getThemeColors(theme);
    
    // Create gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, themeColors.primary);
    gradient.addColorStop(0.5, themeColors.secondary);
    gradient.addColorStop(1, themeColors.accent);

    // Fill background
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    // Add content based on data type
    if (data.collection_data) {
      await this.drawCollectionContent(config);
    } else if (data.quiz_session_token) {
      await this.drawQuizResultsContent(config);
    }

    // Add branding
    await this.drawBranding(config);

    // Convert to data URL
    const imageData = this.canvas.toDataURL('image/png', 0.9);

    return {
      success: true,
      image_data: imageData
    };
  }

  /**
   * Generate image using HTML/CSS approach (server-side compatible)
   */
  private async generateWithHTML(config: ImageGenerationConfig): Promise<GeneratedImage> {
    const { width, height, theme, data, platform } = config;

    // Generate HTML template
    const htmlTemplate = this.generateHTMLTemplate(config);

    // In a real implementation, this would use:
    // - Puppeteer for server-side HTML to image
    // - html2canvas for client-side conversion
    // - Third-party service like Bannerbear or Placid

    // For now, return a placeholder implementation
    const placeholderUrl = this.generatePlaceholderImage(config);

    return {
      success: true,
      image_url: placeholderUrl
    };
  }

  /**
   * Draw collection content on canvas
   */
  private async drawCollectionContent(config: ImageGenerationConfig): Promise<void> {
    if (!this.ctx || !config.data.collection_data) return;

    const { width, height } = config;
    const { collection_summary, user_name } = config.data.collection_data;

    // Set text properties
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText(`${user_name}'s Collection`, width / 2, 80);

    // Collection stats
    this.ctx.font = '24px Arial';
    this.ctx.fillText(
      `${collection_summary.total_items} Fragrances • ${collection_summary.dominant_families.slice(0, 2).join(' & ')}`,
      width / 2,
      140
    );

    // Top fragrances (simplified text representation)
    let yPos = 200;
    collection_summary.top_fragrances.slice(0, 3).forEach((fragrance, index) => {
      this.ctx!.font = '18px Arial';
      this.ctx!.fillText(
        `${index + 1}. ${fragrance.name} by ${fragrance.brand}`,
        width / 2,
        yPos
      );
      yPos += 40;
    });

    // Personality traits
    if (collection_summary.personality_traits) {
      this.ctx.font = '20px Arial';
      this.ctx.fillText(
        `Style: ${collection_summary.personality_traits.slice(0, 2).join(' & ')}`,
        width / 2,
        yPos + 40
      );
    }
  }

  /**
   * Draw quiz results content on canvas
   */
  private async drawQuizResultsContent(config: ImageGenerationConfig): Promise<void> {
    if (!this.ctx || !config.data.recommendations) return;

    const { width, height } = config;
    const { recommendations, personality_summary } = config.data;

    // Set text properties
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';

    // Title
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillText('My Fragrance Quiz Results', width / 2, 80);

    // Accuracy score
    if (personality_summary) {
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText(`${personality_summary.confidence}%`, width / 2, 160);
      
      this.ctx.font = '20px Arial';
      this.ctx.fillText('Match Accuracy', width / 2, 190);
    }

    // Top recommendations
    let yPos = 250;
    (recommendations || []).slice(0, 3).forEach((rec: any, index: number) => {
      this.ctx!.font = '18px Arial';
      const matchScore = Math.round((rec.score || 0) * 100);
      this.ctx!.fillText(
        `${index + 1}. ${rec.name} - ${matchScore}% match`,
        width / 2,
        yPos
      );
      yPos += 35;
    });

    // Personality traits
    if (personality_summary?.traits) {
      this.ctx.font = '22px Arial';
      this.ctx.fillText(
        `Personality: ${personality_summary.traits.slice(0, 2).join(' & ')}`,
        width / 2,
        yPos + 40
      );
    }
  }

  /**
   * Draw branding elements
   */
  private async drawBranding(config: ImageGenerationConfig): Promise<void> {
    if (!this.ctx) return;

    const { width, height } = config;

    // ScentMatch branding at bottom
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ScentMatch', width / 2, height - 60);

    this.ctx.font = '16px Arial';
    this.ctx.fillText('Find Your Signature Scent', width / 2, height - 35);

    this.ctx.font = '14px Arial';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.fillText('scentmatch.com • Free AI Fragrance Quiz', width / 2, height - 15);
  }

  /**
   * Generate HTML template for server-side image generation
   */
  private generateHTMLTemplate(config: ImageGenerationConfig): string {
    const { width, height, theme, data } = config;
    const themeColors = this.getThemeColors(theme);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: ${width}px;
              height: ${height}px;
              background: linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary}, ${themeColors.accent});
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              color: white;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 40px;
            }
            .header { text-align: center; }
            .title { font-size: 36px; font-weight: bold; margin-bottom: 20px; }
            .subtitle { font-size: 20px; opacity: 0.9; }
            .content { flex: 1; display: flex; flex-direction: column; justify-content: center; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; }
            .stat-label { font-size: 16px; opacity: 0.8; }
            .footer { text-align: center; opacity: 0.9; }
            .brand { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .tagline { font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${this.getImageTitle(config)}</div>
            <div class="subtitle">${this.getImageSubtitle(config)}</div>
          </div>
          
          <div class="content">
            ${this.getImageContent(config)}
          </div>
          
          <div class="footer">
            <div class="brand">ScentMatch</div>
            <div class="tagline">Find Your Signature Scent • scentmatch.com</div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get theme color palette
   */
  private getThemeColors(theme: string): { primary: string; secondary: string; accent: string } {
    switch (theme) {
      case 'personality':
        return { primary: '#8B5CF6', secondary: '#EC4899', accent: '#EF4444' };
      case 'recommendations':
        return { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#EC4899' };
      case 'insights':
        return { primary: '#10B981', secondary: '#3B82F6', accent: '#8B5CF6' };
      case 'collection':
      default:
        return { primary: '#8B5CF6', secondary: '#EC4899', accent: '#F59E0B' };
    }
  }

  /**
   * Get platform-specific image title
   */
  private getImageTitle(config: ImageGenerationConfig): string {
    const { theme, data } = config;
    
    if (data.collection_data) {
      return `${data.collection_data.user_name}'s Fragrance Collection`;
    }
    
    if (data.quiz_session_token) {
      switch (theme) {
        case 'personality':
          return 'My Fragrance Personality';
        case 'recommendations':
          return 'My Perfect Matches';
        case 'insights':
          return 'My Scent Profile Insights';
        default:
          return 'My Quiz Results';
      }
    }
    
    return 'ScentMatch Results';
  }

  /**
   * Get platform-specific image subtitle
   */
  private getImageSubtitle(config: ImageGenerationConfig): string {
    const { data } = config;
    
    if (data.collection_data) {
      const summary = data.collection_data.collection_summary;
      return `${summary.total_items} Carefully Curated Fragrances`;
    }
    
    if (data.personality_summary) {
      return `${data.personality_summary.confidence}% Match Accuracy`;
    }
    
    return 'Discover Your Signature Scent';
  }

  /**
   * Get image content HTML
   */
  private getImageContent(config: ImageGenerationConfig): string {
    const { data } = config;

    if (data.collection_data) {
      const summary = data.collection_data.collection_summary;
      return `
        <div class="stats">
          <div>
            <div class="stat-value">${summary.total_items}</div>
            <div class="stat-label">Fragrances</div>
          </div>
          <div>
            <div class="stat-value">${summary.dominant_families.length}</div>
            <div class="stat-label">Families</div>
          </div>
          <div>
            <div class="stat-value">${summary.top_fragrances.length}</div>
            <div class="stat-label">Favorites</div>
          </div>
        </div>
      `;
    }

    if (data.personality_summary) {
      return `
        <div class="stats">
          <div>
            <div class="stat-value">${data.recommendations?.length || 0}</div>
            <div class="stat-label">Matches</div>
          </div>
          <div>
            <div class="stat-value">${data.personality_summary.confidence}%</div>
            <div class="stat-label">Accuracy</div>
          </div>
          <div>
            <div class="stat-value">${data.personality_summary.traits.length}</div>
            <div class="stat-label">Traits</div>
          </div>
        </div>
      `;
    }

    return '<div class="stats"><div><div class="stat-value">✨</div><div class="stat-label">Discover Your Scent</div></div></div>';
  }

  /**
   * Generate placeholder image URL for development
   */
  private generatePlaceholderImage(config: ImageGenerationConfig): string {
    const { width, height, theme, data } = config;
    const themeColors = this.getThemeColors(theme);
    
    // Use placeholder service with ScentMatch branding
    const backgroundColor = encodeURIComponent(themeColors.primary.replace('#', ''));
    const textColor = 'FFFFFF';
    
    let text = 'ScentMatch';
    if (data.collection_data) {
      text = `${data.collection_data.user_name}'s Collection`;
    } else if (data.quiz_session_token) {
      text = 'Quiz Results';
    }

    return `https://via.placeholder.com/${width}x${height}/${backgroundColor}/${textColor}?text=${encodeURIComponent(text)}`;
  }

  /**
   * Validate image generation configuration
   */
  private validateConfig(config: ImageGenerationConfig): boolean {
    const { width, height, platform, data } = config;

    // Check dimensions
    if (width <= 0 || height <= 0 || width > 2000 || height > 2000) {
      return false;
    }

    // Check platform
    if (!['twitter', 'instagram', 'facebook', 'direct_link'].includes(platform)) {
      return false;
    }

    // Check data
    if (!data.collection_data && !data.quiz_session_token) {
      return false;
    }

    return true;
  }

  /**
   * Get optimal dimensions for platform
   */
  static getOptimalDimensions(platform: SharePlatform): { width: number; height: number } {
    switch (platform) {
      case 'twitter':
        return { width: 1200, height: 675 }; // Twitter card 16:9
      case 'instagram':
        return { width: 1080, height: 1080 }; // Instagram square
      case 'facebook':
        return { width: 1200, height: 630 }; // Facebook link preview
      case 'direct_link':
      default:
        return { width: 1200, height: 630 }; // General social media
    }
  }

  /**
   * Generate multiple sizes for different platforms
   */
  async generateMultiPlatformImages(
    data: ShareableData,
    theme = 'collection',
    platforms: SharePlatform[] = ['twitter', 'instagram', 'facebook']
  ): Promise<Record<SharePlatform, GeneratedImage>> {
    const results: Record<string, GeneratedImage> = {};

    const generationPromises = platforms.map(async (platform) => {
      const dimensions = ShareImageGenerator.getOptimalDimensions(platform);
      
      const config: ImageGenerationConfig = {
        ...dimensions,
        platform,
        theme: theme as any,
        data,
        branding: {
          primary_color: '#8B5CF6',
          secondary_color: '#EC4899'
        }
      };

      const result = await this.generateImage(config);
      return { platform, result };
    });

    const platformResults = await Promise.all(generationPromises);
    
    platformResults.forEach(({ platform, result }) => {
      results[platform] = result;
    });

    return results as Record<SharePlatform, GeneratedImage>;
  }
}

// Utility functions for share image generation
export const shareImageUtils = {
  /**
   * Get platform-specific sharing best practices
   */
  getPlatformBestPractices: (platform: SharePlatform) => {
    switch (platform) {
      case 'twitter':
        return {
          image_ratio: '16:9',
          max_text_length: 280,
          hashtag_limit: 5,
          best_times: ['9-10 AM', '12-1 PM', '5-6 PM'],
          tips: ['Use 1-2 hashtags max', 'Include compelling visuals', 'Ask questions to drive engagement']
        };
        
      case 'instagram':
        return {
          image_ratio: '1:1',
          max_text_length: 2200,
          hashtag_limit: 30,
          best_times: ['11 AM-1 PM', '7-9 PM'],
          tips: ['Use all 30 hashtags', 'Stories for temporary content', 'Include call-to-action in bio']
        };
        
      case 'facebook':
        return {
          image_ratio: '1.91:1',
          max_text_length: 63206,
          hashtag_limit: 5,
          best_times: ['1-3 PM', '8-9 PM'],
          tips: ['Longer posts perform better', 'Ask questions', 'Share personal stories']
        };
        
      default:
        return {
          image_ratio: '1.91:1',
          max_text_length: 500,
          hashtag_limit: 3,
          best_times: ['Various'],
          tips: ['Keep it concise', 'Include clear call-to-action']
        };
    }
  },

  /**
   * Optimize sharing content for platform
   */
  optimizeForPlatform: (
    content: string,
    platform: SharePlatform,
    hashtags: string[] = []
  ): { text: string; hashtags: string[]; truncated: boolean } => {
    const practices = shareImageUtils.getPlatformBestPractices(platform);
    let optimizedText = content;
    let truncated = false;

    // Optimize hashtags for platform
    const optimizedHashtags = hashtags.slice(0, practices.hashtag_limit);

    // Handle text length limits
    const hashtagText = optimizedHashtags.map(tag => `#${tag}`).join(' ');
    const availableLength = practices.max_text_length - hashtagText.length - 1; // -1 for space

    if (optimizedText.length > availableLength) {
      optimizedText = optimizedText.substring(0, availableLength - 3) + '...';
      truncated = true;
    }

    return {
      text: optimizedText + (hashtagText ? ` ${hashtagText}` : ''),
      hashtags: optimizedHashtags,
      truncated
    };
  },

  /**
   * Generate viral-optimized sharing content
   */
  generateViralContent: (
    shareData: ShareableData,
    platform: SharePlatform
  ): { text: string; hashtags: string[]; call_to_action: string } => {
    let baseText = '';
    let hashtags: string[] = [];
    let callToAction = '';

    if (shareData.collection_data) {
      const summary = shareData.collection_data.collection_summary;
      baseText = `Just curated my dream fragrance collection! 🌸 ${summary.total_items} scents featuring ${summary.dominant_families.slice(0, 2).join(' & ')} favorites. Each one perfectly matched to my personality!`;
      hashtags = ['ScentMatch', 'FragranceCollection', 'SignatureScent', 'PerfumeLover'];
      callToAction = 'What would your perfect fragrance collection look like? Take the quiz and find out!';
    } else if (shareData.personality_summary) {
      baseText = `Mind = blown! 🤯 ScentMatch's AI nailed my fragrance personality with ${shareData.personality_summary.confidence}% accuracy. I'm ${shareData.personality_summary.traits.slice(0, 2).join(' & ')} and it's SO true!`;
      hashtags = ['FragrancePersonality', 'ScentMatch', 'AIQuiz', 'SignatureScent'];
      callToAction = 'Discover your fragrance personality - it takes just 3 minutes and the results are incredible!';
    }

    const fullText = platform === 'instagram' 
      ? `${baseText}\n\n${callToAction}`
      : `${baseText} ${callToAction}`;

    return shareImageUtils.optimizeForPlatform(fullText, platform, hashtags);
  }
};

// Export singleton instance
export const shareImageGenerator = ShareImageGenerator.getInstance();