# Story 6.5: Moderation Queue Dashboard (FR22, FR26, FR50)

Status: done

## Story
As a moderator,
I want a dedicated dashboard showing reported or AI-flagged content (along with AI confidence scores),
So that I can efficiently review incidents and meet the 2-hour SLA.

## Acceptance Criteria
- [x] Accessible only by users with the `moderator` or `admin` role.
- [x] The dashboard provides an ordered list of flagged items (ModerationItems).
- [x] Items are prioritized by AI severity score OR total number of user reports.
- [x] Each item includes original content context, reporter reasons (reports), and calculated AI analysis scores.

## Tasks / Subtasks

- [x] Task 1: API Endpoint Creation
  - [x] Subtask 1.1: Create `GET /api/moderation/queue` in `moderation.routes.ts`.
  - [x] Subtask 1.2: Require `authenticate` and `requireRole(['admin', 'moderator'])` middleware.

- [x] Task 2: Database Query
  - [x] Subtask 2.1: Write `getModerationItems` in `moderation.controller.ts`.
  - [x] Subtask 2.2: Retrieve `ModerationItem` inclusive of `Post` and `Comment` structures, `reports`, and `aiSentimentScore`.
  - [x] Subtask 2.3: Sort by `aiSentimentScore` (descending) primarily, or `status: 'pending'` criteria.

- [x] Task 3: Testing & Verification
  - [x] Subtask 3.1: Provide unit tests in `moderation.controller.test.ts` ensuring order logic and access control mechanisms work correctly.

## Dev Notes
- Ensure that the query efficiently includes both `post` details and `comment` details so the moderator knows *what* they are evaluating.
- Keep the `sprint-status.yaml` properly synced.

---

## Dev Agent Record
- Wrote `6-5-moderation-queue-dashboard.md` reflecting Story 6.5 instructions
- Mapped `getModerationItems` in `moderation.controller.ts` with explicit `findMany` queries linking relational tables structure to return nested flags/authors
- Adjusted prisma inclusion schema to correctly alias `author` mapping under `content` payload
- Authored a fully restricted endpoint `/api/moderation/queue` locked onto `requireRole('admin', 'moderator')`
- Wrote robust controller tests resolving pagination and standard pending-status results in `moderation.controller.test.ts`

## Review Agent Record
- Assured code implements AI-priority metric `aiScore` cleanly cascading descending fallback formats.
- All relationships inside the returned queue payload pass compilation against current Prisma client type definitions.
- Statuses updated synchronously. Test suite executes effectively with zero issues.
