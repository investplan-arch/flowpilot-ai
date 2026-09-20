---
name: supabase-crm
description: Use for FlowPilot/Kapitalownia CRM storage, Supabase schema design, migrations, auth, RLS, realtime updates, and replacing GitHub JSON persistence.
---

# Supabase CRM

Use Supabase/Postgres as the transactional source of truth for CRM and conversation state.

## Core principles

1. Store mutable CRM state in Postgres, not public repository files.
2. Use migrations for schema changes.
3. Add primary keys, foreign keys, timestamps, and unique external IDs deliberately.
4. Put client-visible/public data and private operator data in clearly separated tables or access paths.
5. Enable Row Level Security and write explicit policies before exposing tables to browser clients.
6. Never ship service-role keys to the frontend.
7. Use authenticated server-side or protected automation paths for privileged writes.
8. Preserve an append-only audit trail for important state transitions where practical.
9. Use Realtime only for UI updates; business correctness must not depend on a websocket being connected.
10. Backfill/migrate old JSON data before removing the old storage path.

## Recommended entities

- clients
- conversations
- messages
- ai_drafts
- approvals
- funding_research
- tasks/followups
- payments/status
- audit_events

## Approval state

Draft -> pending_approval -> approved/rejected -> sending -> sent/failed.

Only the approved immutable draft version should be eligible for outbound send.

## Migration from crm.json

Freeze schema -> create tables -> import -> verify counts and key fields -> switch writes -> switch reads -> observe -> remove legacy writes.
