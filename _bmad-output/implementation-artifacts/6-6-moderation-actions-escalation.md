# Story 6.6: Moderation Actions & Escalation

Status: ready-for-dev

## Story

As a moderator reviewing a flagged post,
I want to apply actions (Remove, Issue Warning, Add to Watchlist) or escalate to an Admin,
So that I can enforce the community guidelines accurately.

## Acceptance Criteria

1. **Given** I am viewing an item in the Moderation Queue,
   **When** I select an action like "Remove Content",
   **Then** the content is soft-deleted and removed from all community feeds,
   **And** it is replaced by an administrative placeholder ("Removed by Moderation") for anyone who had previously seen it.
2. **Given** an action is taken,
   **When** it specifically chooses "Issue Warning" or "Add to Watchlist" or "Clear",
   **Then** the associated user account or ModerationItem gets its state updated correctly.
3. **Given** an item requires higher review,
   **When** I escalate it to an Admin,
   **Then** the ModerationItem is flagged/escalated and stays in the pending queue specifically marked for Admin review.
4. **Given** any moderation action is taken,
   **Then** the moderation queue state machine updates (`pending` -> `human_review` -> `removed` | `cleared` | `watchlisted`).

## Tasks / Subtasks

- [x] Task 1: API Endpoint Creation for Moderation Actions
  - [x] Subtask 1.1: Create `POST /api/moderation/queue/:id/action` in `moderation.routes.ts`.
  - [x] Subtask 1.2: Require `authenticate` and `requireRole(['admin', 'moderator'])` middleware.
  - [x] Subtask 1.3: Validate action payload using Zod (valid actions: remove, warn, watchlist, clear, escalate).
- [x] Task 2: Controller & Service Implementation
  - [x] Subtask 2.1: Implement action logic in `moderation.controller.ts` calling `moderationService.ts`.
  - [x] Subtask 2.2: Implement `remove` action - soft delete content and update placeholder text.
  - [x] Subtask 2.3: Implement `warn`/`watchlist` action - update User model or create moderation alerts.
  - [x] Subtask 2.4: Implement `escalate` action.
- [x] Task 3: Testing & Verification
  - [x] Subtask 3.1: Write unit tests in `moderation.controller.test.ts`.

## Dev Notes

- **Architecture Rules:**
  - `routes -> controllers -> services` for backend.
  - Use standardized `{ data: ... }` or `{ error: ..., code: ... }` formatted responses.
  - Moderation Job State machine: `pending` -> `ai_flagged | ai_cleared` -> `human_review` -> `removed | cleared | watchlisted`.
  - Role-based access control enforced at API layer: `moderator` or `admin`.
- **Project Structure Notes:** Follow the existing module pattern in `backend/src/routes/moderation.routes.ts`, `backend/src/controllers/moderation.controller.ts`, etc.
- **Previous Story Learnings (6.5):** 
  - Prisma inclusions required for deeply linked relationships when querying specific posts/comments. Ensure the same relational context is properly updated or referenced during actions.

### References
- PRD FR23 & FR27
- docs/architecture-backend.md
- **Note:** Audit logging (FR26) and Reporter notifications (FR25) are covered in the next story (6.7), but emitting an event or preparing hooks for them here is recommended.

## Dev Agent Record

### Agent Model Used
BMAD create-story context engine (claude-3-5-sonnet-20241022)

### Completion Notes List
- Ultimate context engine analysis completed - comprehensive developer guide created.
