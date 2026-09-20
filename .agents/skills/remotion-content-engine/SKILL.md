---
name: remotion-content-engine
description: Use for automated TikTok, Reels, Shorts, ads, captions, motion graphics, and repeatable social video generation with Remotion.
---

# Remotion Content Engine

Create deterministic, editable social video from data and code rather than manual timeline editing.

## Workflow

1. Define format: platform, duration, aspect ratio, hook, CTA, and audience.
2. Write the script as timed beats, not one long paragraph.
3. Convert beats into scenes with explicit duration and visual purpose.
4. Generate or select assets with clear licensing/provenance.
5. Build captions from the final voice/script timing.
6. Keep typography, spacing, transitions, and motion consistent with the brand.
7. Avoid generic AI visual tropes, excessive gradients, fake dashboards, meaningless glassmorphism, and random stock imagery.
8. Render a preview and check text clipping, mobile legibility, pacing, and audio sync.
9. Export a final platform-ready MP4 and retain the source composition for variants.
10. Parameterize reusable videos so multiple hooks/offers can be generated from one template.

## Automation-friendly input

A content job should ideally be representable as JSON:
- title
- hook
- scenes[]
- narration
- captions
- assets[]
- CTA
- duration
- aspectRatio
- brand preset

## Upstream reference

Official Remotion skills/examples: https://github.com/remotion-dev/skills
