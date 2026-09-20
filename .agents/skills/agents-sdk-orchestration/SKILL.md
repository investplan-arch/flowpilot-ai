---
name: agents-sdk-orchestration
description: Use when designing or implementing multi-agent AI workflows, handoffs, tools, guardrails, tracing, sessions, and human-in-the-loop approvals with OpenAI Agents SDK patterns.
---

# Agents SDK Orchestration

Use specialized agents only when separation improves correctness, observability, or permissions.

## Recommended roles

- Intake/Triage: classify request and required context.
- Sales/Conversation: prepare client-facing drafts.
- Funding Research: find current financing paths and evidence.
- Regulation Analyst: extract eligibility, scoring, deadlines, and risks.
- Application Writer: draft structured application/business-plan content.
- QA: independently verify claims, criteria, calculations, and missing fields.

## Rules

1. Give each agent a narrow responsibility and explicit allowed tools.
2. Prefer structured handoffs over free-form agent-to-agent chat.
3. Preserve source evidence and IDs through every handoff.
4. Use guardrails for sensitive outbound actions and invalid/missing inputs.
5. Keep the operator approval step outside the drafting agent.
6. Trace tool calls, handoffs, failures, and final decisions.
7. Do not let one agent silently overwrite another agent's evidence.
8. Use deterministic structured outputs for CRM updates.
9. Fail closed when permissions, identity, or approval status is ambiguous.
10. Keep the architecture simpler than the task: do not create extra agents for work one agent + tools can do reliably.

## Human-in-the-loop

Client-facing message generation and message sending are different capabilities. Drafting may be automated; sending requires an approved draft state unless the operator explicitly authorizes a different policy.

## Upstream reference

https://github.com/openai/openai-agents-python
