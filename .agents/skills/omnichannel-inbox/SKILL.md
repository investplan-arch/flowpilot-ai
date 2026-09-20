---
name: omnichannel-inbox
description: Use when evaluating or integrating Chatwoot or another shared inbox for Messenger, Instagram, WhatsApp, email, contacts, tags, notes, and operator/AI collaboration.
---

# Omnichannel Inbox

Use a shared inbox as the conversation interface; keep CRM/business truth in the proper backend.

## Integration model

Channel provider -> shared inbox -> event/webhook -> AI draft workflow -> operator approval -> channel send -> delivery status/audit.

## Rules

1. Do not make the inbox the only CRM database.
2. Map external contact/conversation/message IDs to internal stable IDs.
3. Preserve channel-specific metadata required for replies.
4. Keep internal notes separate from client-visible messages.
5. Use tags/statuses for workflow convenience, not as the sole source of important business state.
6. Enforce human approval for AI-generated outbound messages unless explicitly changed by the operator.
7. Handle retries and duplicate inbound webhooks idempotently.
8. Never store provider access tokens in browser code or public repositories.
9. Respect Meta/provider permissions and review requirements; Chatwoot does not bypass them.
10. Test one channel end-to-end before expanding to more channels.

## Upstream reference

https://github.com/chatwoot/chatwoot
