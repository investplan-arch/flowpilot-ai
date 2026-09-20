---
name: make-automation
description: Use when creating, repairing, reviewing, or extending Make scenarios, webhooks, routers, approvals, error handling, or Messenger/AI automation.
---

# Make Automation

Build Make scenarios as deterministic production workflows rather than ad-hoc chains.

## Rules

1. Inspect the existing scenario and exact module schemas before editing.
2. Never guess module names, fields, connection IDs, or mappings.
3. Separate trigger, normalization, business logic, persistence, approval, and outbound delivery.
4. Make every external write idempotent when duplicate webhook delivery is possible.
5. Avoid concurrent writes to one GitHub JSON file as a transactional database.
6. Use a database or atomic data store for CRM state.
7. Add explicit error paths for network/API failures and malformed payloads.
8. Preserve a human approval gate before client-facing messages unless explicitly authorized otherwise.
9. Never expose Meta, OpenAI, Stripe, database, webhook, or operator secrets in logs, public repos, frontend JavaScript, or client-visible responses.
10. Test the flow end-to-end with a safe test payload before enabling real-client delivery.

## Messenger pattern

Inbound event -> normalize identity/message -> persist event -> AI draft -> persist draft -> operator approval -> send -> persist delivery status.

Keep inbound event IDs, conversation IDs, draft versions, approval state, send attempts, and final provider message IDs for traceability.

## Concurrency

Prefer database rows with unique constraints and status transitions over read-modify-write files. Use unique external event IDs to reject duplicates.

## Upstream reference

Official Make agent skills: https://github.com/integromat/make-skills
