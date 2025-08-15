#!/bin/bash

# Vercel Deployment Setup Script for ScentMatch
# This script helps you set up and deploy ScentMatch to Vercel

set -e

echo "🚀 ScentMatch Vercel Deployment Setup"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is installed"
fi

# Check if logged in to Vercel
echo ""
echo "📝 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
else
    echo "✅ Logged in to Vercel as $(vercel whoami)"
fi

# Link project to Vercel
echo ""
echo "🔗 Linking project to Vercel..."
if [ ! -f ".vercel/project.json" ]; then
    echo "Setting up new Vercel project..."
    vercel link
else
    echo "✅ Project already linked to Vercel"
fi

# Environment variables setup
echo ""
echo "🔐 Environment Variables Setup"
echo "------------------------------"
echo "Please ensure you have the following environment variables set in Vercel Dashboard:"
echo ""
echo "Required:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "Optional (for future features):"
echo "  - OPENAI_API_KEY"
echo "  - VOYAGE_AI_API_KEY"
echo "  - NEXT_PUBLIC_SENTRY_DSN"
echo ""
read -p "Have you configured the environment variables in Vercel? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Please configure environment variables at:"
    echo "https://vercel.com/dashboard/project/settings/environment-variables"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Deploy to preview
echo ""
echo "🚀 Deploying to preview environment..."
read -p "Deploy to preview? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building and deploying..."
    vercel --no-wait
    echo ""
    echo "✅ Preview deployment initiated!"
    echo "Check your deployment at: https://vercel.com/dashboard"
fi

# Deploy to production
echo ""
read -p "Deploy to production? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Warning: This will deploy to production!"
    read -p "Are you sure? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Building and deploying to production..."
        vercel --prod --no-wait
        echo ""
        echo "✅ Production deployment initiated!"
    fi
fi

echo ""
echo "🎉 Deployment setup complete!"
echo ""
echo "Next steps:"
echo "1. Monitor your deployment at: https://vercel.com/dashboard"
echo "2. Set up custom domain (optional)"
echo "3. Configure GitHub integration for automatic deployments"
echo "4. Enable Analytics and Speed Insights in Vercel Dashboard"
echo ""
echo "For more information, see: docs/deployment/VERCEL_DEPLOYMENT.md"