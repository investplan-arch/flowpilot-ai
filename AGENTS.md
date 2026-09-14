# FlowPilot AI — agent instructions

Use the repo-local Agent Skills in `.agents/skills/` whenever the task matches them.

## Available skills

- `flowpilot-content-engine` — orchestrates marketing angle, Polish copy, UI/UX direction and Remotion production for reels/ads. Use for any request to create a reel, ad creative, short-form video, campaign concept or content variant. File: `.agents/skills/flowpilot-content-engine/SKILL.md`
- `remotion-video` — Remotion implementation and rendering rules for 9:16 video. Use when editing anything under `remotion/` or when asked to make/render a reel. File: `.agents/skills/remotion-video/SKILL.md`
- `marketing-reels` — hooks, offer framing, CTA and A/B variants for short-form paid/organic social. File: `.agents/skills/marketing-reels/SKILL.md`
- `natural-polish-copy` — removes AI-sounding Polish copy and keeps language direct, specific and conversational. File: `.agents/skills/natural-polish-copy/SKILL.md`
- `ui-ux-flowpilot` — visual system for FlowPilot SaaS/product mockups used on the website and inside videos. File: `.agents/skills/ui-ux-flowpilot/SKILL.md`

## Video defaults

For social reels default to 1080x1920, 30 fps, 12–20 seconds, H.264 MP4. Keep important copy inside mobile-safe margins. Use deterministic Remotion frame-based animation; do not use CSS keyframe animations that depend on wall-clock time.

## Brand direction

FlowPilot should feel premium, calm and credible rather than generic "AI neon". Prefer deep navy/near-black backgrounds, white typography, restrained electric-blue accents, strong spacing and readable product UI. Avoid visual clutter, fake metrics and unverified claims.

## Content workflow

For reel requests: define audience and one desired action → pick one pain/benefit → write 3 hook variants → choose one → humanize Polish copy → storyboard scenes → implement in Remotion → render/test → verify readability and CTA.
