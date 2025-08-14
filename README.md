# ScentMatch

> AI-powered fragrance discovery platform

ScentMatch helps users discover their perfect fragrance through AI-powered personalized recommendations, collection management, and interactive testing experiences.

## Features

- **AI Recommendations**: Personalized fragrance suggestions using Voyage AI embeddings
- **Collection Management**: Track your fragrance collection with ratings and notes  
- **Smart Search**: Find fragrances by notes, brand, or style preferences
- **Sample Discovery**: Prioritize affordable samples and travel sizes
- **User Profiles**: Beginner-friendly to collector-advanced experiences

## Tech Stack

- **Frontend**: Next.js 15+ with App Router, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Voyage AI embeddings, OpenAI GPT-4 for recommendations
- **UI**: Shadcn/ui components, Lucide icons
- **Deployment**: Vercel with edge functions

## Development

This project follows Agent OS development patterns with comprehensive specs and task-driven development.

### Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Project Structure

```
├── .agent-os/          # Agent OS specs and documentation
├── .claude/            # Natural language coordination
├── app/                # Next.js App Router pages
├── components/         # Reusable UI components
├── lib/                # Utilities and configurations
└── types/              # TypeScript type definitions
```

## Documentation

- **Product Mission**: `.agent-os/product/mission.md`
- **Tech Stack**: `.agent-os/product/tech-stack.md`
- **Current Spec**: `.agent-os/specs/2025-08-14-user-auth-fragrance-db-foundation/`

## License

MIT