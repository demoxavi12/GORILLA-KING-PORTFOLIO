# Interaction Specification

## Cursor

### Default
Small point/dot.

### Link
`↗`

### Project
`VIEW`

### Image
`EXPLORE`

### Drag
`← DRAG →`

### Menu
`CLOSE`

### External
`↗ OPEN`

Cursor must:
- transition smoothly
- remain lightweight
- not interfere with text selection
- disappear/simplify on touch devices

## Magnetic Elements

Use magnetism only on selected buttons/links.

It should feel subtle, not like the UI is physically broken.

## Project Hover

Possible:
- image scale
- subtle displacement
- metadata change
- cursor state change

Avoid:
- excessive rotation
- noisy 3D effects
- unreadable text

## Navigation

Navigation must:
- work by mouse
- work by keyboard
- have visible focus
- not depend solely on cursor effects

## Menu

Open:
- full viewport
- strong overlay
- clear close control
- staggered navigation

Close:
- reverse transition
- restore previous visual state

## Image Interactions

Image hover effects are optional and should be restrained.

## Drag Interactions

Only use drag when the section clearly communicates that it is draggable.

## Project Expansion

If a project expands into a case study, preserve spatial continuity where practical.

## Touch

Hover-only interactions must have useful touch alternatives.
