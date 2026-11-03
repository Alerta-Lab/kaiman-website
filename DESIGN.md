---
name: Kaiman Blog
description: Quiet Signal — clear branded reading and a direct admin console for Kaiman Studio (lives under /[locale]/blogs inside landing-kaiman; landing keeps its own ink surfaces).
colors:
  primary: "#6B48E9"
  primary-100: "#EBEAFD"
  primary-200: "#D8D7FD"
  primary-300: "#BBB7FB"
  primary-400: "#998EF7"
  primary-500: "#7660F2"
  primary-700: "#552DD4"
  primary-800: "#4725B2"
  primary-900: "#3B2092"
  ink: "#212121"
  ink-capsule: "#363636"
  ink-stroke: "#404040"
  ink-panel: "#1a1a1a"
  white: "#FFFFFF"
  error: "#ff6b6b"
  error-100: "#FFE5E5"
  error-700: "#C93A3A"
  success: "#80ff91"
  success-100: "#E8FFEB"
  success-700: "#3BB84F"
  warning: "#FCD34D"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(2.75rem, 6vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Quicksand, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Quicksand, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "0.125rem"
  DEFAULT: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  2xl: "1rem"
spacing:
  gap-tight: "0.25rem"
  gap-chip: "0.5rem"
  gap-control: "0.75rem"
  gap-section: "1rem"
  gap-block: "1.5rem"
  gap-page: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1.25rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-700}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.primary-800}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1.25rem"
    height: "2.75rem"
  chip-tag:
    backgroundColor: "{colors.primary-100}"
    textColor: "{colors.primary-800}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.625rem"
  card-post:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  input-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0.75rem 1rem"
    height: "3rem"
---

# Design System: Kaiman Blog

## Overview

**Creative North Star: "The Quiet Signal"**

Kaiman Blog should feel clear, practical, and secure. The brand name and violet accent are the signal; everything else stays calm so reading and publishing stay easy. Public pages lead with Kaiman, one headline, one supporting line, and purposeful CTAs into the Studio app. Admin surfaces prioritize scanability over expression, using the same tokens with denser structure.

Depth comes from lavender fields and ink text, not glow, glass, or theatrical shadow. Space Grotesk carries authority in headlines; Quicksand Medium keeps body copy readable without looking thin.

**Key Characteristics:**
- Brand-first public heroes with Kaiman as a display signal
- Wizard violet (`primary`) as the only accent voice
- Flat tonal layering; editorial cards with light borders
- Space Grotesk + Quicksand Medium pairing
- Visible primary focus rings and 44px+ controls

## Colors

A single violet brand ramp on white and ink neutrals, with semantic status colors for admin feedback.

### Primary
- **Kaiman Violet** (`#6B48E9` / primary-600): CTAs, links, focus, active nav.
- **Lavender Mist** (`#EBEAFD`–`#D8D7FD`): page washes, soft panels, chip backgrounds.
- **Violet Depth** (`#552DD4`–`#3B2092`): hover, emphasis text on light surfaces.

### Neutral
- **Ink Black** (`#212121`): primary text.
- **Ink Panel** (`#1a1a1a`) / **Ink Capsule** (`#363636`): admin chrome.
- **White** (`#FFFFFF`): reading surface and card fill.

### Semantic
- **Error** (`#ff6b6b`), **Success** (`#80ff91`), **Warning** (`#FCD34D`) for status only—not decoration.

**The One Voice Rule.** Primary violet is the only brand accent on a surface. Feature hues exist for product taxonomy elsewhere and stay out of chrome.

## Typography

**Display/Headline Font:** Space Grotesk (sans-serif)
**Body Font:** Quicksand Medium / 500 (sans-serif)

**Character:** Geometric display confidence paired with friendly, medium-weight reading type. Never substitute Inter/Roboto/system UI as the brand voice.

### Hierarchy
- **Display** (700, clamp ~2.75–3.75rem, tight tracking): brand wordmark and page heroes.
- **Headline** (700, ~1.5–2.5rem): section and card titles.
- **Title** (700, ~1.25rem): admin and dense UI headings.
- **Body** (500, 1rem, ~1.625 lh, max ~40–42rem measure): paragraphs and excerpts.
- **Label** (700, 0.875rem): chips, meta, shortcuts.

**The No-Kicker Rule.** Headings carry their own weight. No eyebrow/pill label above a headline.

## Layout

Public content uses a `max-w-7xl` shell with `px-5` / `lg:px-8`. Article reading locks to `max-w-3xl`. Spacing follows the project gap scale: tight → chip → control → section → block → page. Group related items tightly; separate sections with `gap-page`. Hero remains full-bleed with brand, one headline, one sentence, and a CTA group.

## Elevation & Depth

Flat by default. Depth is tonal: `primary-100/200/300` bands, white cards on lavender, and `primary-200` borders. No multi-layer soft shadows, glow halos, or backdrop blur as decoration.

**The Flat-By-Default Rule.** Prefer border + tone over shadow. Hover may shift border/background only.

## Shapes

Standard control radius is `lg` (8px). Chips use `md`. Panels/cards use `xl`/`2xl` sparingly. Logo marks sit on black rounded squares. Avoid pill clusters and ambient organic cutouts as structure.

## Components

Refined and direct.

### Buttons
- **Shape:** `rounded-lg`, min-height 44–48px
- **Primary:** `bg-primary` / white text; hover `primary-700`
- **Secondary:** white fill, `primary-700` border, `primary-800` text
- **Focus:** 2px `primary` outline, 4px offset

### Chips
- Soft `primary-100` fill, `primary-800` bold label, `rounded-md`

### Cards / Containers
- Editorial: mobile list rule; desktop thin `primary-200` border, white fill, no lift shadow
- Internal padding from `gap-block`

### Inputs / Fields
- White field, `black-stroke` border, `rounded-lg`, min-height 48px
- Focus uses the global primary ring

### Navigation
- Public: white bar, logo+wordmark, search, external login/register
- Admin: `ink-panel` sidebar, `primary` active item, white content pane

## Do's and Don'ts

### Do:
- **Do** lead public heroes with the Kaiman mark/name before any marketing headline.
- **Do** use tokens from `tailwind.config.ts` only—no arbitrary hex in components.
- **Do** keep login/register CTAs pointed at `app.kaimanstudio.ai`.
- **Do** maintain WCAG 2.2 AA contrast; tint secondary text toward the surface hue when needed.

### Don't:
- **Don't** add eyebrow kickers, gradient text, glass, or glow.
- **Don't** use floating multi-shadow card grids as the page skeleton.
- **Don't** replace Space Grotesk / Quicksand with Inter, Roboto, or system UI.
- **Don't** invent testimonials, metrics, or brand claims not in PRODUCT.md.
