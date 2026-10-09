# Projects Specification

## Rule

Every project displayed must be based on verified information.

## Project Record

Each project should have:

```ts
type Project = {
  slug: string
  title: string
  year?: string
  category?: string
  role?: string
  description: string
  shortDescription?: string
  technologies: string[]
  problem?: string
  approach?: string
  solution?: string
  results?: string[]
  features?: string[]
  github?: string
  live?: string
  images?: {
    src: string
    alt: string
  }[]
  featured?: boolean
}
```

Optional fields should remain optional.

## Project Presentation

Each project should support:

1. Editorial introduction
2. Large visual
3. Metadata
4. Short summary
5. Detailed case-study narrative where available
6. Technology/system details
7. Links
8. Next-project transition

## Selection

The homepage should feature only the strongest projects.

Do not show every project merely to increase count.

## Visual Priority

Projects should be treated as visual stories, not cards.

## Current Data

Final project list: **TBD — requires approved Sabya project/resume content.**

Do not infer projects from another person's portfolio.
