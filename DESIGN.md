# Bookking Design System - "Editorial Ledger"

This document is the gate for every screen. If a change violates a rule here, the change is wrong.

## Direction

Bookking looks like a well-set financial journal, not a SaaS landing page. Quiet, precise,
dense where density helps, generous where the numbers need room. References:

- Copilot Money - the quiet confidence of a premium ledger; nothing shouts.
- Monarch - information density that never feels crowded; the Sankey as centerpiece.
- Linear - spacing that feels decided, not defaulted.

## Nevers (hard rules)

1. Never Inter, Geist, or system-ui as the identity face.
2. Never purple/indigo gradients, or any decorative gradient.
3. Never `bg-blue-600`-style primary buttons. Primary actions are ink on parchment or copper.
4. Never glassmorphism, frosted panels, or drop-shadow-heavy cards.
5. Never fade-up-on-scroll animations or hover scale transforms on cards.
6. Never three-equal-card grids as a layout crutch.
7. Never generic copy: "streamline", "empower", "transform", "unlock", "journey", "Get started".
8. Never pure #000 or #FFF; ink and parchment only.
9. Never icon soup in navigation. Nav is typographic.
10. Never default chart-library colors.

## Typography

| Role | Face | Notes |
|------|------|-------|
| Display / large numbers | Newsreader (serif) | Headings, hero figures. Weight 500, tight leading. |
| UI / body | IBM Plex Sans | Weights 400/500/600. |
| Money & tabular data | IBM Plex Mono | Always `font-variant-numeric: tabular-nums`. Every monetary amount, no exceptions. |

Scale (rem): 0.75 / 0.8125 / 0.875 / 1 / 1.25 / 1.75 / 2.5 / 3.5.

## Color tokens

| Token | Value | Use |
|-------|-------|-----|
| `--parchment` | `#F7F4EF` | App background |
| `--surface` | `#FCFBF8` | Cards, panels |
| `--ink` | `#1A1814` | Primary text |
| `--ink-muted` | `#6E675C` | Secondary text, labels |
| `--line` | `#E3DDD2` | Borders, dividers |
| `--line-strong` | `#C9C1B2` | Emphasized rules |
| `--copper` | `#B87333` | Income, primary accent |
| `--copper-deep` | `#96591F` | Income hover/active |
| `--slate` | `#2C3E50` | Expense emphasis |
| `--sage` | `#6B7F6A` | Secondary accent, neutral positive |
| `--wine` | `#8C3B2E` | Destructive, deficit |

Semantic color carries meaning only: copper = money in, slate = money out, wine = deficit or
destructive. Color is never decoration.

Profile chart palette (assignable): `#6B7F6A`, `#B87333`, `#2C3E50`, `#8C6D9E` (muted plum,
used sparingly for profiles only), `#A8763E`, `#4E6E81`.

## Spacing & layout

- Base unit 4px; scale 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Overview uses an asymmetric 68/32 split: charts left, summary rail right.
- Ledger is a real `<table>`: sticky header, hairline zebra (`--surface` alternating), tabular figures.
- Sidebar is narrow (208px), typographic, no icons. Small-caps section labels.
- Corners: 2px on inputs and buttons, 4px on panels. Nothing pill-shaped except profile dots.

## Motion

- One signature motion: monetary totals morph (tabular digits crossfade ~180ms) when the
  period or filter changes. Nothing else animates for decoration.
- State transitions (menu open, row delete) use 120–160ms ease-out, opacity + ≤4px translate.
- `prefers-reduced-motion: reduce` disables all of it.
- Custom `:focus-visible` (1.5px copper outline, 2px offset) and `::selection` (copper on parchment).

## Copy

- Specific over generic: "No irregular expenses in July", "Rate from ECB · updated 2 h ago",
  "Log July rent".
- Buttons are verbs with objects: "Add entry", "Save template", "Delete profile".
- Numbers get context: variance is "+ 240 kr over projection", never a bare delta.

## Brand details

- Favicon: double-rule ledger mark (₿-free; an open-book double rule in ink on parchment).
- Custom 404: "This page isn't on the books."
