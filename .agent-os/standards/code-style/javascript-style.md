# JavaScript / TypeScript Style Guide

## Baseline

- Use **TypeScript** by default (ESM only, Node 22 LTS).
- Tooling: **ESLint** + **Prettier**; tests: **Vitest** (unit), **Playwright** (e2e).

## Formatting

- 2 spaces; semicolons **on**; print width 100.
- Quotes: JS/TS single, JSX double; trailing commas on multiline.

## Linting

- Extend: `eslint:recommended`, `@typescript-eslint/recommended`, `plugin:react-hooks/recommended`.
- No unused vars, always `===`, `prefer-const`, no `console` in prod.

## Naming & Structure

- camelCase (vars, functions), PascalCase (classes/components/types), UPPER_SNAKE_CASE (const).
- Files: kebab-case; single-purpose modules.

## Imports

- Prefer named exports; avoid deep `../../..`; use path aliases.

## Types & Safety

- `strict: true`; avoid `any` (prefer `unknown` + narrowing).
- Validate external data at runtime (e.g., zod).

## React

- Function components + hooks only; default params over `defaultProps`.
- Class names follow **CSS multiline Tailwind** convention.

## Testing

- Co-locate `*.test.ts(x)`; mock I/O at boundaries.
