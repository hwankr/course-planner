# Logos

The Yeungnam University (영남대학교) wordmark, as shipped in `public/`. Two files, both 297.4 × 57.3 viewBox, used only through `<img>` / `next/image` with `width: auto` and a fixed height.

- `yu-logo.svg` — the two-ink color mark. Its inks are baked into the file: `logo-navy` `#0d3f7a` for the letterforms and `logo-cyan` `#00b5d1` for the two accent strokes of the "Y" and "U". Note these differ slightly from the UI brand colors (`yu-navy` `#153974`, `yu-cyan` `#00aaca`); never recolor the mark to match the UI.
- `yu-logo-white.svg` — the single-ink reversed mark, `#fff` baked in. Use it on `yu-navy`, the hero gradients and the footer; never on white or `gray-50`.

Sizing as used in the app:

| Placement | File | Height |
| --- | --- | --- |
| Dashboard nav bar | `yu-logo.svg` | 20px, 24px from `md` |
| Landing page header | `yu-logo.svg` | 24px |
| Login / register brand panel | `yu-logo-white.svg` | 48px, 24px bottom margin |
| Login / register mobile header | `yu-logo.svg` | 24px |
| Footer | `yu-logo-white.svg` | per Footer component |

Alt text is always `영남대학교`. Keep clear space of at least the mark's cap height around it; do not place it on `yu-cyan`.
