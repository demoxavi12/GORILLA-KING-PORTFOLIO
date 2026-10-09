# Component Architecture

## Principles

- Components should have one clear responsibility.
- Avoid one giant page component.
- Separate content/data from presentation.
- Centralize motion primitives.
- Keep route components readable.

## Suggested Structure

```text
src/
├── app/
├── components/
│   ├── navigation/
│   ├── cursor/
│   ├── hero/
│   ├── typography/
│   ├── projects/
│   ├── archive/
│   ├── transitions/
│   └── ui/
├── data/
├── motion/
├── hooks/
├── lib/
└── styles/
```

## Motion Layer

```text
motion/
├── lenis.ts
├── gsap.ts
├── transitions.ts
├── presets.ts
└── scroll.ts
```

## Component Categories

### Layout
- Page shell
- Section wrapper
- Grid
- Container

### Navigation
- Header
- Menu
- Menu item

### Motion
- Reveal
- Masked text
- Scroll scene
- Page transition

### Projects
- Project scene
- Project metadata
- Project visual
- Project transition
- Case-study blocks

### Archive
- Archive gallery
- Archive item
- Image viewer

### UI
- Magnetic link
- Cursor label
- Status label
- External link

## Rule

Do not create a new component merely to wrap a single line of JSX unless it improves clarity or reuse.
