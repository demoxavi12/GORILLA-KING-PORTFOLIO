# Accessibility Specification

## Requirements

Accessibility is part of the implementation, not a post-launch patch.

## Semantic HTML

Use:
- headings in logical order
- nav
- main
- section
- article
- footer
- buttons for actions
- links for navigation

## Keyboard

Everything interactive must be keyboard reachable.

Menu must:
- open with keyboard
- close with keyboard
- maintain sensible focus

## Focus

Provide visible focus states.

Do not rely on cursor effects as the only interaction feedback.

## Reduced Motion

Respect:

`prefers-reduced-motion: reduce`

When active:
- reduce/disable large transforms
- reduce parallax
- simplify page transitions
- remove cursor animation
- preserve clear state changes

## Contrast

Text must remain readable against imagery and backgrounds.

## Images

Every meaningful image needs appropriate alt text.

Decorative images should use appropriate decorative semantics.

## Touch

Hover-only information must have a touch-accessible alternative.

## Interaction

Do not require precise pointer movement for essential actions.
