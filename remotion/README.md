# FlowPilot Reels — Remotion

Repo zawiera gotowy moduł do pionowych rolek 9:16.

## Główna kompozycja

`FlowPilotPromo` — 15-sekundowa rolka pokazująca workflow:

1. hook: dziesiątki wiadomości,
2. wiadomość klienta,
3. draft AI,
4. akceptacja człowieka,
5. wysłanie + CTA.

Plik: `src/FlowPilotPromo.tsx`.

## Uruchomienie Studio

```bash
cd remotion
npm install
npm run studio
```

## Eksport MP4

```bash
npm run render
```

Wynik:

```text
remotion/out/flowpilot-promo.mp4
```

## Format

- 1080 × 1920 px
- 30 FPS
- 15 sekund
- H.264 MP4
- Instagram Reels / TikTok / YouTube Shorts

## Kompozycje

- `FlowPilotPromo` — właściwa rolka produkcyjna,
- `Reel` — starszy starter/sandbox.

## Agent Skills

Repo zawiera własny pipeline w `.agents/skills/` oraz `AGENTS.md`. Przy tworzeniu kolejnych rolek agent powinien przejść przez marketing → naturalny polski copy → UI/UX → storyboard → Remotion → render QA.

## Kolejne rozszerzenia

Można dodać nagrania ekranu produktu, muzykę, lektora, automatyczne napisy, warianty hooków oraz parametryzowany batch rendering.
