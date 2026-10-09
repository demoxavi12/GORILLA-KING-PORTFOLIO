# REFERENCE GUIDE

## Purpose

This document explains how Claude should use the visual references stored in:

`/aspirations/`

The folder is a **design reference library** for the Sabya Sachin Mohanta portfolio.

Claude MUST inspect the actual files inside `/aspirations/` before making major visual, layout, motion, or interaction decisions.

These references are for extracting **principles and ideas**, not for copying designs.

---

# Reference Folder Map

## `/aspirations/hero/`

### Purpose
References specifically collected for the **Hero section**.

Use this folder to study:

- Hero composition
- Opening visual impact
- Typography scale
- Oversized type
- Name/title treatment
- Image and typography relationships
- Intro animations
- Masking and clipping
- Scroll-based hero transitions
- Layering
- Atmospheric effects
- Visual hierarchy
- First-impression storytelling

### Expected influence

The Hero should feel like the beginning of a cinematic experience rather than a normal portfolio header.

The existing portfolio's entry animation should also be considered when designing the transition from:

`Loader → Hero → First Scroll`

Do not copy a hero reference directly.

---

## `/aspirations/case-study/`

### Purpose
References for **project and case-study presentation**.

Use this folder to study:

- Project storytelling
- Editorial layouts
- Project introductions
- Large project imagery
- Metadata placement
- Typography hierarchy
- Process storytelling
- Image sequencing
- Scroll transitions
- Project navigation

Projects should feel like **experiences**, not standard cards.

---

## `/aspirations/monolith/`

### Purpose
References for **large-scale visual composition and monolithic layouts**.

Use this folder to study:

- Full-screen compositions
- Massive typography
- Large image treatment
- Minimal layouts
- Spatial hierarchy
- Strong visual anchors
- Large blocks of content
- Typography as architecture

This can influence the Hero, Selected Work, About, and Contact sections.

---

## `/aspirations/bruo/`

### Purpose
References for **editorial/creative web composition**.

Use this folder to study:

- Typography
- Grid systems
- Asymmetry
- Editorial spacing
- Image composition
- Text/image relationships
- Motion
- Creative navigation

Extract principles rather than reproducing the site's visual identity.

---

## `/aspirations/contact/`

### Purpose
References for the **Contact section and final CTA experience**.

Use this folder to study:

- Large closing typography
- Contact composition
- CTA treatment
- Minimal layouts
- Final-section transitions
- Footer relationships
- Emotional ending
- Visual pacing

The Contact section should feel like the **final scene** of the portfolio.

---

## `/aspirations/menu/`

### Purpose
References for **navigation and full-screen menu behavior**.

Use this folder to study:

- Menu opening transitions
- Full-screen navigation
- Typography
- Menu hierarchy
- Overlay composition
- Cursor interaction
- Menu closing transitions
- Navigation motion

The menu should feel like part of the visual identity, not a generic mobile-navigation overlay.

---

## `/aspirations/cinematic-mood/`

### Purpose
References for the overall **cinematic atmosphere**.

Use this folder to study:

- Lighting
- Contrast
- Darkness
- Negative space
- Image grading
- Grain
- Atmospheric depth
- Visual tension
- Stillness vs movement
- Dramatic transitions

This folder should influence the **mood**, not result in unnecessary filters or effects.

---

## `/aspirations/photography/`

### Purpose
References for **image-led storytelling and visual archive presentation**.

Use this folder to study:

- Photography layouts
- Image sequencing
- Galleries
- Cropping
- Full-bleed imagery
- Horizontal galleries
- Editorial image treatment
- Image transitions
- Visual archives

This can influence the Visual Archive section and project imagery.

---

# How Claude Should Use These References

Before implementing a major section:

1. Identify which `/aspirations/` folder is relevant.
2. Inspect the references inside that folder.
3. Identify the design principles.
4. Compare those principles with the overall portfolio blueprint.
5. Combine useful ideas from multiple references.
6. Create an original implementation.
7. Verify that the result still feels like **Sabya's portfolio**, not a recreation of a reference.

---

# Reference Priority

When a section has multiple relevant reference folders, use this order:

### Hero

`hero/` → `cinematic-mood/` → `monolith/`

### Selected Work

`case-study/` → `monolith/` → `photography/`

### Project Detail

`case-study/` → `photography/` → `cinematic-mood/`

### Navigation

`menu/` → `bruo/`

### Visual Archive

`photography/` → `cinematic-mood/`

### Contact

`contact/` → `monolith/` → `cinematic-mood/`

### Overall Art Direction

`cinematic-mood/` → `monolith/` → `bruo/`

---

# External References

The local `/aspirations/` folder should be treated as the primary visual reference library.

External references provide additional context:

- React Bits — https://reactbits.dev/
- Lenis — https://lenis.dev/
- Basement Studio — https://basement.studio/
- Higgsfield — https://higgsfield.ai/
- Behance — https://www.behance.net/
- Dribbble — https://dribbble.com/

External references should support the local inspiration library rather than override it.

---

# Current Portfolio

Current portfolio:

https://sachin-portfolio-psi-ivory.vercel.app/

Claude MUST inspect the current portfolio before redesigning it.

Pay particular attention to:

- Existing entry animation
- Existing visual identity
- Current content
- Existing information architecture
- Existing interactions
- Existing project presentation
- Existing strengths
- Areas that can be evolved

The redesign should be an **evolution**, not a completely disconnected website.

---

# Originality Rules

The portfolio MUST NOT become:

- A copy of a reference website
- A Behance clone
- A Dribbble clone
- A Basement Studio clone
- A Higgsfield clone
- A collection of React Bits effects
- A generic AI-generated portfolio
- A template with excessive animation

### Core rule

> **Borrow principles, not identities.**

References should answer:

**“What design principle can we learn from this?”**

Not:

**“How do we reproduce this?”**

---

# Motion Rules

Reference animations should be analyzed for:

- Trigger
- Duration
- Easing
- Direction
- Scale
- Velocity
- Scroll relationship
- Interaction
- Visual purpose

Do not reproduce an animation simply because it looks impressive.

Every major animation must have a reason.

Use:

- Lenis for scroll foundation
- GSAP for complex scroll timelines and pinned sequences
- Framer Motion for appropriate component-level transitions
- CSS for simple transitions
- React Bits selectively

---

# BLEACH-Inspired Motion Language

The portfolio may take abstract inspiration from the **motion language** associated with BLEACH:

- Impact
- Speed
- Pressure
- Void
- Sharp transitions
- Sudden acceleration
- Stillness → impact
- Transformation
- Strong black/white contrast
- Slash-like motion

Do NOT use:

- Copyrighted characters
- Anime screenshots
- Official artwork
- Logos
- Copied scenes
- Directly recreated anime compositions

The influence should exist through **motion, pacing, contrast, and atmosphere**.

---

# Important

Do not assume that every reference needs to appear in the final website.

The reference library exists to help make better decisions.

Some references may influence:

- One section
- One transition
- Typography
- Image treatment
- Navigation
- Motion timing
- Overall atmosphere

Others may ultimately contribute nothing.

That is acceptable.

The goal is not to use every reference.

The goal is to create the strongest possible portfolio.

---

# Final Creative Principle

The portfolio should feel like:

**A cinematic digital experience designed around Sabya's work.**

Not:

**A portfolio template with cinematic effects added to it.**

The website itself should feel like the project.
