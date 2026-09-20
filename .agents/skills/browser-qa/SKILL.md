---
name: browser-qa
description: Use when testing FlowPilot/Kapitalownia websites, forms, dashboards, auth flows, responsive behavior, JavaScript errors, and end-to-end browser journeys. Prefer Playwright-compatible automation.
---

# Browser QA

Validate user-visible behavior in a real browser before declaring a feature complete.

## Required checks

1. Load the target page from a clean session.
2. Check desktop and mobile viewport behavior.
3. Exercise the critical user journey, not only the landing page.
4. Verify buttons, forms, validation, navigation, authentication, loading states, and failure states.
5. Inspect console/runtime errors and failed network requests.
6. Ensure secrets and private CRM data are not present in public HTML/JS/network responses.
7. Test unauthenticated access to protected operator routes.
8. Confirm outbound/client-facing actions still respect approval requirements.
9. Capture exact reproduction steps for every bug.
10. Re-run the journey after fixes.

## E2E scenarios for FlowPilot

- open public landing
- open operator entry
- login/session handling
- fetch CRM data only when authorized
- render conversations/leads
- create AI draft
- approve/reject draft
- verify send action cannot occur before approval
- handle expired session/network failure safely

## Preferred tooling

Playwright or Playwright MCP.

Upstream: https://github.com/microsoft/playwright-mcp
