/**
 * Application configuration with environment-specific settings
 * Handles different configurations for development, preview, and production
 */

export const config = {
  // Environment detection
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  isPreview: process.env.VERCEL_ENV === 'preview',

  // Vercel deployment information
  vercel: {
    env: process.env.VERCEL_ENV, // 'production' | 'preview' | 'development'
    url: process.env.VERCEL_URL,
    gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF,
    gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
    gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE,
    gitCommitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME,
  },

  // Application URLs
  app: {
    url:
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'http://localhost:3000',
    name: 'ScentMatch',
    description: 'AI-powered fragrance discovery platform',
  },

  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // API configuration
  api: {
    // OpenAI (for future AI features)
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    },
    // Voyage AI (for embeddings)
    voyageAi: {
      apiKey: process.env.VOYAGE_AI_API_KEY,
      model: process.env.VOYAGE_MODEL || 'voyage-3.5',
    },
  },

  // Feature flags
  features: {
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'false',
    speedInsights: process.env.NEXT_PUBLIC_ENABLE_SPEED_INSIGHTS !== 'false',
    sentryEnabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    aiRecommendations: Boolean(process.env.OPENAI_API_KEY),
    embeddings: Boolean(process.env.VOYAGE_AI_API_KEY),
  },

  // Performance budgets
  performance: {
    // Core Web Vitals targets
    lcp: 2500, // Largest Contentful Paint (ms)
    fid: 100, // First Input Delay (ms)
    cls: 0.1, // Cumulative Layout Shift
    ttfb: 800, // Time to First Byte (ms)
    inp: 200, // Interaction to Next Paint (ms)
  },

  // Security settings
  security: {
    // Content Security Policy
    csp: {
      enabled: process.env.NODE_ENV === 'production',
      reportOnly: process.env.CSP_REPORT_ONLY === 'true',
      reportUri: process.env.CSP_REPORT_URI,
    },
    // Rate limiting
    rateLimit: {
      enabled: process.env.NODE_ENV === 'production',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
  },

  // Monitoring
  monitoring: {
    sentry: {
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    },
  },

  // Cache settings
  cache: {
    // Revalidation intervals (in seconds)
    revalidate: {
      static: 3600, // 1 hour for static content
      dynamic: 60, // 1 minute for dynamic content
      realtime: 0, // No cache for real-time data
    },
  },
};

// Type-safe environment variable validation
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Validate URLs
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  } catch {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }

  return true;
}

// Helper to get the current environment name
export function getEnvironmentName(): string {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV;
  }
  return process.env.NODE_ENV || 'development';
}

// Helper to check if running on Vercel
export function isVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

// Helper to get the deployment URL
export function getDeploymentUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
