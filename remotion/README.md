# FlowPilot Reels — Remotion

Gotowy moduł do tworzenia pionowych rolek 9:16 w Remotion.

## Uruchomienie

W terminalu:

```bash
cd remotion
npm install
npm run studio
```

Remotion Studio otworzy podgląd rolki w przeglądarce.

## Eksport MP4

```bash
npm run render
```

Plik zostanie zapisany jako:

```text
remotion/out/reel.mp4
```

## Format

- 1080 × 1920 px
- 30 FPS
- 15 sekund
- H.264 MP4
- format pod Instagram Reels / TikTok / YouTube Shorts

## Edycja treści

Domyślne teksty znajdują się w `src/Root.tsx`.
Animacja i wygląd rolki znajdują się w `src/Reel.tsx`.

Można dalej dodać m.in. nagrania ekranu, logo, muzykę, automatyczne napisy, lektora i parametryzowane warianty reklam.
