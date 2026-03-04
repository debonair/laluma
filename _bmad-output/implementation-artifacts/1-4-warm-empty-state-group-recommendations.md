# Story 1.4: Warm Empty State & Group Recommendations (FR3)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story
As a newly registered member completing onboarding,
I want to be presented with 3 recommended groups relevant to my context before my feed loads,
So that I don't face a confusing or empty platform on my first visit.

## Acceptance Criteria
1. **Given** I am completing the final step of the onboarding flow,
   **When** I submit my life stage and journey context,
   **Then** I see a "Warm Guided Screen" suggesting exactly 3 relevant groups,
   **And** I can join them with a single tap,
   **And** proceeding past this screen loads my chronological feed populated with those groups' content.

## Tasks / Subtasks

- [x] Task 1: Endpoint for Recommended Groups (AC: 1)
  - [x] Subtask 1.1: Create an endpoint `GET /groups/recommended` in `backend/src/controllers/groups.controller.ts`.
  - [x] Subtask 1.2: Implement logic to select 3 relevant groups from the database based on the user's `lifeStage` and `journeyContext`, defaulting to the largest/most popular groups or general default groups if no perfect match exists.
  - [x] Subtask 1.3: Expose endpoint in `backend/src/routes/groups.routes.ts`.
- [x] Task 2: Join Group Integration Verification (AC: 1)
  - [x] Subtask 2.1: Verify `POST /groups/:groupId/join` exists and handles successful joins (likely implemented, but verify logic is sound).
- [x] Task 3: Unit Tests (AC: 1)
  - [x] Subtask 3.1: Add unit tests for `GET /groups/recommended` logic inside `groups.controller.test.ts`.

## Dev Notes
- "Proceeding past this screen loads chronological feed" is mostly a frontend routing step after joining, assuming the `/feed` endpoint fetches content for joined groups.
- The `GET /groups/recommended` endpoint will look at the `req.user`'s Prisma profile, taking their `lifeStage` and `journeyContext` and then run a `prisma.group.findMany(...)` trying to map tags or descriptions. Since there might not be groups seeded perfectly, limit to exactly 3 groups (e.g. `take: 3`, perhaps sorting by member count or randomly if needed). For now, returning 3 groups universally is the MVP.
- We might not have "tags" strictly, the logic can be a simple hardcoded recommendation or full-text search fallback.

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
None

### Completion Notes List
- Evaluated `schema.prisma` correctly, checking existing fields like `lifeStage`.
- Developed `GET /groups/recommended` that grabs groups passing the text-matching of life stages, falling back to filling exact length of 3 with generic largest groups.
- Exposed the new route safely in `groups.routes.ts`.
- Unit tests run flawlessly under `<root>/backend` (41 passing). Verified `POST /groups/:groupId/join` existence as requested.

### File List
- `backend/src/controllers/groups.controller.ts`
- `backend/src/controllers/groups.controller.test.ts`
- `backend/src/routes/groups.routes.ts`
