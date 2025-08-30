# Ruby / Rails Style Guide

## Baseline

- Ruby **3.3+**, Rails **8+**.
- Linting: **RuboCop** (with project config).

## Style & Naming

- 2 spaces; snake_case (methods/vars), PascalCase (classes/modules).
- Files: snake_case matching class/module name.

## Rails Conventions

- Controllers skinny; move logic to Services/Jobs.
- Strong params; model validations + DB constraints.
- Background jobs: Solid Queue (default); idempotent.

## Database

- UUID v7 PKs; add `NOT NULL` + sensible defaults.
- Index FKs and lookups; reversible migrations.
- Use `strong_migrations` safeguards.

## Testing

- Use RSpec or Minitest; model, request, and system tests.
