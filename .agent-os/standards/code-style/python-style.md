# Python Style Guide

## Baseline

- Python **3.11+**.
- Virtual envs: `venv` or `uv`.
- Tooling: **Black** (format), **Ruff** (lint), **Pyright/Mypy** (types).

## Style & Naming

- snake_case (vars/functions), PascalCase (classes).
- 2 spaces accepted project-wide for consistency.

## Types & Safety

- Type hints everywhere; `pydantic` for IO schemas.
- No bare `except`; always log or raise with context.

## Structure

- Small, single-purpose modules.
- Use `__all__` for explicit public API.

## Testing

- **pytest**; fixtures for setup.
- Deterministic (seed randomness).
