# FlowPilot AI — agent instructions

Use the repo-local Agent Skills in `.agents/skills/` automatically whenever the task matches them. The user should not need to name the skills explicitly.

## Default operating rule

For FlowPilot marketing, reels, paid social, landing pages, product-demo videos or campaign work, automatically combine the relevant skills instead of treating them as separate optional tools.

Default chain for a new social creative:
`competitor-ad-research` → `marketing-reels` → `natural-polish-copy` → `ui-ux-flowpilot` → `remotion-video` → render/QA.

`flowpilot-content-engine` orchestrates the whole chain.

## Available skills

- `flowpilot-content-engine` — end-to-end orchestrator for marketing angle, competitor patterns, Polish copy, visual direction, Remotion implementation, sound, QA and variants. File: `.agents/skills/flowpilot-content-engine/SKILL.md`
- `competitor-ad-research` — current competitor research and creative-pattern extraction before major paid-social work. File: `.agents/skills/competitor-ad-research/SKILL.md`
- `remotion-video` — Remotion implementation and rendering rules for 9:16 video. Use when editing anything under `remotion/` or when asked to make/render a reel. File: `.agents/skills/remotion-video/SKILL.md`
- `marketing-reels` — hooks, offer framing, CTA and A/B variants for short-form paid/organic social. File: `.agents/skills/marketing-reels/SKILL.md`
- `natural-polish-copy` — removes AI-sounding Polish copy and keeps language direct, specific and conversational. File: `.agents/skills/natural-polish-copy/SKILL.md`
- `ui-ux-flowpilot` — visual system for FlowPilot SaaS/product mockups used on the website and inside videos. File: `.agents/skills/ui-ux-flowpilot/SKILL.md`

## Upstream references

The local skills are tuned for FlowPilot, but use these upstream projects as knowledge references when fresh access is available:
- Remotion Agent Skills: `remotion-dev/skills`
- Marketing Skills: `coreyhaines31/marketingskills`
- UI UX Pro Max: `nextlevelbuilder/ui-ux-pro-max-skill`
- Stop Slop: `hardikpandya/stop-slop`

## Video defaults

For social reels default to 1080x1920, 30 fps, 12–20 seconds, H.264 MP4. Keep important copy inside mobile-safe margins. Use deterministic Remotion frame-based animation; do not use CSS keyframe animations that depend on wall-clock time.

For a master paid-social creative, include when useful:
- first-frame visual hook,
- voice-over,
- burned-in captions,
- original or licensed music/SFX,
- visible product mechanism,
- explicit CTA,
- mobile-safe layout,
- verified final MP4 render.

## Brand direction

FlowPilot should feel premium, sharp and credible rather than generic "AI neon". Prefer deep navy/near-black backgrounds, white typography, restrained electric-blue/cyan accents, strong spacing and readable product UI. Use red/amber only for pain/tension moments and green for confirmation states. Avoid visual clutter, fake metrics and unverified claims.

## Content workflow

For reel requests: research current competitor patterns → define audience and one desired action → pick one pain/benefit → write 3 hook variants → choose one → humanize Polish copy → storyboard scenes → implement in Remotion → add captions/audio → render/test → verify readability, claim accuracy and CTA.

Once a master works, create variants by changing one variable at a time so performance can be attributed to the hook, CTA, opening visual or angle.
