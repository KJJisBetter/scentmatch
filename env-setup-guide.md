# ScentMatch Environment Variables Setup Guide

## 🔐 Security Recommendation: Rotate API Keys

Since the original `.env.local` was removed and we can't find the keys in git history, I recommend rotating all API keys for security.

## 📋 Required Environment Variables

### 1. OpenAI API Key (Required)
- **Where to get**: https://platform.openai.com/api-keys
- **Purpose**: AI recommendations, quiz analysis, fragrance descriptions
- **Variable**: `OPENAI_API_KEY=sk-proj-...`

### 2. Supabase Credentials (Already configured in Vercel)
- **Status**: ✅ Already set in Vercel (18 days ago)
- **Variables**: 
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 3. Optional but Recommended

#### Voyage AI (for embeddings)
- **Where to get**: https://www.voyageai.com/
- **Purpose**: Alternative embedding provider (fallback for OpenAI)
- **Variable**: `VOYAGE_AI_API_KEY=pa-...`

#### Upstash Redis (for rate limiting)
- **Where to get**: https://console.upstash.com/
- **Purpose**: Production rate limiting and caching
- **Variables**: 
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

## 🚀 Setup Instructions

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new API key
3. Copy the key (starts with `sk-proj-`)

### Step 2: Add to Vercel
```bash
# Navigate to your project directory
cd /home/kevinjavier/dev/scentmatch

# Add the OpenAI key to Vercel (both Preview and Production)
vercel env add OPENAI_API_KEY

# Add NODE_ENV for production
vercel env add NODE_ENV
# When prompted, enter: production
```

### Step 3: Update Local Development
Edit your `.env.local` file:
```env
# Fill in with your actual keys
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-proj-your_new_openai_key
NODE_ENV=development
```

### Step 4: Test and Deploy
```bash
# Test locally
npm run build
npm run dev

# Deploy to production
vercel --prod
```

## 🔍 Verification

After deployment, check:
1. App builds successfully: ✅
2. API routes work: Test `/api/health`
3. Quiz functionality works
4. AI recommendations work

## 🚨 If You Have Existing Keys

If you have existing API keys and just need to add them to Vercel:
1. Check your password manager
2. Check any backup files
3. Check local environment if the app was working before

Let me know if you want to:
- **Option A**: Get fresh API keys (recommended for security)
- **Option B**: Use existing keys (if you can find them)