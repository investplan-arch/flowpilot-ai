---
name: flowpilot-orchestrator
description: Primary router for FlowPilot/Kapitalownia work. Selects the smallest relevant project skill set for automation, CRM, research, documents, agents, QA, content, or omnichannel messaging.
---

# FlowPilot Orchestrator

Route work to the smallest set of specialized skills that can complete it safely.

## Routing

- Code/features/refactors -> engineering-workflow
- Make scenarios/webhooks/routers -> make-automation
- CRM/database/auth/realtime -> supabase-crm
- Regulations/PDF/DOCX/XLSX/forms -> document-intelligence
- TikTok/Reels/Shorts/video -> remotion-content-engine
- Browser/E2E/UI/auth testing -> browser-qa
- Multi-agent/handoffs/guardrails -> agents-sdk-orchestration
- New/changed funding calls on the web -> funding-web-monitoring
- Messenger/Instagram/WhatsApp/email shared inbox -> omnichannel-inbox

## Combination patterns

### New funding opportunity
funding-web-monitoring -> document-intelligence -> agents-sdk-orchestration -> supabase-crm

### Client Messenger flow
make-automation -> agents-sdk-orchestration -> supabase-crm -> omnichannel-inbox -> browser-qa

### New FlowPilot feature
engineering-workflow -> relevant domain skill -> browser-qa

### Automated social video
remotion-content-engine -> browser-qa only when a web preview/publishing UI is involved

## Global project rules

1. No fictional funding programs, dates, amounts, criteria, or sources.
2. Do not expose secrets or client data in public repository files or browser bundles.
3. Public website code and private CRM data are separate trust zones.
4. AI may prepare client communication, but sending requires operator approval unless explicitly authorized otherwise.
5. Prefer official primary sources for funding research.
6. Prefer a transactional database over GitHub JSON for mutable CRM state.
7. Verify before claiming completion.
