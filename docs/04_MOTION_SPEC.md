# Motion Specification

## Motion Philosophy

Motion should establish hierarchy, communicate state, create continuity, guide attention, or create emotional impact.

If an animation does none of these, remove it.

## Timing Vocabulary

Use a small, consistent timing system:

- Micro: 150–250ms
- UI: 250–450ms
- Reveal: 600–1000ms
- Cinematic: 900–1600ms
- Major transition: 1200–2200ms

Exact values should be tuned during implementation.

## Easing

Prefer custom cubic-bezier curves and GSAP eases over default-looking animations.

Motion should feel:
- weighted
- intentional
- controlled
- slightly cinematic

## Loader

Sequence:
1. Background establishes
2. Micro metadata appears
3. Name reveals via clip/mask
4. Environmental visual appears
5. Hero becomes interactive

## Hero

- Layered typography entrance
- Subtle image/environment reveal
- Scroll-driven compression
- Controlled scale
- Directional text movement

## Manifesto

- Text can enter through mask
- Horizontal movement driven by scroll
- Avoid excessive character-level animation

## Projects

- Pin viewport
- Transform title/image based on scroll
- Scale visual toward takeover
- Transition into next project
- Keep metadata readable

## Project Transition

Preferred rhythm:

`Stillness → acceleration → impact → silence → next state`

This is the primary abstract BLEACH-inspired motion principle.

## Image Motion

- Scale
- Parallax
- Mask
- Subtle displacement
- Optional hover distortion

Never use extreme distortion that harms usability.

## Cursor

Cursor state changes should be fast and smooth. Avoid laggy or oversized movement.

## Menu

Menu should enter as a composed scene:
- overlay transition
- typography reveal
- staggered navigation
- optional background preview

## Contact

Motion slows down. Large typography and negative space become dominant.

## Reduced Motion

When `prefers-reduced-motion` is active:
- remove major transforms
- reduce parallax
- remove cursor effects
- simplify page transitions
- retain clear state changes
