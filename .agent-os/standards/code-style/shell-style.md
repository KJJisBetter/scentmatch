# Shell Script Style Guide

## Baseline

- Shebang: `#!/usr/bin/env bash`
- Always: `set -euo pipefail` and `IFS=$'\n\t'`.

## Style

- 2 spaces indentation.
- Quote all variables.
- Use `[[ ... ]]` for tests.

## Structure

- Organize in small functions; define `main`.
- No `sudo` inside scripts.
- Comment non-obvious logic.

## Safety

- Use `mktemp` for temp files; trap cleanup.
- Prefer long options.
- Document required env vars at top.
