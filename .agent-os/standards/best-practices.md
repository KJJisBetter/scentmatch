# Development Best Practices

## Context

Global development guidelines for Agent OS projects.

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles
</conditional-block>

---

## Core Principles

### Keep It Simple

- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones
- Prefer multiple small, composable agents over one large monolithic agent

### Optimize for Readability

- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for _why_ not _what_
- Use structured outputs (e.g., JSON schemas) so agent responses are consistent and readable
- Ensure observability with clear logging and traces for debugging

### DRY (Don’t Repeat Yourself)

- Extract repeated business logic to private methods
- Extract repeated UI markup to reusable components
- Create utility functions for common operations
- Reuse agent actions, prompts, and tool wrappers across projects

### File Structure

- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions
- Maintain a `project-info` or `.prompts` file under version control:
  - Store context, conventions, and example agent prompts
  - Update regularly to reflect evolving patterns

### Reliability & Testing

- Integrate logging and telemetry into agents for traceability
- Add automated evaluation pipelines to catch regressions in agent reasoning or tool usage
- Create benchmarks or scorecards to measure improvements over time
- Use guardrails to validate agent outputs (schemas, type checks, sanity checks)

---

<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task
</conditional-block>

---

## Dependencies

### Choose Libraries Wisely

When adding third-party dependencies:

- Select the most popular and actively maintained option
- Check the library’s GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation
- For agent-specific libraries/tools, prefer those with:
  - Structured output support (schemas, JSON)
  - Telemetry and observability integration
  - Strong ecosystem adoption
