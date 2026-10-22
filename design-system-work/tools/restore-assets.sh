#!/bin/bash
# Restores the binary assets into ds/project/assets from the app sources (run from design-system-work/).
# They are already uploaded to the artifact (ids in asset-ids.json); local copies are only needed for render checks.
set -e
R=..
A=ds/project/assets
mkdir -p "$A/Logos" "$A/App Icons" "$A/Screenshots" "$A/Icons"
cp "$R/public/yu-logo.svg" "$R/public/yu-logo-white.svg" "$A/Logos/"
cp "$R/public/icon-192x192.png" "$R/public/icon-512x512.png" "$R/public/icon-maskable-192.png" "$R/public/icon-maskable-512.png" "$A/App Icons/"
cp "$R/src/app/apple-icon.png" "$R/src/app/opengraph-image.png" "$A/App Icons/"
cp "$R"/public/help/*.png "$A/Screenshots/"
for f in vendor/lucide/*.svg; do sed '1{/^<!-- @license/d}' "$f" | sed '/^$/d' > "$A/Icons/$(basename "$f")"; done
echo "assets restored into $A"
