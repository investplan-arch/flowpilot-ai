---
name: document-intelligence
description: Use when extracting, structuring, validating, or comparing grant regulations, PDFs, DOCX, XLSX, PPTX, scans, application forms, and annexes. Prefer Docling-compatible workflows.
---

# Document Intelligence

Turn source documents into structured evidence before asking an AI model to reason over them.

## Workflow

1. Identify the authoritative document and version/date.
2. Extract text, headings, tables, lists, page references, and metadata.
3. Preserve source/page provenance for every important criterion, deadline, amount, threshold, attachment, and exclusion.
4. Normalize extracted content into structured fields before interpretation.
5. Separate source facts from AI inference.
6. For scanned files, use OCR only when necessary and mark uncertain text.
7. Cross-check critical values such as dates, percentages, amounts, scoring thresholds, and eligibility conditions against the source.
8. Build a checklist of mandatory criteria and, when applicable, a separate scoring model.
9. Flag missing/ambiguous information rather than inventing it.
10. Keep the original document reference alongside every downstream analysis.

## Grant-analysis output

Produce:
- program/nabór identification
- eligibility conditions
- exclusions
- eligible costs
- funding amount/intensity
- deadlines
- required attachments
- ranking/scoring criteria
- risks and ambiguities
- exact source references

## Preferred tooling

Docling or another parser that preserves document structure is preferred over naive plain-text extraction.

Upstream: https://github.com/docling-project/docling
