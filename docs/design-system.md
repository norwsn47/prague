# Prague Marathon Spectator — Design System Reference

Paste this into any AI coding tool working on the Prague Marathon Spectator Planner (https://prague.outbuild.uk) to ensure all designs align with the Outbuild design system.

This app is a marathon spectator planner with a map-based route view, runner tracking, elevation profile, time-of-day slider, and spectator markers.

---

## Colour Scheme: Ocean

This app uses the **Ocean** scheme. Never use colours from other Outbuild schemes.

| Role    | Hex     | Use for                                                        |
|---------|---------|----------------------------------------------------------------|
| Header  | #6AA0B0 | Header bar background, modal headers, section banners          |
| Primary | #4D8898 | Buttons, active/selected states, checkmarks, progress, icons   |
| Accent  | #8AC0BC | Left-edge stripes, decorative borders, hover highlights, badges|

### Derived Tints (compute from Ocean colours)

| Token        | Value / Formula                     | Use for                               |
|--------------|-------------------------------------|---------------------------------------|
| Muted Text   | #4D8898 at 50% opacity on white     | Secondary text, metadata labels       |
| Soft Fill    | #4D8898 at 25% opacity on white     | Hover backgrounds, selected tag fills |
| Tint Wash    | #8AC0BC at 15% opacity on white     | Subtle panel backgrounds, empty states|
| Header Light | #6AA0B0 at 20% opacity on white     | Section divider backgrounds           |

CSS: `color: rgb(from #4D8898 r g b / 0.5);`

### Shared Neutrals

| Token       | Hex     | Usage                                        |
|-------------|---------|----------------------------------------------|
| White       | #FFFFFF | Page backgrounds, card surfaces, knock-outs  |
| Off-White   | #F5F6F4 | Panel fills, input backgrounds, subtle contrast |
| Light Grey  | #E0E0E0 | Borders, dividers, disabled controls         |
| Medium Grey | #9E9E9E | Placeholder text, inactive tabs, hint icons  |
| Charcoal    | #2C2C2C | Body text, headings, high-contrast elements  |

### Dark Mode Neutral Swaps (if supported)

Scheme colours stay the same. Only neutrals change:

| Light token | Dark mode value |
|-------------|-----------------|
| White       | #1A1A1A         |
| Off-White   | #242424         |
| Light Grey  | #3A3A3A         |
| Medium Grey | #707070         |
| Charcoal    | #E8E8E8         |

### Colour Rules

1. 2–3 colours max per component from Ocean + neutrals.
2. WCAG AA contrast minimum on all text and interactive elements.
3. Never mix colours from other Outbuild schemes (Fern, Slate, Ember, Saffron, Berry).
4. Primary (#4D8898) anchors the app — it appears on all key interactive elements.
5. Accent (#8AC0BC) is for small highlights only — never as a background fill for large areas.

---

## Typography

### Font Stack

```css
--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
--font-mono: "SF Mono", "Fira Code", "Consolas", monospace;
```

No custom web fonts. System font stack only.

### Type Scale

| Token   | Size  | Weight | Line-height | Use for                              |
|---------|-------|--------|-------------|--------------------------------------|
| title   | 20px  | 700    | 1.3         | Page title ("Prague Marathon")       |
| heading | 16px  | 600    | 1.4         | Section headings, panel titles       |
| body    | 14px  | 400    | 1.5         | Runner names, list labels, body text |
| small   | 12px  | 400    | 1.4         | Pace text, metadata, tab labels      |
| caption | 11px  | 500    | 1.3         | Timestamps, badge text, pill labels  |
| micro   | 10px  | 600    | 1.2         | Counter badges, status indicators    |

### Text Colours

| Context             | Colour                     |
|---------------------|----------------------------|
| Primary text        | Charcoal (#2C2C2C)         |
| Secondary text      | Medium Grey (#9E9E9E)      |
| Metadata / muted    | #4D8898 at 50% opacity     |
| Links / interactive | Primary (#4D8898)          |
| Disabled            | Light Grey (#E0E0E0)       |
| On dark backgrounds | White (#FFFFFF)            |

### Typography Rules

- All caps + letter-spacing (1–2px) for status counters only. Never for body text or headings.
- No underlines on links — use colour alone. Underline only on hover if needed.

---

## Spacing

### Base Unit: 4px

| Token | Value | Common use                            |
|-------|-------|---------------------------------------|
| xs    | 4px   | Inline icon-to-text gap               |
| sm    | 8px   | Inside pills, between small elements  |
| md    | 12px  | List item padding, card internal gaps |
| lg    | 16px  | Section padding, card/panel padding   |
| xl    | 20px  | Panel padding, major section gaps     |
| 2xl   | 24px  | Page-level horizontal padding         |
| 3xl   | 32px  | Page top/bottom padding               |

### Border Radii

| Token       | Radius | Use for                                 |
|-------------|--------|-----------------------------------------|
| none        | 0      | Dividers, full-bleed elements           |
| sm          | 4px    | Small tags, micro badges                |
| md          | 8px    | Cards, panels, dropdowns, modals        |
| lg          | 12px   | Search inputs, large cards, map frame   |
| pill        | 9999px | Pills, filter buttons, sign-out button  |
| circle      | 50%    | Avatars, checkmark circles, action icons|

---

## Page Structure

```
┌─────────────────────────────┐
│ Header bar (48–56px tall)   │
│ Background: #6AA0B0         │
│ Text: White, 16px, wt 600  │
│ [3px Accent stripe #8AC0BC] │
├─────────────────────────────┤
│ Content area                │
│  padding: 24px horizontal   │
│  padding: 16px top          │
│                             │
│  ┌───────────────────────┐  │
│  │ Map / route view      │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Runner list / panels  │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Elevation profile     │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Time slider           │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### Accent Stripe

A **3px tall horizontal stripe** in Accent (#8AC0BC), full width, placed directly below the header bar. This is a signature Outbuild detail — never omit it.

### Responsive Breakpoints

| Token   | Width     | Behaviour                                        |
|---------|-----------|--------------------------------------------------|
| mobile  | < 480px   | Single column, full-width panels, 20px padding   |
| tablet  | 480–768px | Content centred at 480px max, 24px padding       |
| desktop | > 768px   | Content centred at 720px max (map/dashboard app) |

- Header bar is always fixed-top.
- Modals become bottom sheets on mobile (border-radius top-only: 12px).

---

## Components

### Header Bar

```
Height:         48–56px
Background:     #6AA0B0 (Header)
Text:           White, 16px, weight 600
Padding:        0 16px
Layout:         Flex row, space-between, vertically centred
```

Contains: app title "Prague Marathon" (left), action buttons (right) — pill-shaped with 1px white/30% border, or icon-only.

Below the header: always the **3px #8AC0BC Accent stripe**, full width.

### Buttons

**Primary button:**
```
Height:         40px
Background:     #4D8898 (Primary)
Text:           White, 11px, weight 700, uppercase, 1px letter-spacing
Border-radius:  9999px (pill)
Padding:        0 20px
Hover:          #4D8898 darkened 10%
Active:         #4D8898 darkened 15%
Disabled:       #E0E0E0 bg, #9E9E9E text
```

**Secondary button:**
```
Same dimensions as primary
Background:     White
Text:           #4D8898
Border:         1.5px #4D8898
Hover:          Soft Fill background (#4D8898 at 25%)
```

**Ghost button:**
```
Same dimensions
Background:     transparent
Text:           #4D8898
Border:         none
Hover:          Soft Fill background
```

### Cards / Panels

```
Background:     White (#FFFFFF)
Border:         1px #E0E0E0 (or none with shadow)
Border-radius:  8px (md)
Padding:        16px (lg)
Shadow:         0 1px 3px rgba(0,0,0,0.06) — optional, use sparingly
Internal gap:   12px (md)
```

### List Items (Runner rows)

```
Layout:         Flex row, vertically centred
Padding:        14px 0
Border-bottom:  1px #E0E0E0 (last item: none)
Gap:            12px between elements
```

Anatomy:
```
[Circle indicator]  [Text block]                    [Action icon]
     28px            flex: 1                             32px
                     ├── Name: body (14px), #2C2C2C
                     └── Pace/metadata: small (12px), Muted Text
```

### Circle Indicator (Checkbox)

```
Size:           28px
Border-radius:  50%
```

| State       | Background | Border              | Content                            |
|-------------|-----------|---------------------|------------------------------------|
| Unchecked   | White     | 2px #E0E0E0        | empty                              |
| Checked     | #4D8898   | none                | White checkmark (14px, 2px stroke) |
| Planned     | White     | 2px #4D8898 at 40%  | small #4D8898 dot (8px)            |

Transition: 150ms ease on background and border.

### Text Inputs

```
Height:         40px
Background:     #F5F6F4 (Off-White)
Border:         1px #E0E0E0
Border-radius:  8px (md)
Padding:        0 12px
Font:           14px (body)
Placeholder:    #9E9E9E
Focus:          1px #4D8898 border, 0 0 0 2px rgba(77,136,152,0.15) shadow
Error:          1px #D44 border
```

### Filter Pills

```
Height:         32px
Border-radius:  9999px (pill)
Padding:        0 14px
Font:           11px, weight 600
Gap:            8px between pills
```

| State   | Background              | Text     | Border                 |
|---------|-------------------------|----------|------------------------|
| Default | White                   | #2C2C2C  | 1px #E0E0E0           |
| Active  | #4D8898                 | White    | none                   |
| Hover   | #4D8898 at 15%          | #4D8898  | 1px #4D8898 at 30%    |

### Modals / Dialogs

```
Background:     White
Border-radius:  8px (md)
Padding:        20px (xl)
Shadow:         0 8px 32px rgba(0,0,0,0.12)
Overlay:        rgba(0,0,0,0.3)
Max-width:      400px
On mobile:      Bottom sheet, border-radius top-only 12px
```

### Toast / Notification

```
Background:     #2C2C2C (Charcoal)
Text:           White, 12px (small)
Border-radius:  8px (md)
Padding:        12px 16px
Position:       Bottom-centre, 24px from edge
Shadow:         0 4px 12px rgba(0,0,0,0.15)
Duration:       3 seconds, fade out
Success:        #4D8898 background instead of Charcoal
```

### Progress / Completion Bars

```
Track height:   6px
Track bg:       #E0E0E0
Fill:           #4D8898 (Primary)
Border-radius:  9999px (pill) on both track and fill
```

### Badges / Tags

```
Height:         22px
Border-radius:  4px (sm)
Padding:        0 8px
Font:           10px, weight 600
Background:     #4D8898 at 25% (Soft Fill)
Text:           #4D8898
```

### Action Icons

```
Size:           32px tap target, 20px visual icon
Colour:         #E0E0E0 default
Hover:          #9E9E9E
Active/pressed: #4D8898
Style:          Outlined / line-style, 1.5px stroke
```

### Star Ratings (if used)

```
Icon size:      20px
Filled:         #8AC0BC (Accent)
Empty:          #E0E0E0
Gap:            2px
```

---

## In-App Iconography

- Style: Outlined / line-style, 1.5px stroke at 20px, 2px stroke at 24px.
- Grid: 24px grid with 2px padding (20px live area).
- Corners: 1px radius on line joins.
- Shapes: Geometric only.
- Colour: Single colour — #9E9E9E default, #4D8898 when active.

---

## Motion & Transitions

| Property         | Duration | Easing      | Use for                   |
|------------------|----------|-------------|---------------------------|
| colour / opacity | 150ms    | ease        | Hover states, focus rings |
| transform        | 200ms    | ease-out    | Button presses, toggles   |
| layout shifts    | 250ms    | ease-in-out | Tab changes, panel reveals|
| modal enter      | 200ms    | ease-out    | Scale from 0.95 + fade in|
| modal exit       | 150ms    | ease-in     | Fade out                  |
| toast enter      | 300ms    | ease-out    | Slide up + fade in        |

- No bounce or spring easing.
- Respect `prefers-reduced-motion` — disable transforms, use opacity-only.
- No decorative animation. Motion is subtle and functional.

---

## Accessibility

- All text meets WCAG AA contrast (4.5:1 body, 3:1 large text).
- Interactive elements have minimum 44×44px tap targets.
- Focus states visible on all controls (#4D8898 border + shadow ring).
- Icons paired with text labels (icon-only buttons get `aria-label`).
- Colour is never the sole indicator — always pair with shape or text.
- `prefers-reduced-motion` respected.

---

## Design Rules Summary

1. Use **only** Ocean scheme colours (#6AA0B0, #4D8898, #8AC0BC) + shared neutrals.
2. Primary (#4D8898) on all key interactive elements — buttons, active states, links.
3. Accent (#8AC0BC) for small highlights only — stripes, badges, star fills.
4. 3px Accent stripe below header — always present.
5. Flat design only. No gradients, no heavy shadows, no 3D.
6. System font stack. No custom web fonts.
7. Fewer elements, generous white space, clear hierarchy.
