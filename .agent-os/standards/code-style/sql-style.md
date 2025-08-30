# SQL / PostgreSQL Style Guide

## Baseline

- Use Rails migrations where possible; raw SQL only when needed (comment why).

## Naming

- Tables plural (Rails default).
- snake_case columns; FK columns end with `_id`.

## Schema

- UUID v7 PKs.
- `NOT NULL` with defaults.
- Use check constraints for business rules.

## Indexing

- Index FKs + unique natural keys.
- Partial indexes for filtered lookups.
- Naming: `idx_<table>__<cols>`; unique → `uidx_...`.

## Migrations

- Reversible and safe; avoid locks on hot tables.
- Batch backfills; guarded by `strong_migrations`.
