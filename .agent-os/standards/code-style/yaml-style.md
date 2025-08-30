# YAML Style Guide

## Formatting

- 2 spaces; UTF-8; LF newlines.
- Lowercase keys; explicit booleans when ambiguous.

## Structure

- Keep files focused; avoid giant configs.
- Use anchors/aliases sparingly; prefer reusable templates.

## Secrets

- Never commit secrets; load from env/CI secrets.

## GitHub Actions

- Name jobs clearly; minimal permissions.
- Steps: checkout, setup, cache, lint, typecheck, test, build.
- Use `${{ }}` for variables; avoid duplication.
