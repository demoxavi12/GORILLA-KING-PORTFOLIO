# Scroll System

## Foundation

Lenis is the primary smooth-scroll layer.

Scroll should become a source of animation progress, not merely a visual smoothing effect.

## Scroll Modes

### Mode A — Smooth
Use for:
- Hero
- About
- Contact
- General content

### Mode B — Pin + Transform
Use for:
- Selected Work
- Major project presentations

### Mode C — Horizontal
Use for:
- Visual Archive
- Potentially selected editorial sequences

### Mode D — Zoom
Use for:
- Hero-to-manifesto transition
- Selected project visual takeovers

### Mode E — Parallax
Use selectively for:
- Cinematic imagery
- Archive imagery
- Project visuals

### Mode F — Velocity Reactive
Use sparingly for:
- Large display type
- Selected decorative UI
- Image movement

## Scroll Rules

- Never hijack scroll unnecessarily.
- Avoid excessive horizontal scrolling.
- Horizontal sections must communicate their interaction.
- Pinned sections must have a clear exit.
- Mobile must have simplified fallbacks.
- Scroll-driven effects must be paused/disabled when not needed.

## Implementation

Lenis handles smooth scroll.

GSAP ScrollTrigger may be used for:
- pinning
- timelines
- scrubbed animation
- scroll progress

Do not create multiple competing scroll engines.

## Mobile

Where desktop uses horizontal/pinned choreography, mobile may use:
- vertical sequencing
- shorter animation distances
- reduced pinning
- reduced parallax

## Scroll Velocity

Use velocity as a subtle input, not as a constant distortion source.
