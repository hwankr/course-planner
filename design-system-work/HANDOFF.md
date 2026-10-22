# Design system handoff

This folder holds the working files behind the **Course Planner Design System** artifact, so a new session can finish it without the original conversation.

- Artifact (the deliverable): https://claude.ai/artifact/VpB7z78jR5GSQTBuQdpCcy — type "Design System", private to its owner.
- Built from: this repository at commit `b3e587f`, Tailwind CSS 4.1.18, lucide-react 0.563.0.
- Last published: see `ds/project/design-system.json` → `lastChange`.

Nothing in this folder is part of the app. `tsconfig.json` and `eslint.config.mjs` exclude `design-system-work/` so it never reaches `next build` or `npm run lint`.

## What to do next

1. Read this file, then `CARD-STATUS.md` (which cards still need line-by-line verification, and any findings already recorded but not applied, in `pending/`).
2. Set up the workspace (below), apply any recorded findings in `pending/`, run the verification workflow for the cards marked "verify", rebuild, render-check, and publish only the changed files.
3. Update `CARD-STATUS.md` and the README's "Not synced" paragraph (`ds/project/README.md`, last section) when everything is verified, and commit.

## Workspace setup

All tools use paths relative to this folder; run them from here.

```bash
cd design-system-work
# 1. Point the brief and the workflow script at this folder (they reference __WORK__)
sed -i "s#__WORK__#$PWD#g" ds-brief.md workflows/ds-component-cards.js
# 2. Restore the binary assets (logos, icons, PNGs) from the app into ds/project/assets — needed only for render checks
bash tools/restore-assets.sh
# 3. Rebuild tokens and the local tokens.css used by the render check
node tools/build-tokens.mjs && node tools/compile-tokens-css.mjs
```

Playwright: `tools/render-check.mjs` loads Chromium through `/opt/node-tools/node_modules/playwright/index.js` (the path in Claude Code cloud containers). Elsewhere, change that one line to `import { chromium } from 'playwright'`.

## Folder map

| Path | What |
| --- | --- |
| `ds/project/` | The design system exactly as published, text files only: `README.md`, section `*.md`, `tokens.json`, `design-system.json` (the index), `components/<Card>/README.md` + `preview.html`, `components/bundle.css`, `components/index.d.ts`, asset-group READMEs. Binaries are uploads recorded in the index. |
| `_work/fragments/<Card>.css` | Per-card CSS. `tools/assemble.mjs` concatenates them into `ds/project/components/bundle.css`. Edit fragments, never `bundle.css`. |
| `_work/dts/<Card>.d.ts` | Per-card prop types, concatenated into `components/index.d.ts`. |
| `_work/tpl/<Card>.html` | Preview templates with `{{icon:<lucide>|<class>}}` placeholders, expanded by `tools/expand-icons.mjs` (only ProfileCard and HelpSection use them). |
| `tools/` | `build-tokens.mjs` (the source of `tokens.json` — edit token values and usage notes here, never in the JSON), `oklch2hex.mjs` (Tailwind oklch → hex), `compile-tokens-css.mjs` (local tokens.css for render checks), `assemble.mjs` (bundle + index.d.ts + token/fallback checks), `render-check.mjs` (headless screenshots into `render/`), `fix-markers.mjs` (sets each preview's `@dsCard height=` to the rendered height), `build-index.mjs` (writes `design-system.json`), `expand-icons.mjs`, `report2txt.mjs`, `restore-assets.sh`. |
| `vendor/` | `tw-hex.json` (Tailwind 4.1.18 palette in hex), `theme.css` (its source), `lucide/*.svg` (the 57 icons the app imports, lucide-static 0.563.0, ISC). |
| `ds-brief.md` | The contract every card follows: file shapes, `cp-` class naming, Tailwind v4 → CSS mapping, preview rules, contrast rules, pattern-card rules. Give it to any agent that builds or verifies a card. |
| `workflows/ds-component-cards.js` | Workflow script: build → adversarial verify → fix, one pipeline per card. Pass `args.items` (see "Running the verification" below). |
| `sweep/*.json` | Structured extraction of the codebase (classes, copy, oddities) from ten parallel readers; checklists for builders. The source code stays the truth. |
| `asset-ids.json` | Upload ids of every asset (`/_blob/<id>`), by group. |
| `pending/` | Verification findings recorded but not yet applied. |
| `CARD-STATUS.md` | Per-card state. |

## Running the verification

The workflow script builds, verifies and fixes. For cards that already exist, skip the build: write a small variant, or call the verify and fix prompts directly. The simplest route is to edit `workflows/ds-component-cards.js` so the first stage returns `{ it, built: { note: 'existing card' } }` instead of calling the builder, then run it with items like:

```json
{"items": [
  {"name": "PageHeader", "block": "page-header", "group": "Patterns", "height": 800,
   "files": ["src/app/(dashboard)/planner/page.tsx", "src/app/(dashboard)/statistics/page.tsx", "src/app/(dashboard)/admin/courses/page.tsx"]}
]}
```

Each card's source files are listed in the last line of its `README.md` ("Static rendition hand-translated from …" or "Pattern extracted from inline markup in …").

After fixes:

```bash
node tools/assemble.mjs          # must print "all var() names are tokens" and "all fallbacks match token values"
node tools/render-check.mjs      # or name cards: node tools/render-check.mjs PageHeader Badge
node tools/fix-markers.mjs       # sync @dsCard heights to rendered heights
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
- READMEs: first sentence is the card subtitle; sections Use it for / What the consumer provides / Anatomy and states / Copy / Accessibility / Not reproduced; last line names the source files.
