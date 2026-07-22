---
name: visual-design-rules
description: Safe-default visual design rules (color, layout, spacing, depth, typography) for building or reviewing any UI. Use when styling web components or pages, choosing colors, spacing, shadows, or type, or auditing a design that looks "off" and needs a concrete rule-based diagnosis.
---

# Visual Design Rules

Safe defaults from Anthony Hobday's [Visual design rules you can safely follow every time](https://anthonyhobday.com/sideprojects/saferules/). Each rule is safe to follow every time; break one only with a stated reason. When reviewing a design, check it against **every rule** below and report each violation with the rule it breaks — the review is done when all rules have been checked, not when a few issues are found.

The meta-rule that binds all others: **everything in a design must be deliberate** — whitespace, alignment, size, spacing, color, shadows. If someone points at any part, you should have an explanation for why it looks that way.

## Color

- **Near-black and near-white, never pure.** Pure black is uncomfortably high contrast; pure white is too bright. All "black"/"white" below means near-black/near-white.
- **Saturate your neutrals.** Tint blacks, whites, and grays with your accent color (<5% saturation in HSB) so the palette feels coherent.
- **Pick warm or cool, not both.** Saturated neutrals must all lean the same temperature.
- **Distinct brightness per palette color.** Colors should differ in brightness, not just hue, so they don't compete.
- **High contrast for important elements only.** Buttons and content grab attention with contrast; structural elements and shadows use as little as possible.
- **Keep container/background brightness close.** Within 12% brightness (HSB) for dark UIs, 7% for light UIs.
- **Lower the contrast of icons paired with text.** Icons look heavier than their labels; dim them (opacity or color) to balance.

## Layout & Spacing

- **Everything aligns with something.** An element aligned with nothing feels like it doesn't belong. Optical alignment beats mathematical alignment for odd shapes — align by eye when the visual center differs from the mathematical one.
- **Measurements come from a scale.** Derive all spacing and sizes from one system (e.g. multiples of 8).
- **Horizontal grids get 12 columns.** Divides cleanly into 1, 2, 3, and 4.
- **Outer padding ≥ inner padding.** Space between elements and the container edge should equal or exceed space between the elements themselves — contents are more related to each other than to the container.
- **Space between points of high contrast.** Measure gaps from one contrast edge to the next (e.g. from text end to the start of a dark band, then from the band to the next text), because eyes find edges by contrast.
- **Order elements by visual weight.** Arrange rows/columns of mixed-weight elements heaviest-first, with the heaviest against the outer edge.
- **Buttons: horizontal padding = 2× vertical.** The wide-button pattern is what reads as a button.
- **Nest corner radii properly.** Inner radius = outer radius − gap between them.
- **One hard divide at a time.** A container edge, background transition, or divider line each creates a hard divide; adjacent hard divides create clutter — merge or remove so only one carries the edge.

## Depth

- **Closer elements are lighter.** In both light and dark mode, elements nearer the user get lighter — matching the real world.
- **Shadow blur = 2× its offset.** A 4px Y-offset shadow gets 8px blur; lower opacity as elements get "closer".
- **One depth technique per interface.** Soft shadows everywhere, or hard shadows everywhere, or none — mixing reads as unprofessional.
- **Dark interfaces convey depth without shadows.** Shadows barely read on dark backgrounds; use lightness (rule above) instead.
- **Borders contrast with both sides.** A container's 1px border should be lighter (dark UI) or darker (light UI) than *both* the container and the page background — never a value between them.

## Typography

- **Body text ≥ 16px.** Larger is easier to read.
- **Line length ~70 characters.** 60–80 is fine; beyond that, readability suffers.
- **Big text: tighter. Small text: looser.** Lower letter spacing and line height as text grows; raise them as it shrinks.
- **Two typefaces at most.** A second reinforces the concept; a third confuses.

## Composition

- **Simple on complex, or complex on simple.** A busy gradient background needs plain text; an intricate foreground needs a plain background. Simple-on-simple is safe but plain; keep complex-on-complex out of reach.
