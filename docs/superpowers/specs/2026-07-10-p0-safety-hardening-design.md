# P0 Safety Hardening Design

## Scope

This change addresses the two P0 findings approved after the project review:

1. Seed commands must not destroy shared or production data by default.
2. A user must never be able to add or delete another user's custom course.

## Considered approaches

### Seed safety

- Guard-only destructive reset: small change, but the normal workflow remains destructive.
- Interactive confirmation: easy to bypass and unsuitable for CI.
- Non-destructive idempotent upsert by default: recommended. Re-running the seed updates the known demo records without deleting unrelated records or indexes.

The implementation uses idempotent upserts for departments, official courses, requirements, and academic events. Existing collection-wide deletion is removed from the normal seed paths.

### Custom-course authorization

- Route-only ownership check: leaves service functions unsafe for future API separation or other callers.
- Actor-aware service authorization: recommended. Every plan mutation receives the authenticated actor ID, official courses remain shareable, and custom-course reads/deletes require `createdBy === actorId`.
- Separate ACL subsystem: unnecessary for the current ownership model.

## Data flow and invariants

- Seed reruns match stable natural keys and issue `findOneAndUpdate(..., { upsert: true })` or equivalent bulk upserts.
- Seed code never drops a collection or calls collection-wide `deleteMany({})`.
- Plan routes continue to verify plan ownership and also pass `session.user.id` into the service layer.
- `addCourseToSemester` accepts official courses (`createdBy` null) and the actor's own custom courses only.
- Cleanup operations delete only custom courses owned by the actor. They cannot delete another user's document even if an invalid cross-user reference already exists.

## Error handling

- Adding an inaccessible custom course returns a domain error without revealing its owner.
- Seed upsert failures stop the script and preserve unrelated data.
- Existing plan changes remain intact even if optional custom-course cleanup fails, matching current behavior while tightening the deletion filter.

## Testing

- Node's test runner through `tsx --test` provides TypeScript regression tests without adding a new dependency.
- Seed tests prove the default write plan is idempotent and contains no destructive operation.
- Ownership tests prove another user's custom course is rejected and cleanup filters always contain the authenticated owner.
- Completion requires focused regression tests, the full test command, TypeScript, lint, and a production build.
