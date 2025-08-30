# CSS / Tailwind Style Guide

## Baseline

- Always use latest TailwindCSS.
- Follow project tokens (`@theme`) for colors, spacing, typography.

## Class Formatting

- Multi-line class format:
  - Base (no prefix) → xs → sm → md → lg → xl → 2xl
  - One responsive size per line
  - `hover:` and `focus:` on their own lines
  - `dark:` placed next to base utility

## Breakpoints

- Custom `xs` = 400px (25rem).

## Tooling

- Use `prettier-plugin-tailwindcss` with `prettier-ignore` for multiline blocks.
- Use `eslint-plugin-tailwindcss` (`classnames-order`, `no-contradicting-classname`).

## React/JSX

- Use `clsx` + `tailwind-merge` for conditional classes.

## Rules

- Prefer `focus-visible:` over `focus:`.
- Avoid arbitrary values; use theme tokens where possible.
- No contradictory utilities per breakpoint.
