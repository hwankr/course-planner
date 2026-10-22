# Onboarding — verification findings not yet applied

From an adversarial line-by-line check against the source. Re-check each against the source before applying; if the source disagrees, skip it.

1. **[copy] ds/project/components/Onboarding/README.md** — ## Copy, Header bullet (line 32)
   - source: onboarding/page.tsx line 352: <p className="text-sm text-gray-400 mt-1">몇 가지 정보만 입력하면 바로 시작할 수 있어요</p> — no trailing period (the preview renders it correctly without one)
   - found: '몇 가지 정보만 입력하면 바로 시작할 수 있어요.' — a trailing period is appended, which in this '·'-separated list reads as part of the verbatim string (the neighbouring '입력해주세요.' really does end in a period)
   - fix: Change the bullet to '… · 몇 가지 정보만 입력하면 바로 시작할 수 있어요 Stepper: …' (or separate the strings with ' · ' only) so the string is verbatim.

2. **[docs] ds/project/components/Onboarding/README.md** — ## Anatomy and states — Stepper bullet (line 20) 'gray-400 (2.6:1, flagged)'; Profile banner bullet (line 28) 'department yu-navy on yu-navy-a10 (9.4:1)'; also preview.html line 61 caption 'gray-400 caption, 2.6:1 flagged'
   - source: The stepper, header caption and profile banner all sit on the dashboard's gray-50 frame (layout.tsx line 145 bg-gray-50). Computed: gray-400 #99a1af on gray-50 #f9fafb = 2.49:1; yu-navy on yu-navy-a10 blended over gray-50 = 9.04:1. The same README correctly gives the header caption as '2.5:1 on gray-50' one line earlier.
   - found: Stepper labels stated as 2.6:1 (the on-white figure) and the department badge as 9.4:1 (over white); the preview caption under the gray-50 stage also says 2.6:1
   - fix: State 2.5:1 on gray-50 for the stepper labels (keep 2.6:1 only for the field helpers inside the white Card), give the department badge as 9.0:1 on gray-50 (or say 'over white'), and change the preview caption on line 61 to '2.5:1 on gray-50'.

3. **[missing-state] ds/project/components/Onboarding/preview.html** — Toggle strip, lines 64-77 (three buttons: off, minor hover, minor on)
   - source: onboarding/page.tsx line 380: the 복수전공 off button carries 'hover:border-purple-400 hover:text-purple-600' — a distinct hover recipe from the 부전공 'hover:border-orange-400 hover:text-orange-600'; the fragment styles it (Onboarding.css lines 320-324) and the README documents it
   - found: Only the orange 부전공 hover is rendered (.cp-onboarding__toggle--minor.is-hover); the purple 복수전공 hover is mentioned in the caption text only ('복수전공 hovers purple') and never shown
   - fix: Add a fourth button to the strip: <button type="button" class="cp-onboarding__toggle cp-onboarding__toggle--double is-hover"><span class="cp-onboarding__toggle-inner">+ 복수전공 추가</span></button> (purple-400 border / purple-600 text) and extend the caption; the strip is one 38px row so the height marker is unaffected.

4. **[docs] ds/project/components/Onboarding/README.md** — ## Accessibility, first bullet ('the Check SVG has no title, so the completed state is color-only') and preview.html lucide <svg> elements (lines 48, 73, 93, 97, 101, 121, 147, 168, 185, 202, 217, 234, 239)
   - source: lucide-react v0.563.0 (scratchpad/_verify/lucide-Icon.js line 33: `...!children && !hasA11yProp(rest) && { "aria-hidden": "true" }`) renders every icon on these pages — Check, School, GraduationCap, BookOpen, Award, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, Building2, CalendarDays — with aria-hidden="true", so none is announced; the SearchableSelect clear <button> (heroicon X, no aria-label) therefore has no accessible name
   - found: README says only that the Check SVG 'has no title'; none of the 13 inlined lucide SVGs in the preview carries aria-hidden="true" (the sibling Button preview does include it)
   - fix: In Accessibility, state that every lucide icon is rendered aria-hidden="true" by lucide-react (so 완료's CheckCircle, the stepper Check and the badge glyphs are invisible to AT) and that the 학과 clear button has no accessible name; optionally add aria-hidden="true" to the lucide <svg> tags in preview.html for an exact rendition.

5. **[docs] _work/fragments/Onboarding.css** — .cp-onboarding__stack (line 32), .cp-onboarding__stepper (line 65), .cp-onboarding__content--gap-4/6 (lines 245-246), .cp-onboarding__column (line 366): `> :not(:last-child) { margin-bottom }`
   - source: ds-brief.md line 69: 'space-y-2 = 8px margin-top on every sibling after the first' (Card.css line 29 follows it with `> * + * { margin-top }`)
   - found: space-y-* is emulated as margin-bottom on all but the last child (Tailwind v4's actual `:where(& > :not(:last-child)) { margin-block-end }` output). Visually identical everywhere in this card (8px under the circles; the step-2 help line lands 10px under the title row, measured, which is what the real v4 app renders — the brief's margin-top form would give 4px because mt-1 overrides it), but it is a different mechanism from the brief's mapping and from Card.css
   - fix: No visual change needed; either keep it and leave the existing fragment comments (lines 31, 134-135, 181, 225-227) that justify the v4 form, or, if the brief's mapping is to be followed literally for bundle consistency, switch to `> * + * { margin-top }` and keep the scoped `.cp-card__header > .cp-onboarding__help { margin-top: 10px }` override so the measured 10px gap is preserved.

6. **[contract] _work/dts/Onboarding.d.ts** — export interface ProfileBannerProps (lines 121-132): name?: string; department?: … | null; enrollmentYear?: number | null
   - source: profile/page.tsx lines 37-48 `interface UserProfile { … name: string; department: Department | null; enrollmentYear: number | null; … }` — name, department and enrollmentYear are required (department/enrollmentYear nullable, not optional); only majorType? and secondaryDepartment? are optional
   - found: All five banner fields are declared optional with `?`
   - fix: Mirror UserProfile: `name: string; department: Pick<OnboardingDepartment, '_id' | 'code' | 'name'> | null; enrollmentYear: number | null; majorType?: MajorType; secondaryDepartment?: … | null;` and keep the one-line comment that the heading falls back to session.user.name / 사용자 and the initial to 'U'.

7. **[copy] ds/project/components/Onboarding/README.md** — Line 1 (first sentence = card subtitle)
   - source: ds-brief.md line 22: 'First sentence = one-line summary (becomes the card subtitle)'
   - found: A 57-word, 262-character single sentence listing the header, stepper, both Card titles, the toggles and the banner — one sentence, but far from one line as a subtitle
   - fix: Shorten to something like 'The two-step first-run wizard (header, stepper, 학과 및 입학 정보 and 졸업 요건 설정 Cards with the 복수전공/부전공 toggles) plus the profile banner that shows its result.' and move the 'collects department, enrollment year, major type and graduation credits' detail into Use it for.
