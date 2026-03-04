# Story 6.7: Reporter Notification & Audit Log

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an admin,
I want reporters to be notified when their report is resolved, and for all moderator actions to be logged immutably,
So that we maintain transparency with users and have an audit trail for compliance.

## Acceptance Criteria

1. **Given** a moderator has taken action on a user-submitted report,
   **When** the action is saved,
   **Then** an audit log record is created capturing the timestamp, moderator ID, action taken, and the moderation item ID.

2. **Given** a moderation action has been completed on a reported item,
   **When** the audit log record is persisted,
   **Then** the original reporter receives an in-app notification confirming the review is complete,
   **And** a push notification is sent (if the reporter has `notifyModeration` enabled).

3. **Given** an admin wants to review moderation history,
   **When** they query the audit log endpoint (`GET /api/moderation/audit-log`),
   **Then** they receive a paginated list of all moderation actions with timestamps, moderator identity, action type, and target item.

4. **Given** an admin needs to export moderation records for compliance (FR51),
   **When** they request a CSV export via `GET /api/moderation/audit-log/export`,
   **Then** a CSV file is returned containing all audit log entries within the requested date range.

## Tasks / Subtasks

- [x] Task 1: Create `ModerationAuditLog` Prisma model and migration (AC: #1)
  - [x] Subtask 1.1: Add `ModerationAuditLog` model to `backend/prisma/schema.prisma` with fields: `id`, `moderationItemId`, `moderatorId`, `action`, `reason`, `metadata`, `createdAt`.
  - [x] Subtask 1.2: Add relations to `ModerationItem` and `User` models.
  - [x] Subtask 1.3: Run `npx prisma db push` and `npx prisma generate`.

- [x] Task 2: Implement audit log creation in moderation action flow (AC: #1)
  - [x] Subtask 2.1: Create `moderationAudit.service.ts` in `backend/src/services/` with `createAuditEntry()` function.
  - [x] Subtask 2.2: Integrate audit log creation into the moderation action endpoint (`POST /api/moderation/queue/:id/action` from story 6.6) — every action (remove, warn, watchlist, clear, escalate) must produce an audit record.

- [x] Task 3: Implement reporter notification on action completion (AC: #2)
  - [x] Subtask 3.1: After audit log creation, look up all `Report` records for the `ModerationItem` to find reporter user IDs.
  - [x] Subtask 3.2: For each reporter, call `createAndEmitNotification()` from `notification.controller.ts` with type `moderation_resolution` and a trauma-informed message.
  - [x] Subtask 3.3: For each reporter, call `sendModerationResolutionPush()` from `pushNotification.service.ts` (already exists from story 5.5) to send push notification.

- [x] Task 4: Create audit log query endpoint (AC: #3)
  - [x] Subtask 4.1: Add `GET /api/moderation/audit-log` route in `moderation.routes.ts` with `requireRole('admin', 'moderator')`.
  - [x] Subtask 4.2: Implement `getAuditLog` controller function with pagination (limit/offset), optional date range filters (`from`, `to`), and optional `moderatorId` filter.

- [x] Task 5: Create audit log CSV export endpoint (AC: #4)
  - [x] Subtask 5.1: Add `GET /api/moderation/audit-log/export` route in `moderation.routes.ts` with `requireRole('admin')`.
  - [x] Subtask 5.2: Implement `exportAuditLog` controller function that streams CSV with columns: `id`, `timestamp`, `moderatorId`, `moderatorUsername`, `action`, `moderationItemId`, `reason`.
  - [x] Subtask 5.3: Support `from` and `to` query parameters for date range filtering.

- [x] Task 6: Testing & Verification (AC: #1, #2, #3, #4)
  - [x] Subtask 6.1: Write unit tests in `backend/src/controllers/moderation.controller.test.ts` for audit log creation on moderation actions.
  - [x] Subtask 6.2: Write unit tests for reporter notification dispatch.
  - [x] Subtask 6.3: Write unit tests for `GET /api/moderation/audit-log` with pagination and filters.
  - [x] Subtask 6.4: Write unit tests for `GET /api/moderation/audit-log/export` CSV generation.

## Dev Notes

- **Architecture Rules:**
  - `routes -> controllers -> services` for backend.
  - Use standardized `{ data: ... }` or `{ error: ..., code: ... }` formatted responses.
  - Role-based access control enforced at API layer: `moderator` or `admin` for audit log read, `admin` only for export.
  - Always import Prisma from `../utils/prisma` — never instantiate `new PrismaClient()`.
  - Use Zod for request validation on query parameters.

- **Existing Infrastructure to Reuse:**
  - `createAndEmitNotification()` in [`notification.controller.ts`](backend/src/controllers/notification.controller.ts:13) — creates DB notification + emits via Socket.io.
  - `sendModerationResolutionPush()` in [`pushNotification.service.ts`](backend/src/services/pushNotification.service.ts) — already built in story 5.5 for moderation resolution push notifications.
  - `emitNotification()` in `backend/src/utils/notify.ts` — Socket.io real-time emission.
  - The `Report` model already tracks `reporterId` linked to `ModerationItem` — use this to find reporters.

- **Moderation State Machine (from story 6.6):**
  - `pending` → `ai_flagged | ai_cleared` → `human_review` → `removed | cleared | watchlisted`
  - Audit log should capture the state transition, not just the final state.

- **Trauma-Informed Notification Copy:**
  - Reporter notification message should be supportive and non-specific: "Thank you for helping keep our community safe. The content you reported has been reviewed by our team."
  - Do NOT reveal the specific action taken (removal, warning, etc.) to the reporter — this is a safety design decision.

- **CSV Export Pattern:**
  - Set `Content-Type: text/csv` and `Content-Disposition: attachment; filename="moderation-audit-log.csv"`.
  - Use simple string concatenation or a lightweight CSV library — do NOT add heavy dependencies.
  - Stream rows if dataset is large; for MVP, loading all into memory is acceptable.

- **Previous Story Learnings (6.6):**
  - Story 6.6 created the moderation action endpoint `POST /api/moderation/queue/:id/action`. The audit log creation in Task 2 hooks into this existing endpoint.
  - Prisma inclusions required for deeply linked relationships when querying specific posts/comments.
  - The `ModerationItem` model currently has `status`, `postId`, `commentId`, `contentId`, `aiScore`, `aiCategory` fields.

### Project Structure Notes

- New file: `backend/src/services/moderationAudit.service.ts` — audit log business logic.
- Modified files:
  - `backend/prisma/schema.prisma` — new `ModerationAuditLog` model.
  - `backend/src/controllers/moderation.controller.ts` — add `getAuditLog`, `exportAuditLog` handlers, integrate audit creation into action flow.
  - `backend/src/routes/moderation.routes.ts` — add audit log routes.
  - `backend/src/controllers/moderation.controller.test.ts` — add tests.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.7] — Story definition and acceptance criteria
- [Source: _bmad-output/planning-artifacts/prd.md#FR25] — Reporter receives notification when report is resolved
- [Source: _bmad-output/planning-artifacts/prd.md#FR26] — All moderation decisions logged with timestamps for audit
- [Source: _bmad-output/planning-artifacts/prd.md#FR51] — Admin can export moderation records for compliance
- [Source: _bmad-output/planning-artifacts/architecture.md#Moderation] — AI moderation pipeline and worker pattern
- [Source: _bmad-output/project-context.md#Backend Architecture] — Route/controller/service patterns
- [Source: backend/src/controllers/notification.controller.ts:13] — `createAndEmitNotification()` helper
- [Source: backend/src/services/pushNotification.service.ts] — `sendModerationResolutionPush()` from story 5.5
- [Source: backend/src/controllers/moderation.controller.ts] — Existing moderation controller with `reportContent` and `getModerationItems`
- [Source: _bmad-output/implementation-artifacts/6-6-moderation-actions-escalation.md] — Previous story context

## Dev Agent Record

### Agent Model Used

BMAD create-story context engine (claude-opus-4.6)

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed — comprehensive developer guide created.

### File List
