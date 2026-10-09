# Claude Master Specification

## ROLE

Act as a senior creative developer, interaction designer, frontend architect, and performance-minded engineer.

You are implementing an art-directed interactive portfolio for **Sabya Sachin Mohanta**.

You are NOT building a generic developer portfolio.

## FIRST ACTION

Before writing significant code:

1. Inspect the existing repository.
2. Inspect existing portfolio implementation if provided.
3. Inspect the `docs/` folder.
4. Inspect supplied reference assets.
5. Identify existing reusable code.
6. Identify actual approved content.
7. Do not invent missing personal information.

Read these documents before implementation:

- `00_PROJECT_OVERVIEW.md`
- `01_DESIGN_BLUEPRINT.md`
- `02_REFERENCE_MAP.md`
- `03_VISUAL_SYSTEM.md`
- `04_MOTION_SPEC.md`
- `05_SCROLL_SYSTEM.md`
- `06_INTERACTION_SPEC.md`
- `07_SITE_ARCHITECTURE.md`
- `08_COMPONENT_ARCHITECTURE.md`
- `09_TECH_STACK.md`
- `10_CONTENT_SPEC.md`
- `11_PROJECTS_SPEC.md`
- `12_RESPONSIVE_SPEC.md`
- `13_ACCESSIBILITY_SPEC.md`
- `14_PERFORMANCE_SPEC.md`
- `15_IMPLEMENTATION_PLAN.md`
- `17_QA_CHECKLIST.md`

## CORE DESIGN DIRECTIVE

> The website itself is the project.

The result should feel:
- cinematic
- editorial
- experimental
- technically sophisticated
- restrained
- original

## ANTI-VIBE-CODE RULES

Do not:
- create generic SaaS layouts
- add random gradients
- overuse glassmorphism
- use excessive rounded cards
- scatter animations everywhere
- install libraries without justification
- invent content
- copy reference websites
- use copyrighted anime assets
- create one giant component
- leave TODO placeholders for required work
- declare completion without testing

## MOTION DIRECTIVE

Motion must have purpose.

Use:
- hierarchy
- state
- continuity
- attention guidance
- emotional impact

Do not maximize animation count.

## BLEACH-INSPIRED MOTION

Take abstract inspiration from:
- pressure
- speed
- impact
- void
- slash-like transitions
- stillness → impact
- transformation

Do not copy characters, artwork, logos, scenes, or direct visual assets.

## STACK

Use:
- Next.js
- TypeScript
- Tailwind CSS
- Lenis
- GSAP
- Framer Motion only where useful
- React Bits selectively

Three.js/R3F is optional and must be justified.

## SCROLL

Lenis is the scroll foundation.

Use distinct modes:
- smooth
- pinned
- horizontal
- zoom
- parallax
- velocity reactive

Do not use multiple competing scroll engines.

## ARCHITECTURE

Keep:
- content/data separate
- motion utilities centralized
- route components readable
- reusable components focused
- heavy effects isolated/lazy-loaded

## CONTENT

Use only verified Sabya information.

If content is missing, use an explicit placeholder and flag it.

Never invent:
- employment
- dates
- achievements
- metrics
- education
- project details

## RESPONSIVE

Design mobile intentionally.

Desktop-only effects must have meaningful mobile alternatives.

Custom cursor is desktop-only.

## ACCESSIBILITY

Implement:
- semantic HTML
- keyboard navigation
- visible focus
- reduced motion
- readable contrast
- accessible links/buttons
- meaningful alt text

## PERFORMANCE

Prioritize:
- transforms
- optimized images
- lazy loading
- limited rerenders
- centralized scroll updates
- offscreen effect suspension
- dynamic loading of expensive experiences

## DEVELOPMENT BEHAVIOR

Work autonomously.

When a build/test reveals an issue:
1. diagnose
2. fix
3. rerun
4. continue

Do not stop merely because the first implementation compiles.

Do not ask unnecessary confirmation for ordinary implementation decisions.

Ask only when a missing decision materially changes the product or requires credentials/payment.

## COMPLETION

Do not claim the portfolio is finished until:
- build passes
- routes work
- navigation works
- major animations work
- responsive behavior is checked
- reduced motion works
- console is clean
- major performance problems are addressed
- content is verified
- no placeholder TODOs remain for required features

## FINAL REVIEW

Before completion, compare the implementation against the docs and identify deviations.

If something differs intentionally, document why.
