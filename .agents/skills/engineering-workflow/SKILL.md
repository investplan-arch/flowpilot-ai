---
name: engineering-workflow
description: Use for non-trivial FlowPilot/Kapitalownia code changes. Applies a spec-first, incremental, testable, security-conscious delivery workflow inspired by addyosmani/agent-skills.
---

# Engineering Workflow

Use this skill whenever a change affects application behavior, integrations, security, data flow, deployment, or multiple files.

## Workflow

1. Restate the outcome and constraints in concrete acceptance criteria.
2. Inspect the relevant code and current behavior before changing anything.
3. Prefer a small plan with independently verifiable steps.
4. Implement the smallest coherent change first.
5. Verify after each meaningful change.
6. For bugs, reproduce first and add a regression check where practical.
7. Treat public/private data boundaries, authentication, secrets, webhooks, and client data as security-sensitive.
8. For UI changes, verify mobile layout, accessibility basics, empty/loading/error states, and obvious AI-generated visual artifacts.
9. Do not silently widen scope. Record follow-up improvements separately.
10. Before declaring completion, run a final review for correctness, security, performance regressions, and deployment impact.

## Definition of done

- Acceptance criteria are met.
- No known regression was introduced.
- Relevant tests/checks pass.
- No secrets or client data were committed to public code.
- Deployment or migration steps are explicit.
- Risky outbound actions still require human approval unless the operator explicitly changes that policy.

## Upstream reference

The broader engineering pack is maintained at https://github.com/addyosmani/agent-skills . Prefer its specialized skills when available in the active agent host.
