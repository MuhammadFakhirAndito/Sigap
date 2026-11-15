---
name: Verdro
description: Nature-inspired interior decor brand for sculptural moss walls, stone art, and eco light features.
colors:
  primary: '#6AA400'
  primary-hover: '#5A8C00'
  primary-subtle: '#E8F2D8'
  background: '#FAFAFA'
  surface: '#F5F5F1'
  surface-strong: '#FFFFFF'
  text-primary: '#0D0D0D'
  text-secondary: '#6F6F68'
  text-muted: '#8B8B85'
  border: '#E5E5DE'
  success: '#6AA400'
  warning: '#D99A2B'
  error: '#C44A3A'
typography:
  h1:
    fontFamily: 'Lufga, Inter, sans-serif'
    fontSize: 4.375rem
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: -0.03em
  h2:
    fontFamily: 'Lufga, Inter, sans-serif'
    fontSize: 3.375rem
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: -0.02em
  h3:
    fontFamily: 'Lufga, Inter, sans-serif'
    fontSize: 2.375rem
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: -0.01em
  h4:
    fontFamily: 'Lufga, Inter, sans-serif'
    fontSize: 1.375rem
    fontWeight: 400
    lineHeight: 1.25
  body-lg:
    fontFamily: 'Lufga, Inter, sans-serif'
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: 'Lufga, Inter, sans-serif'
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  label-sm:
    fontFamily: 'Lufga, Inter, sans-serif'
    fontSize: 0.875rem
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: 'Lufga, Inter, sans-serif'
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
rounded:
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  2xl: 28px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px
  5xl: 128px
components:
  button-primary:
    backgroundColor: '{colors.text-primary}'
    textColor: '{colors.background}'
    rounded: '{rounded.full}'
    padding: '14px 24px'
  button-primary-hover:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.text-primary}'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.text-primary}'
    borderColor: '{colors.border}'
    rounded: '{rounded.full}'
    padding: '12px 20px'
  icon-button:
    backgroundColor: '{colors.surface-strong}'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.full}'
    size: '40px'
  card-product:
    backgroundColor: '{colors.surface}'
    rounded: '{rounded.lg}'
    padding: '0'
  card-floating:
    backgroundColor: '{colors.surface-strong}'
    rounded: '{rounded.xl}'
    padding: '{spacing.md}'
    shadow: '0 8px 30px rgba(13,13,13,0.06)'
  input:
    backgroundColor: '{colors.surface-strong}'
    textColor: '{colors.text-primary}'
    borderColor: '{colors.border}'
    rounded: '{rounded.sm}'
    padding: '12px 14px'
  tag:
    backgroundColor: 'rgba(245,245,241,0.78)'
    textColor: '{colors.text-primary}'
    rounded: '{rounded.full}'
    padding: '6px 12px'
---

## Overview
Verdro is a nature-inspired interior decor brand for sculptural moss walls, stone art, and eco light features. The experience should feel calm, tactile, and premium, balancing editorial restraint with organic texture. It is designed for homeowners, interior designers, and architects who value sustainable materials and quiet modern interiors.

## Colors
Primary Green Essence is a functional accent, used for highlighted words, active states, and small emphasis moments only. Pure Mist is the page background, while Soft Cloud creates gentle section and card surfaces. Deep Charcoal is the primary text and solid button color. Pure white appears only on small floating cards that need separation from photography. Natural greens, moss, stone, and warm light come primarily from imagery, not UI fills.

## Typography
Lufga is the signature geometric sans, used in Light and Regular weights for a calm editorial tone. Large headings should be oversized but quiet, with tight tracking and generous line spacing. Body text stays readable and neutral. Labels and tags use medium weight at small sizes. Stats use tabular figures so numbers align cleanly.

## Spacing & Layout
Use an 8px spacing grid with generous section rhythm. Large sections use 96-128px vertical spacing, cards use 24px internal spacing, and grid gaps stay between 16-24px. Content max width is 1440px with wide outer margins. The layout should feel airy and gallery-like, never cramped.

## Shapes
Use soft, organic geometry. Large hero containers and image cards use 24-28px radius. Product cards use 20px radius. Pills and buttons are fully rounded. Inputs use 12px radius. Apply nested radius where a smaller element sits inside a larger rounded container.

## Elevation & Depth
Depth is mostly flat and surface-driven. Use hairline borders in Border color and only very subtle shadows on floating cards. Avoid heavy drop shadows, glassmorphism blur, and neon glow. Photography provides most of the visual depth.

## Components
Product cards are image-first with full-bleed nature photography, a circular arrow button at the top right, and product name plus price overlaid or placed below. Header navigation uses a floating pill treatment. Buttons are solid charcoal pills or outlined pills. Tags are soft translucent pills. Carousel controls are outlined circular icon buttons. Stats are oversized tabular numbers with small supporting labels.

## Rules to Never Break
- Never use pure #FFFFFF as the main page background; use Pure Mist #FAFAFA.
- Never use pure #000000 for large text or dark surfaces; use Deep Charcoal #0D0D0D.
- Never introduce saturated colors beyond Green Essence and natural image colors.
- Never use sharp corners on cards, buttons, inputs, or section containers.
- Never use heavy shadows, glassmorphism blur, or neon effects.
- Always preserve Lufga or a quiet geometric sans fallback.
- Always keep generous whitespace and an editorial, gallery-like pace.
- Always treat Green Essence as an accent, not a large decorative background.