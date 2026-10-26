# Card status

Generated from this session's workflow journals. "Verified" means an independent agent compared every class and string with the source. Every card listed with files has been rendered headlessly and compared with the app screenshots.

| Card | Group | State | Next |
| --- | --- | --- | --- |
| Button | Primitives | verified, 8 findings fixed | - |
| Card | Primitives | verified, 10 findings fixed | - |
| Input | Primitives | verified, 13 findings fixed | - |
| Toast | Primitives | verified, 7 findings fixed | - |
| SearchableSelect | Primitives | verified, 8 findings fixed | - |
| Footer | Primitives | verified, 9 findings fixed | - |
| ZoomableImage | Primitives | verified, 6 findings applied by hand | - |
| ErrorBoundary | Primitives | verified, 9 findings applied by hand | - |
| CourseCard | Planner | verified, 9 findings fixed | - |
| SemesterColumn | Planner | verified, 6 findings fixed | - |
| ReadOnlySemesterColumn | Planner | verified, 6 findings fixed | - |
| RequirementsSummary | Planner | verified, 7 findings applied by hand | - |
| RequirementForm | Planner | verified, 8 findings applied by hand | - |
| CustomCourseForm | Planner | verified, 7 findings applied by hand | - |
| AddSemesterDialog | Planner | verified, 4 findings applied by hand | - |
| CourseCatalog | Planner | verified, 6 findings applied by hand | - |
| AllPlansModal | Planner | verified, 6 findings applied by hand | - |
| AnonymousPlanModal | Planner | verified, 5 findings applied by hand | - |
| PatchNotePreview | Planner | verified, 4 findings fixed | - |
| AppHeader | Patterns | verified, 11 findings fixed | - |
| AuthLayout | Patterns | verified, 8 findings fixed | - |
| PageHeader | Patterns | verified, 10 findings fixed | - |
| FilterChips | Patterns | verified, 13 findings fixed | - |
| Badge | Patterns | verified, 11 findings fixed | - |
| Callout | Patterns | verified, 9 findings fixed | - |
| StatusStates | Patterns | verified, 9 findings fixed | - |
| Statistics | Patterns | verified, 9 findings fixed | - |
| Onboarding | Patterns | verified, 7 findings fixed | - |
| CalendarGrid | Patterns | verified, 19 findings fixed | - |
| HelpSection | Patterns | verified, 20 findings fixed | - |
| AdminList | Patterns | verified, 20 findings fixed | - |
| FeedbackCard | Patterns | verified, 14 findings fixed | - |
| ProfileCard | Patterns | verified, 14 findings fixed | - |
| PatchNotes | Patterns | verified, 7 findings fixed | - |
| ModalShell | Patterns | verified, 9 findings fixed | - |

The cover (`components/Cover/preview.html`) is hand-made from the tokens and needs no verification.

After verification, a Tailwind v4 audit (2026-10-26) checked the whole bundle against `tools/tw.mjs` (real Tailwind 4.1.18 output): every `space-y`/`space-x` rendition was rewritten to v4's `:not(:last-child)` margin-bottom form (13 had rendered differently: Card header, ErrorBoundary, StatusStates, RequirementForm, PatchNotes detail, CourseCatalog, AdminList overlays), real `:hover` rules moved under `@media (hover: hover)`, `transition-colors` gained `outline-color`, a RequirementsSummary `p` reset stopped overriding four margins, and every contrast figure in the docs was recomputed with `tools/contrast.mjs`. `node tools/cascade-check.mjs` reports 0 own-class margin/padding rules lost to resets. Onboarding's count includes one finding the fixer disputed with the v4 source (no change needed).
