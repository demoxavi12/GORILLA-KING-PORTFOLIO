# Technology Stack

## Locked

### Framework
**Next.js**

Why:
- Routing
- Metadata
- Image handling
- Strong production architecture
- Good deployment ecosystem
- React foundation remains fully available for animation

### Language
**TypeScript**

Why:
- Safer content/data structures
- Better component contracts
- Better maintainability

### Styling
**Tailwind CSS** plus normal CSS where animation/composition requires it.

Do not force complex animation styling into utility classes if dedicated CSS is clearer.

### Scroll
**Lenis**

Role:
- Smooth scrolling
- Scroll synchronization

### Complex motion
**GSAP**

Role:
- ScrollTrigger
- Pinned scenes
- Scrubbed timelines
- Complex transitions

### UI motion
**Framer Motion**

Use only where it provides a clear benefit for component-level transitions.

### React Bits

Use selectively as:
- interaction reference
- reusable primitive
- inspiration

Do not install/use components simply because they are available.

### 3D

**React Three Fiber / Three.js — optional**

Only introduce when the design requires a genuine 3D experience.

## Dependency Rules

- Avoid duplicate libraries doing the same job.
- Do not add a dependency without a reason.
- Prefer existing platform capabilities for simple effects.
- Keep heavy dependencies lazy-loaded where possible.

## Build Rules

- TypeScript strictness should remain enabled.
- No unnecessary `any`.
- No console noise in production.
- No secret values committed to the repository.

## Deployment

Target production deployment compatible with Next.js, such as Vercel.

## Git

Never push automatically. Git pushes happen only when explicitly requested.
