# Code Style Guide

## Context

Global code style rules for Agent OS projects. Language-specific rules live in:

- `javascript-style.md`, `ruby-style.md`, `python-style.md`, `sql-style.md`, `shell-style.md`, `yaml-style.md`

<conditional-block context-check="general-formatting">
IF this General Formatting section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using General Formatting rules already in context"
ELSE:
  READ: The following formatting rules
</conditional-block>

---

## General Formatting (Language-agnostic)

- **Indentation**: 2 spaces (never tabs).
- **Line length**: target **100**; wrap earlier for readability.
- **Whitespace**: one blank line between top-level blocks; trim trailing spaces; end files with a newline.
- **Naming**:
  - Classes/Types/Enums → **PascalCase**
  - Constants → **UPPER_SNAKE_CASE**
  - Files → kebab-case or snake_case (be consistent per ecosystem)
- **Strings**: one quote style per ecosystem; use interpolation for dynamic text; indent multi-line strings to context.
- **Layout**: space after commas and around binary operators; no space before call parens (`fn(arg)`).

## Comments

- Comment **why**, not **what**; keep comments updated.
- Use `TODO/NOTE/FIXME(owner, YYYY-MM-DD)` for actionables:
  `// TODO(lydmarie, 2025-08-29): handle timeout edge case`

## Imports

- Order: **std lib → third-party → internal**; sort alphabetically within groups.
- Avoid unused/wildcard imports unless idiomatic.

## Functions

- Small, single-purpose; prefer **early returns** to reduce nesting.
- Keep params short; use an options object/kwargs for many optional args.
- Avoid side effects unless documented.

## Errors & Logging

- Fail fast with actionable messages; do not swallow exceptions.
- **Structured logs** (key-value); never log secrets/PII.
- Include stable ids when available (request_id, user_id, run_id).

## Security

- Secrets via env/secrets manager only.
- Validate/sanitize external inputs at boundaries.
- Prefer secure defaults (HTTPS, prepared statements, no unsafe eval).

## Performance

- Optimize clarity first; measure before optimizing.
- Avoid accidental O(n²) on large inputs; memoize/cache with clear invalidation.

## Testing

- Co-locate tests or mirror `/tests`.
- One behavior per test; deterministic (seed randomness).
- For Agent OS flows, add **golden tests** for structured outputs and tool-call traces.

---

<conditional-block task-condition="html-css-tailwind" context-check="html-css-style">
IF current task involves HTML/CSS/Tailwind:
  IF html-style.md AND css-style.md already in context:
    SKIP: Re-reading these files
    NOTE: "Using HTML/CSS style guides already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get HTML rules from code-style/html-style.md"
        REQUEST: "Get CSS/Tailwind rules from code-style/css-style.md"
      ELSE:
        READ:
        - @.agent-os/standards/code-style/html-style.md
        - @.agent-os/standards/code-style/css-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: HTML/CSS not relevant
</conditional-block>

<conditional-block task-condition="javascript" context-check="javascript-style">
IF current task involves JavaScript/TypeScript:
  IF javascript-style.md already in context:
    SKIP: Re-reading this file
    NOTE: "Using JavaScript style guide already in context"
  ELSE:
    <context_fetcher_strategy>
      IF current agent is Claude Code AND context-fetcher agent exists:
        USE: @agent:context-fetcher
        REQUEST: "Get JavaScript rules from code-style/javascript-style.md"
      ELSE:
        READ: @.agent-os/standards/code-style/javascript-style.md
    </context_fetcher_strategy>
ELSE:
  SKIP: JavaScript not relevant
</conditional-block>

---

## Agent Runtime Notes (applies across languages)

- **Structured outputs**: validate JSON/schema before downstream use.
- **Prompts & tools**: keep prompts, tool defs, routing in separate modules; version prompts with IO examples.
- **Observability**: log tool calls, model id, latency, token counts; carry a **run_id** end-to-end.

---

## Tooling Defaults

- **EditorConfig** for newline/indent/charset.
- **Formatters**: Prettier (TS/JS), Black (Python).
- **Linters**: ESLint (TS/JS), Ruff (Python).
- **Type checkers**: TypeScript strict; Pyright/Mypy.
- **Pre-commit**: lint, format, basic tests.
- **CI**: block merges unless lint/format/tests pass.

---
