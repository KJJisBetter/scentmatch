# Tech Stack

## Baseline

- **Rails**: 8.0+ (Ruby 3.3+)
- **Node**: 22 LTS
- **Tailwind**: 4.0+
- **PostgreSQL**: 17+
- Upgrade cadence: quarterly deps, annual major review

## Frontend Modes

- **Rails Views**: ERB + Turbo + Stimulus + Tailwind
- **React App**: React + Vite + Tailwind
- Rule: don’t mix Rails UI components with React libs

## Core Platform

- ORM: Active Record
- Jobs: Solid Queue (Redis/Sidekiq only if scale needs)
- Cache: Solid Cache (Redis optional)
- WebSockets: Solid Cable

## Tooling

- JS: npm, ESM, Vitest, Playwright
- Ruby: RuboCop, RSpec/Minitest, Brakeman
- CI: GitHub Actions (lint + test gates before deploy)
- Deploy: Kamal 2 or DO App Platform

## Infra

- Hosting: DigitalOcean (app + managed Postgres)
- Backups: daily + PITR if available
- Assets: S3 + CloudFront (private, signed URLs)
- Regions: closest to users

## Security

- Rack::Attack, CSP/HSTS defaults
- Rails 8 Auth (Devise optional)
- Secrets from env/credentials
- PII encrypted attributes

## Observability

- APM: Datadog or New Relic
- Errors: Sentry
- Tracing: OpenTelemetry
- Dashboards: uptime, DB, queues, cache

## Email/Queues

- Email: Postmark or SendGrid
- Queue: Solid Queue (default)
- Scheduler: Solid Scheduler / cron

## Overrides

- Frontend mode (Rails vs React)
- UI lib (Headless vs suite)
- APM vendor
- Queue engine (Solid vs Sidekiq)
- CDN/storage vendor
