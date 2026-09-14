---
name: flowpilot-content-engine
description: Create FlowPilot short-form marketing content end-to-end: competitor research, angle, Polish hook/copy, visual direction, storyboard, voice-over, captions, Remotion implementation, render QA and variants. Use for reels, TikToks, Shorts, Meta creatives and product-demo videos.
---

# FlowPilot Content Engine

Use this as the orchestrator for short-form content. The user should be able to ask simply for a reel/ad and receive the full workflow without naming individual skills.

## 0. Research current creative patterns

For a new paid-social master creative, apply `competitor-ad-research` first. Study current direct/adjacent competitors and extract reusable patterns at the strategy level: hook type, proof mechanism, pacing, product demo, CTA and trust devices. Do not copy another brand's wording, footage, music or distinctive layout.

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
- expensive/frustrating current moment → better workflow,
- "you still do X manually?",
- specific workload → visible product mechanism,
- visual proof first, explanation second,
- native social trigger → product response → CTA.

Avoid unsupported promises, fake numbers and clickbait that the video cannot pay off.

## 3. Humanize Polish copy

Apply `natural-polish-copy`. Copy should sound like a sharp Polish founder/operator, not translated US marketing language. Short sentences. Specific nouns and verbs. No filler.

## 4. Set visual direction

Apply `ui-ux-flowpilot` for product/UI scenes. The video should use the same visual language as FlowPilot, not a disconnected template. Social ads may use stronger opening contrast than the website, but the product scenes should remain credible and readable.

## 5. Storyboard before coding

For a 12–20 second reel, default structure:
- 0–2.5s: first-frame hook/tension,
- 2.5–7s: visible problem + product starts solving it,
- 7–13s: mechanism/demo + control/proof,
- 13–17s: result framing,
- final seconds: explicit CTA.

Every scene needs one visual focus and one main text message. Change visual state often enough to retain attention, but do not create unreadable chaos.

## 6. Audio and captions

For a master paid-social creative, add when useful:
- natural Polish voice-over,
- burned-in captions synchronized by phrase,
- a low-volume original/licensed music bed,
- small notification/click/success SFX that reinforce visible actions.

Do not let music fight the voice. Captions must remain readable with Instagram/TikTok UI overlays.

## 7. Implement in Remotion

Apply `remotion-video`. Default to 1080x1920, 30 fps. Keep the first meaningful visual on frame 0. Prefer frame-based `spring()` and `interpolate()` animations. Use sequences only where they improve clarity. Media assets must be deterministic and renderable in CI.

## 8. QA

Before calling a reel finished, verify:
- hook is readable in under 1 second,
- first 3 seconds explain the tension even muted,
- no important text sits behind Instagram/TikTok UI zones,
- no line is needlessly long,
- product UI is legible on a phone,
- voice is clear over music,
- captions follow the spoken message,
- CTA is explicit,
- no unverified claim is presented as fact,
- final render is H.264 MP4 and plays end-to-end.

## 9. Variants

Once the master is approved, create variants by changing one variable at a time: hook, CTA, opening visual or angle. Keep the core edit stable so results are attributable.

## External inspirations

The repo-local skill is the source of truth for FlowPilot. When internet/package access is available, use these upstream skill sets as references:
- Remotion Agent Skills: `remotion-dev/skills`
- Marketing Skills: `coreyhaines31/marketingskills`
- UI UX Pro Max: `nextlevelbuilder/ui-ux-pro-max-skill`
- Stop Slop: `hardikpandya/stop-slop`
