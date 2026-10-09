# Performance Specification

## Goal

Create an experience that feels premium without becoming technically heavy.

## Principles

- Optimize images before animation.
- Prefer transforms over layout changes.
- Avoid unnecessary React state updates on every animation frame.
- Keep scroll listeners centralized.
- Use requestAnimationFrame through appropriate animation systems.
- Lazy-load noncritical media.
- Dynamically load heavy 3D/WebGL experiences.
- Pause offscreen expensive effects.
- Avoid unnecessary observers/listeners.
- Remove debug logging before production.

## Images

Use Next.js image optimization where appropriate.

Provide:
- correct dimensions
- appropriate formats
- responsive sizes
- lazy loading for noncritical images

## Animation

Prefer:
- transform
- opacity
- clip-path where practical

Be careful with:
- filters
- large blur
- paint-heavy effects
- continuously animated canvas
- huge DOM trees

## 3D

3D is optional.

If introduced:
- lazy-load
- provide mobile fallback
- provide reduced-motion fallback
- keep geometry/material complexity reasonable

## Performance Review

Check:
- initial load
- scroll smoothness
- image loading
- route transitions
- mobile behavior
- memory usage during long scrolling

## Definition

Visual quality is not an excuse for poor usability or severe jank.
