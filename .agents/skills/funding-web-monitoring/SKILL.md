---
name: funding-web-monitoring
description: Use for crawling and monitoring official funding/program websites, detecting new calls or changed rules, extracting pages, and feeding verified changes into research workflows. Firecrawl-compatible.
---

# Funding Web Monitoring

Monitor official sources for meaningful program changes without creating fictional opportunities.

## Source priority

1. Official call documentation/regulations.
2. Official annexes, criteria, forms, and operator documents.
3. Official institution/program pages.
4. Official operator announcements.
5. Secondary sources only as leads, never as the final authority for critical eligibility facts.

## Workflow

1. Start from a known official domain or authoritative source list.
2. Crawl only the relevant scope; avoid indiscriminate web scraping.
3. Normalize each page/document with URL, title, publication/update date, retrieval time, and content hash where possible.
4. Compare with the previous captured version.
5. Ignore cosmetic changes.
6. Escalate substantive changes in dates, budgets, eligibility, funding intensity, scoring, required documents, regions, or application procedure.
7. Send changed documents into the document-intelligence workflow.
8. Persist evidence and change summaries before updating CRM recommendations.
9. Mark opportunities as unverified until authoritative documentation is checked.
10. Never invent future call dates when the operator has not published them.

## Preferred tooling

Firecrawl search/crawl/extract/monitor or equivalent.

Upstream: https://github.com/firecrawl/firecrawl
