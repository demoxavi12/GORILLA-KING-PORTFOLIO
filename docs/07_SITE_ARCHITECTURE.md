# Site Architecture

## Framework

Next.js App Router + TypeScript.

## Routes

Initial target:

```text
/
 /work
 /work/[slug]
 /about
 /contact
```

The final route count may be reduced if the experience works better as a single-page narrative.

## Primary Navigation

- Home
- About
- Work
- Archive
- Contact

## Page Strategy

### Home
Main cinematic experience.

### Work
Optional project index if the main experience needs a dedicated browse view.

### Work/[slug]
Detailed project case study.

### About
Personal/professional context.

### Contact
Direct contact scene.

## Metadata

Each public route should have:
- title
- description
- Open Graph metadata
- appropriate canonical URL strategy

## Content Separation

Do not hardcode repeated project data throughout components.

Project data belongs in a data/content layer.

## Principle

Routes should support storytelling, not dictate visual structure.
