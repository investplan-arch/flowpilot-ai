---
name: remotion-video
description: Build, edit and render FlowPilot reels in Remotion. Use for any task involving the remotion directory, compositions, timing, animations, captions, media or MP4 export.
---

# Remotion video rules

## Technical defaults

- Canvas: 1080x1920 for vertical social.
- FPS: 30 unless there is a reason to change it.
- Typical duration: 12–20 seconds.
- Delivery: H.264 MP4.
- Keep all Remotion packages on the exact same version.

## Animation

Drive motion from `useCurrentFrame()` and `useVideoConfig()`.
Prefer `spring()` for natural entrances and `interpolate()` for deterministic transforms, opacity and progress.
Do not rely on CSS keyframes, timers or wall-clock animation.
Clamp interpolation when values must not overshoot visual bounds.

## Composition

Create one clear composition per deliverable and keep reusable UI pieces as React components.
Use `Sequence` only for meaningful timeline segments. Avoid deeply nested timing unless it improves readability.
Keep props serializable so future batch rendering is easy.

## Mobile readability

- Main hook should be readable immediately.
- Keep critical copy away from top status/header overlays and lower CTA/caption overlays.
- Prefer 1–3 short lines over dense paragraphs.
- Product UI shown inside a reel must use enlarged text and simplified controls compared with desktop UI.

## Visual QA

Check at frame 0, every scene transition, and the final frame.
No clipping, accidental scrollbars, text outside safe areas or sub-pixel jitter.
Avoid unnecessary blur-heavy effects that slow rendering.

## Render QA

A reel is not finished until a real render succeeds.
Run the repo render command and verify the output file exists and is non-zero size.
If CI is available, upload the rendered MP4 as an artifact.

## Upstream reference

Remotion's maintained Agent Skills are the preferred upstream reference when accessible: `remotion-dev/skills`. In particular: best practices, markup, captions, studio and render.
