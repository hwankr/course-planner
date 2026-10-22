# App Icons

The PWA and platform icons declared in `src/app/manifest.ts` and the Next.js metadata files, copied verbatim.

- `icon-192x192.png`, `icon-512x512.png` — standard PWA icons (`purpose: any`).
- `icon-maskable-192.png`, `icon-maskable-512.png` — maskable variants with safe-zone padding for Android launchers.
- `apple-icon.png` — 180 × 180 iOS home-screen icon.
- `opengraph-image.png` — 1200 × 630 social preview, shared by Open Graph and Twitter cards. Title: "YU 수강 플래너".

Manifest values that travel with these: `name` "YU 수강 플래너", `short_name` "YU플래너", `theme_color` `yu-theme-color` (`#154878`), `background_color` `gray-50` (`#f9fafb`), `display: standalone`. Do not regenerate these from the SVG logo; they are the published set.
