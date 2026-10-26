# Design system handoff

This folder holds the working files behind the **Course Planner Design System** artifact, so a new session can finish it without the original conversation.

- Artifact (the deliverable): https://claude.ai/artifact/VpB7z78jR5GSQTBuQdpCcy — type "Design System", private to its owner.
- Built from: this repository at commit `b3e587f`, Tailwind CSS 4.1.18, lucide-react 0.563.0.
- Last published: see `ds/project/design-system.json` → `lastChange`.

Nothing in this folder is part of the app. `tsconfig.json` and `eslint.config.mjs` exclude `design-system-work/` so it never reaches `next build` or `npm run lint`.

## State

Every card is verified line by line against the source, and the whole bundle was audited against real Tailwind 4.1.18 output (see the note at the end of `CARD-STATUS.md`). The section docs and token usage notes were fact-checked the same way. Nothing is pending.

## When the app changes

1. Read this file and `CARD-STATUS.md`. Set up the workspace (below).
2. For each changed source file, find the cards whose README's last line names it, and run `workflows/ds-verify-fix.js` with those cards (see "Running the verification"). For section docs, re-check the claims that mention the changed files.
3. Rebuild, run the checks, look at the renders, publish only the changed files, and commit this folder.

## Workspace setup

All tools use paths relative to this folder; run them from here.

```bash
cd design-system-work
# 1. Point the brief and the workflow script at this folder (they reference __WORK__)
sed -i "s#__WORK__#$PWD#g" ds-brief.md workflows/ds-component-cards.js workflows/ds-verify-fix.js
# 2. Restore the binary assets (logos, icons, PNGs) from the app into ds/project/assets — needed only for render checks
bash tools/restore-assets.sh
# 3. Rebuild tokens and the local tokens.css used by the render check
node tools/build-tokens.mjs && node tools/compile-tokens-css.mjs
# 4. Reference packages for tools/tw.mjs (exact Tailwind output) and tools/hover-media.mjs (CSS rewriting); not committed
mkdir -p vendor-pkg/tw vendor-pkg/pc
(cd vendor-pkg && npm pack tailwindcss@4.1.18 && tar -xzf tailwindcss-4.1.18.tgz -C tw)
(cd vendor-pkg/pc && npm init -y >/dev/null && npm install postcss@8.4.49)
```

Playwright: `tools/render-check.mjs` loads Chromium through `/opt/node-tools/node_modules/playwright/index.js` (the path in Claude Code cloud containers). Elsewhere, change that one line to `import { chromium } from 'playwright'`.

## Folder map

| Path | What |
| --- | --- |
| `ds/project/` | The design system exactly as published, text files only: `README.md`, section `*.md`, `tokens.json`, `design-system.json` (the index), `components/<Card>/README.md` + `preview.html`, `components/bundle.css`, `components/index.d.ts`, asset-group READMEs. Binaries are uploads recorded in the index. |
| `_work/fragments/<Card>.css` | Per-card CSS. `tools/assemble.mjs` concatenates them into `ds/project/components/bundle.css`. Edit fragments, never `bundle.css`. |
| `_work/dts/<Card>.d.ts` | Per-card prop types, concatenated into `components/index.d.ts`. |
| `tools/` | `build-tokens.mjs` (the source of `tokens.json` — edit token values and usage notes here, never in the JSON), `oklch2hex.mjs` (Tailwind oklch → hex), `compile-tokens-css.mjs` (local tokens.css for render checks), `assemble.mjs` (bundle + index.d.ts + token/fallback checks), `render-check.mjs` (headless screenshots into `render/`), `fix-markers.mjs` (sets each preview's `@dsCard height=` to the rendered height), `build-index.mjs` (writes `design-system.json`), `expand-icons.mjs` (expands `{{icon:<lucide>|<class>}}` placeholders when you write a new preview; previews are edited directly now), `report2txt.mjs`, `restore-assets.sh`. Checks added in the v4 audit: `tw.mjs` (prints the exact CSS Tailwind 4.1.18 generates for any class — the ground truth for every value), `contrast.mjs` (WCAG ratio for token names or hex, composites translucent layers, prints the figure to write), `hover-media.mjs` (moves real `:hover` selectors under `@media (hover: hover)` as v4 does, leaving `.is-hover` mirrors), `cascade-check.mjs` (finds a card's own margin/padding rules that lose to a reset; must print `total: 0`). |
| `vendor/` | `tw-hex.json` (Tailwind 4.1.18 palette in hex), `theme.css` (its source), `lucide/*.svg` (the 57 icons the app imports, lucide-static 0.563.0, ISC). |
| `ds-brief.md` | The contract every card follows: file shapes, `cp-` class naming, Tailwind v4 → CSS mapping, preview rules, contrast rules, pattern-card rules. Give it to any agent that builds or verifies a card. |
| `workflows/ds-component-cards.js` | Workflow script: build → adversarial verify → fix, one pipeline per card (for new cards). |
| `workflows/ds-verify-fix.js` | Workflow script for existing cards: adversarial verify → fix. Items with `"pending": true` skip verification and apply `pending/<Card>.md`. |
| `sweep/*.json` | Structured extraction of the codebase (classes, copy, oddities) from ten parallel readers; checklists for builders. The source code stays the truth. |
| `asset-ids.json` | Upload ids of every asset (`/_blob/<id>`), by group. |
| `pending/` | Verification findings recorded but not yet applied. |
| `CARD-STATUS.md` | Per-card state. |

## Running the verification

Run `workflows/ds-verify-fix.js` (after the `__WORK__` substitution) with items like:

```json
{"items": [
  {"name": "PageHeader", "group": "Patterns",
   "files": ["src/app/(dashboard)/planner/page.tsx", "src/app/(dashboard)/statistics/page.tsx", "src/app/(dashboard)/admin/courses/page.tsx"]}
]}
```

Fix agents edit only the card's four files and report token or cross-card changes as `token_requests` / `shared_requests`; apply those yourself (tokens in `tools/build-tokens.mjs`). Keep each workflow under ten agents; one verify plus one fix agent per card.

Each card's source files are listed in the last line of its `README.md` ("Static rendition hand-translated from …" or "Pattern extracted from inline markup in …").

After fixes:

```bash
node tools/hover-media.mjs       # idempotent; wraps any new :hover rule
node tools/assemble.mjs          # must print "all var() names are tokens" and "all fallbacks match token values"
node tools/cascade-check.mjs     # must print "total: 0"
node tools/render-check.mjs      # or name cards: node tools/render-check.mjs PageHeader Badge
node tools/fix-markers.mjs       # sync @dsCard heights to rendered heights (skips differences of 8px or less; fix those by hand)
```

Look at the PNGs in `render/` against the app's screenshots (`public/help/*.png`) before publishing.

## Publishing (Artifact tool)

Rules from the Design System type, learned the hard way:

- Publish to `url: https://claude.ai/artifact/VpB7z78jR5GSQTBuQdpCcy`, never with `type_url` (that creates a second system).
- `root` = the absolute path of this folder's `ds/` directory; `file_path` = absolute path of `ds/project/design-system.json`; `files` = only the changed files as `{"project/<path>": "project/<path>"}`.
- `components/index.d.ts` must be sent as `{"from": "project/components/index.d.ts", "contentType": "text/plain"}` — `.ts` is not a served type and the whole publish is refused otherwise.
- Before sending the index, `read` the live `project/design-system.json` from the artifact (people can edit on the page) and keep every key except `lastChange`. `node tools/build-index.mjs "<by>" "<note>" <path-to-the-read-copy>` rebuilds it while keeping `createdOnFiles`, `sections`, `blobs`, `docs` from that copy.
- Never send `tokens.css`, `manifest.json`, `api/` cards, `index.html`, `SKILL.md` or anything under `artifact-type/`; the page generates or owns them.
- New images or SVGs go up as uploads first (`publish` with `asset: true`, `url`, `file_paths`), then their records go into `asset-ids.json` and the index.

## Conventions to keep

- Code is the truth. Values are exact Tailwind v4 values; a bare `border` is `1px solid currentColor` (`border-default`, gray-900 on Cards) — this is how the product renders, not a mistake to fix.
- Source defects are documented in READMEs and token notes, never silently corrected (contrast misses, dead `animate-in` classes, the hero CTA gradient, the v3 `bg-opacity-50` overlay).
- Every CSS value is `var(--token, exact-literal)`; `assemble.mjs` checks both the name and the literal.
- Tailwind v4 semantics, checked with `tools/tw.mjs`: `space-y-*`/`space-x-*` are `.parent > :not(:last-child) { margin-bottom / margin-right }` with any child's own margin reproduced after it; real `:hover` rules live in `@media (hover: hover)`; `transition-colors` includes `outline-color`.
- Contrast figures come from `tools/contrast.mjs` (half-up to one decimal, never rounded up onto a 3.0 / 4.5 / 7.0 threshold it misses); misses kept from the source read "kept, flagged".
- READMEs: first sentence is the card subtitle; sections Use it for / What the consumer provides / Anatomy and states / Copy / Accessibility / Not reproduced; last line names the source files.
