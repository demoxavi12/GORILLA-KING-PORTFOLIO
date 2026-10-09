# Sabya Sachin Mohanta — KAGE / 影

A night-time anime film where a shadow carries you through one person's work. The full creative direction is in `docs/18_CREATIVE_DIRECTION_V2.md`.

Next.js 16 · TypeScript · Tailwind v4 · GSAP + ScrollTrigger · Lenis · Motion · three.js (hero only, lazy-loaded).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # every route is prerendered
npm run lint && npm run typecheck
```

## The film, scene by scene

| Scene | What happens | Physical behaviour |
|---|---|---|
| Intro | The archive photographs flip as a full-screen wall, accelerating and bleeding ember. The name slams in as a knockout with the photos inside the letters. A moon rises, and the shadow runner sprints across it, tearing the intro away. | time-based (~6 s, ~2 s repeat, any key skips) |
| Hero | Real-time 3D night: sky, moon, cloud wisps, mountains, rooftops, poles and wires, embers. The camera follows the cursor, embers swirl away from it, the shadow perches on a pole against the moon and turns to watch you, and each letter of the name lifts toward the cursor in 3D. | depth dive into the moon, letters scatter, white-out |
| Manifesto | Sabya's own rule ("Truth lives in the Database…") on bone, with the keywords firing ember. | pinned horizontal pressure |
| Band | — | velocity |
| Work — five cuts | One pinned theatre over a living system built from each repo's real stages (data packets flow, failure paths burn ember, the cursor disturbs the flow). Moving between projects triggers a katana slash that splits the scene in two. | pinned scene replacement, snapping |
| Archive | A memory tunnel: the photographs hang in 3D and fly past the lens. | perspective travel, cursor steers |
| Capabilities | Interactive index cross-linked to projects. | — |
| About | Stillness, on bone. | slow |
| Final frame | Low moon, rooftops, the shadow at rest; the email inverts across the moon. | — |
| Credits | End credits, 終. | rolling |

Route changes use the **shadow dash**: the runner drags a black curtain across the screen, the page changes underneath, and he tears it away.

## Code map

```
src/anime/       ninja.ts (rig, run + perch poses, renderer) · paint.ts (procedural layers)
                 NightScene.ts (three.js hero) · SystemField.ts (living systems)
src/components/  intro/Intro · home/* · work/Cuts · projects/* · shell/* (header, menu, cursor, transitions, footer)
src/data/        all content — unchanged sourcing rules
scripts/         visual QA (shots, rapid screencast, flows, audit); needs a local Chrome
```

All artwork is drawn in code: the ninja is an original procedural figure, and the night is painted onto canvases. No anime assets, characters or third-party art are used.

## Reduced motion
No intro, no pins, no particles or loops. The hero renders as a single still frame, the archive is a grid, and the cuts cross-fade. Everything stays readable.

## Content
The sourcing rules are unchanged from V1: projects come from repository code, and nothing is invented. The old site's identity is retired (the lime accent, the "SACHIN" wordmark, the hero portrait and its slogans). The accent is now ember `#E0482C`.
