# Creative Direction V2 — "KAGE / 影"

Supersedes the visual layer of V1. The engineering foundation stays: Next.js, Lenis, GSAP, the data layer and the a11y infrastructure.

## 1. Concept
A night-time anime film where a shadow carries you through one person's work.

## 2. Visual metaphor
The site is one continuous night. Moonlight, rooftops and wires form the world. The work, the photographs and the person are scenes inside it. Between scenes, a shadow runner (an original ninja silhouette, drawn in code) cuts from one to the next.

## 3. Signature
**The shadow runner.** It runs across the screen to end the intro, and its dash drives every route change: a black curtain is dragged behind it. It perches on a utility pole in the hero and turns its head to follow your cursor. It sits still on a rooftop at the end. Projects change with a katana slash that splits the screen in two.

## 4. Opening (~6 s first visit, ~2 s repeat, skippable, absent with reduced motion)
1. **Arrival (0–2.6 s):** the whole viewport is a wall of archive photographs flipping like a comic-book studio ident. The cadence accelerates, the wall pulls back, and the colour bleeds ember.
2. **Recognition (2.6–4 s):** SABYA / SACHIN / MOHANTA slams in as a knockout. The photographs flip *inside* the letters, then the letters flood solid.
3. **Tension (4–4.6 s):** silence. The name holds. Black. A giant moon rises.
4. **Transformation (4.6–6 s):** the shadow runner sprints across the moon with afterimages and speed lines. The intro tears away behind it, revealing the hero.

## 5. Hero
A real-time 3D night (three.js, procedurally painted layers): sky and stars, a huge moon, drifting cloud bands, mountains, rooftops with utility poles and wires, and ember petals in the air. The camera moves with the cursor in true depth. Petals swirl away from the cursor. The ninja perches on a pole and watches the cursor. The full name is set huge; each letter lifts in 3D as the cursor approaches. Vertical 影の記録 ("record of shadows") is set as decoration.
**Scroll:** the camera dives through the layers into the moon, the letters scatter into space, and everything whites out into the Manifesto (entering the mind).

## 6. Work — "five cuts"
A pinned full-screen theatre. Each project is a scene: a giant outlined index, a huge title, and metadata placed around the frame edges. Behind it is a **living system**: a generative particle field built from that project's real stages (from its code). Data flows node to node, the failure path burns ember, and the cursor disturbs the flow.
Scrolling to the next project triggers a **katana slash**: stillness → an ember line → the scene splits into two halves that fly apart → the next project sits beneath. Clicking a title leads, via the shadow dash, into the case study.

## 7. Scroll language
| Scene | Physical behaviour |
|---|---|
| Intro | none (time-based) |
| Hero | depth dive (3D camera on scroll) |
| Manifesto | pinned horizontal pressure |
| Band | velocity |
| Work | pinned scene replacement by slash (impact) |
| Archive | perspective tunnel: frames rush past in z, cursor steers |
| Capabilities | interactive index |
| About | stillness (bone, slow) |
| Contact | smooth, then the final frame |

## 8. Motion language
- **Stillness:** holds after the name, between cuts, and in About.
- **Tension:** the moon rising, the slash line drawing.
- **Impact:** the name slam, the screen split, the ninja dash.
- **Acceleration:** the flip-wall cadence, the velocity band, the archive rush.
- **Release:** About, and the final frame.

## 9. Navigation
The menu is a scene: a split composition with oversized destinations, sibling dimming and archive previews. Every route change is the shadow dash.

## 10. Ending
The moon low over rooftops. The shadow sits still with its scarf moving in the wind. The email is the largest object on screen. Then end credits roll like the last frame of a film.

## Colour
Near black #080808 · warm white #F1EFE8 · muted grey #8A8A8A · **ember #E0482C** (single accent). Lime is retired.

## Identity
The old site's identity is retired: the lime, the "SACHIN" wordmark and the hero portrait. The person is presented by full name.

---

## V2.1 refinement

- **Order:** Hero → Manifesto → Work → Capabilities → Archive → About → Contact. Engineering stays together, and the archive (the eye) exits into silence before the finale.
- **Intro:** replays in full on every load of `/` and starts at scroll 0 (`history.scrollRestoration = "manual"`, ScrollTrigger scroll memory cleared, Lenis reset). Deep links get the short cut (name → moon → runner), and a `#hash` is honoured after the intro. Pages restored from the back/forward cache reload. A key or click, even before hydration, skips to the moon and runner.
- **Name:** "alive, not animated". One per-letter spring loop provides idle depth breathing, a 3D lift and parting near the cursor, an ember rim light facing the cursor, and a boost from scroll velocity. It runs only while the hero is visible.
- **Manifesto:** on a near-black stage the white-out collapses into a silver line. DATABASE is written up out of it, tilts back and fractures. QUEUE arrives one letter at a time and leaves first-in-first-out. WEBSOCKETS appears instantly on a vermillion signal line, then shears into strips toward Work. Beats of stillness sit between the words.
- **Work:** the project leads (title, then idea, then stack). The system field is atmospheric, and its labels wake on the cursor or when a packet arrives.
- **Archive:** ~1.45× larger frames. Two lanes pass close to the lens. Far frames are softened by depth-of-field blur, the frame nearest the cursor swells, and an iris closes on the vanishing point.
- **About:** the single quiet moment. A dark, nearly empty frame, an ember point left by the iris, one statement.
- **Final scene:** no shadow figure here. The moon is reduced to a silver ring, with a letterbox slit of one photograph that opens near the cursor. The email is fitted to the frame width and its lines drift apart with the cursor. The footer is one credits line plus a vermillion 終 seal.

---

## V2.2 — cinematic refinement

- **No blank start:** the intro's first frame (the photo wall, with contact-sheet indices and 影の記録) is server-rendered, laid out in CSS, and starts flipping on hydration. Photos stream in, and flips use only loaded photos. It's hidden for reduced motion and when JS is off.
- **Moon return replaces the runner:** after the name, the moon rises and holds, then travels on an arc to land exactly on the 3D moon (both are painted by `paintMoon`). The black plate dissolves while the night assembles layer by layer (sky → clouds → mountains → city → poles → character → foreground → embers). Then the name descends letter by letter, followed by the supporting text.
- **Hero character (Ichigo, from a supplied manga reference):** asset-based. `scripts/cutout-character.py` turns the reference into `public/characters/hero-body.webp` and `hero-sword.webp` (blade separated, fist pivot), and `src/anime/Character.ts` renders it:
  - **Aura:** smoke built from the blurred silhouette.
  - **Body:** wind displaced through the coat and hair only, with a moon rim light.
  - **Sword:** pivots at the fist.
  - **Encounter (hover dwell or tap):** notice → anticipation → blade rises → ripple, slash and ember burst → rest, followed by a cooldown.

  ⚠ This is a copyrighted character. Replace the reference with licensed or commissioned art before publishing; re-running the script swaps it without code changes.
- **Work environment:** a raw-WebGL ink field (`src/anime/InkField.ts`) under the system field. Each project has its own flow, turbulence and red. A cut floods vermillion along the slash, and the cursor parts the ink.
- **Capabilities:** active rows. A vermillion field wipes in, one of Sabya's photographs emerges through a slash mask and drifts with the pointer, and the other rows recede. The row height never changes. Works with hover, focus and tap.
- **Route transition:** the curtain is now dragged by a vermillion slash edge. The generic ninja is gone from the site.

---

## V2.3 — V2 intro restored, Itachi hero

- **Intro:** the original V2 intro is restored from `4088ca2`: the photo wall, the knockout name slam, flip-through letters and flood, the moon rise, and its Japanese metas and typography.
  - It starts on the first frame. The wall is server-rendered, with inline LQIP backgrounds from `src/data/lqip.ts`, generated by `scripts/lqip.mjs`, so there's no black frame.
  - The runner ending is replaced: the moon arcs back to land on the 3D moon and settles there (a 0.45 s crossfade).
- **Hero reveal order:** moon settled → the name descends with V2's continuous letter stagger (0.035 s, 1.2 s expo) → supporting text → the environment assembles (sky → … → embers) → Itachi fades in on the post last (`setHeroCharacter`).
- **Character:** Itachi is cut from a supplied moon-and-pole wallpaper by `scripts/cutout-itachi.py` into `hero-body`, `hero-sword` (the hilt plus a synthetic blade hidden behind the back) and `hero-eyes` (an ember glow). His own pole becomes the perch post.
  - **Idle:** breathing, wind in the hair strand and sleeves, moon rim light, an aura drift, and eyes at low glow.
- **Encounter:** the eyes ignite and the aura rises. He crouches in anticipation, then the sword draws up along its axis. A ripple ring and slash pass through the air, the embers burst, he returns to rest, and a 2.6 s cooldown follows.
  - Triggers: hover dwell over 0.14 s (an `armed` flag means jitter never restarts it), a tap on touch, or a focusable "Approach the figure on the pole" button for the keyboard.
- ⚠ The character is copyrighted, and the same replacement note applies.
