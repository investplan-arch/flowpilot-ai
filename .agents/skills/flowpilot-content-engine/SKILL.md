---
name: flowpilot-content-engine
description: Create FlowPilot short-form marketing content end-to-end: angle, Polish hook/copy, visual direction, storyboard, Remotion implementation, QA and variants. Use for reels, TikToks, Shorts, Meta creatives and product-demo videos.
---

# FlowPilot Content Engine

Use this as the orchestrator for short-form content.

## 1. Decide the single job of the video

Before writing, identify:
- audience,
- one pain or desired outcome,
- one product mechanism to show,
- one CTA.

Do not cram multiple offers into one reel.

## 2. Create hooks

Generate 3 concise hooks, then choose the strongest one. Prefer concrete tension over generic claims.

Good patterns:
- painful current state → better workflow,
- "you still do X manually?",
- specific workload → product mechanism,
- visual proof first, explanation second.

Avoid unsupported promises, fake numbers and clickbait that the video cannot pay off.

## 3. Humanize Polish copy

Apply the `natural-polish-copy` skill. Copy should sound like a sharp Polish founder/operator, not translated US marketing language. Short sentences. Specific nouns and verbs. No filler.

## 4. Set visual direction

Apply the `ui-ux-flowpilot` skill for product/UI scenes. The video should use the same visual language as FlowPilot, not a disconnected template.

## 5. Storyboard before coding

For a 15-second reel, default structure:
- 0–2.5s: hook,
- 2.5–7s: pain/current workflow,
- 7–12s: FlowPilot mechanism/demo,
- 12–15s: result + CTA.

Every scene needs one visual focus and one main text message.

## 6. Implement in Remotion

Apply `remotion-video`. Default to 1080x1920, 30 fps. Keep the first meaningful visual on frame 0. Prefer frame-based `spring()` and `interpolate()` animations. Use sequences only where they improve clarity.

## 7. QA

Before calling a reel finished, verify:
- hook is readable in under 1 second,
- no important text sits behind Instagram/TikTok UI zones,
- no line is needlessly long,
- product UI is legible on a phone,
- CTA is explicit,
- no unverified claim is presented as fact,
- final render is H.264 MP4 and plays end-to-end.

## 8. Variants

Once the master is approved, create variants by changing one variable at a time: hook, CTA, opening visual or angle. Keep the core edit stable so results are attributable.

## External inspirations

The repo-local skill is the source of truth for FlowPilot. When internet/package access is available, the following upstream skill sets are useful references and may be installed separately:
- Remotion Agent Skills: `remotion-dev/skills`
- Marketing Skills: `coreyhaines31/marketingskills`
- UI UX Pro Max: `nextlevelbuilder/ui-ux-pro-max-skill`
- Stop Slop: `hardikpandya/stop-slop`
