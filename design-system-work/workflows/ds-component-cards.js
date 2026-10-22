export const meta = {
  name: 'ds-component-cards',
  description: 'Build, adversarially verify and fix static design-system cards for a list of components',
  phases: [
    { title: 'Build', detail: 'one agent per component writes README, preview, CSS fragment, d.ts' },
    { title: 'Verify', detail: 'a second agent checks every value against the source' },
    { title: 'Fix', detail: 'discrepancies are applied' },
  ],
}

const SCRATCH = '__WORK__'
const DS = SCRATCH + '/ds/project'
const REPO = '/home/user/course-planner'
const BRIEF = SCRATCH + '/ds-brief.md'

const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    files_written: { type: 'array', items: { type: 'string' } },
    states_shown: { type: 'array', items: { type: 'string' } },
    tokens_used: { type: 'array', items: { type: 'string' } },
    not_reproduced: { type: 'array', items: { type: 'string' } },
    flags: { type: 'array', items: { type: 'string' }, description: 'contrast misses, source oddities you preserved' },
    marker_line: { type: 'string' },
  },
  required: ['files_written', 'states_shown', 'tokens_used', 'not_reproduced', 'flags', 'marker_line'],
}

const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    discrepancies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          where: { type: 'string' },
          source_value: { type: 'string' },
          found_value: { type: 'string' },
          severity: { type: 'string', enum: ['value', 'missing-state', 'contract', 'copy', 'token', 'docs'] },
          fix: { type: 'string' },
        },
        required: ['file', 'where', 'source_value', 'found_value', 'severity', 'fix'],
      },
    },
    checked: { type: 'array', items: { type: 'string' }, description: 'what you verified as correct' },
  },
  required: ['discrepancies', 'checked'],
}

const FIX_SCHEMA = {
  type: 'object',
  properties: {
    fixed: { type: 'array', items: { type: 'string' } },
    disputed: { type: 'array', items: { type: 'string' }, description: 'discrepancies you did not apply and why (the source disagrees)' },
  },
  required: ['fixed', 'disputed'],
}

const items = args.items

const buildPrompt = (it) => `Read ${BRIEF} in full first (it is the contract), then ${DS}/tokens.json (token names and values).

Build the card for **${it.name}** (group "${it.group}").
Source files (read every one in full with cat):
${it.files.map(f => '- ' + REPO + '/' + f).join('\n')}
${it.sweep ? 'A structured extraction of these files already exists at ' + SCRATCH + '/sweep/' + it.sweep + '.json — use it as a checklist of parts/states/classes, but the SOURCE is the truth; read the source.' : ''}
${it.notes ? 'Notes: ' + it.notes : ''}
Suggested preview height: about ${it.height}px (set the marker to what your layout actually needs).

Write the four files exactly where the brief says (README.md and preview.html under ${DS}/components/${it.name}/, the CSS fragment at ${SCRATCH}/_work/fragments/${it.name}.css, the d.ts at ${SCRATCH}/_work/dts/${it.name}.d.ts). Block name in CSS: .cp-${it.block}. Then return the report.`

const verifyPrompt = (it, built) => `You are an adversarial reviewer. Another agent produced a static design-system card for **${it.name}** from the Course Planner source. Assume it contains mistakes and find them all.

Read, in this order:
1. ${BRIEF} (the contract: file shapes, Tailwind v4 → CSS mapping, preview rules).
2. The source files, in full:
${it.files.map(f => '   - ' + REPO + '/' + f).join('\n')}
3. The produced files:
   - ${DS}/components/${it.name}/README.md
   - ${DS}/components/${it.name}/preview.html
   - ${SCRATCH}/_work/fragments/${it.name}.css
   - ${SCRATCH}/_work/dts/${it.name}.d.ts
4. ${DS}/tokens.json — to check that every var(--name) in the fragment is a real token name and that each fallback literal equals that token's value.

Check, class by class: every className string in the source (every variant, size, state branch, conditional) has a CSS rule whose values match the brief's mapping EXACTLY (padding, font-size/line-height/weight, colors by token, radius, shadow, ring, border — remember bare \`border\` is 1px solid currentColor under v4, gradients interpolate "in oklab"). Check the preview: line 1 marker shape, no forbidden tags, no external URLs other than /_blob/ ids, states actually shown, real Korean copy verbatim, mirror classes exist in the fragment. Check the README: first sentence summary, sections from the brief, props match the TS interface (names, types, defaults), flagged contrast pairs, the "Static rendition…" line. Check the d.ts matches the source interface.

The builder reported: ${JSON.stringify(built)}

Report every discrepancy with the exact source value and the exact found value and a concrete fix. Do NOT edit any file. Be precise; a vague finding is worthless.`

const fixPrompt = (it, verdict) => `Apply these verified corrections to the static design-system card for **${it.name}**. For each item, open the named file, make exactly that change, and re-check the surrounding rule. If a correction contradicts the source (re-read ${it.files.map(f => REPO + '/' + f).join(', ')} to be sure), do not apply it and list it under disputed with the source line that proves it.

Contract: ${BRIEF}. Tokens: ${DS}/tokens.json.
Files: ${DS}/components/${it.name}/README.md, ${DS}/components/${it.name}/preview.html, ${SCRATCH}/_work/fragments/${it.name}.css, ${SCRATCH}/_work/dts/${it.name}.d.ts

Corrections:
${verdict.discrepancies.map((d, i) => `${i + 1}. [${d.severity}] ${d.file} — ${d.where}: source="${d.source_value}" found="${d.found_value}" → ${d.fix}`).join('\n')}`

const results = await pipeline(
  items,
  (it) => agent(buildPrompt(it), { label: `build:${it.name}`, phase: 'Build', schema: BUILD_SCHEMA }).then(r => ({ it, built: r })),
  (s) => s && s.built ? agent(verifyPrompt(s.it, s.built), { label: `verify:${s.it.name}`, phase: 'Verify', schema: VERIFY_SCHEMA }).then(v => ({ ...s, verdict: v })) : s,
  async (s) => {
    if (!s || !s.verdict) return s
    if (!s.verdict.discrepancies.length) { log(`${s.it.name}: verified clean (${s.verdict.checked.length} checks)`); return { ...s, fix: { fixed: [], disputed: [] } } }
    log(`${s.it.name}: ${s.verdict.discrepancies.length} discrepancies → fixing`)
    const fix = await agent(fixPrompt(s.it, s.verdict), { label: `fix:${s.it.name}`, phase: 'Fix', schema: FIX_SCHEMA })
    return { ...s, fix }
  },
)

const out = results.filter(Boolean).map(s => ({
  name: s.it.name,
  built: s.built && { files: s.built.files_written, states: s.built.states_shown, not_reproduced: s.built.not_reproduced, flags: s.built.flags, marker: s.built.marker_line },
  discrepancies: s.verdict ? s.verdict.discrepancies.length : null,
  fixed: s.fix ? s.fix.fixed : null,
  disputed: s.fix ? s.fix.disputed : null,
}))
log(`done: ${out.length}/${items.length} cards`)
return out