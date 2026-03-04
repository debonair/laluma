# Story 2.7: System Status Display (FR56)

Status: done

## Story
As a member,
I want to see global system status messages (e.g., "Planned maintenance", "High volume in crisis support"),
So that I am informed about platform operations that might affect my experience.

## Acceptance Criteria
1. **Given** an admin has published an active system status message,
   **When** I load any main page of the application,
   **Then** I see a dismissed-able banner or prominent indicator containing the message,
   **And** its design respects trauma-informed principles (informative, not alarming).

## Tasks / Subtasks

- [x] Task 1: GET Status Endpoint (AC: 1)
  - [x] Subtask 1.1: Verify or create `GET /status` endpoint returning the current active system status (or empty if none).
  - [x] Subtask 1.2: The response should be minimal: `{ message: string | null, type: 'info' | 'warning' | null }`.
- [x] Task 2: POST Admin Status Endpoint (AC: 1)
  - [x] Subtask 2.1: Create a `POST /admin/status` endpoint allowing admins to publish a new active status message.
  - [x] Subtask 2.2: Only one status can be active at a time (upsert pattern).
  - [x] Subtask 2.3: Allow clearing status with `{ message: null }`.
- [x] Task 3: Prisma Schema (if needed) (AC: 1)
  - [x] Subtask 3.1: Check if `SystemStatus` model exists in the schema. If not, add it.
- [x] Task 4: Unit Tests (AC: 1)
  - [x] Subtask 4.1: Write unit tests for `GET /status` (active status, no status).
  - [x] Subtask 4.2: Write unit tests for `POST /admin/status` (set, clear).

## Dev Notes
- May need a `SystemStatus` model: `{ id, message, type, isActive, createdAt, updatedAt }` with upsert.
- Trauma-informed design note is for frontend; backend just returns `type: 'info' | 'warning'`.

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
None

### Completion Notes List
- No `SystemStatus` model existed in schema.prisma. Added it with `id`, `message`, `type` ('info'|'warning'), `isActive`, and timestamps. Ran `prisma db push` to apply.
- Created `status.controller.ts` with `getStatus` (public) and `setStatus` (admin-only) endpoints.
- `setStatus` deactivates all existing statuses before creating a new one (single active message pattern). Supports clearing with `{message: null}`.
- Created `status.routes.ts` with public `GET /` and admin-gated `POST /` endpoints.
- Registered `/api/status` in `index.ts`.
- Added `systemStatus` mock to `src/test/setup.ts` and created `status.controller.test.ts` with 5 tests.
- All 70 backend tests pass.

### File List
- `backend/prisma/schema.prisma`
- `backend/src/controllers/status.controller.ts`
- `backend/src/controllers/status.controller.test.ts`
- `backend/src/routes/status.routes.ts`
- `backend/src/index.ts`
- `backend/src/test/setup.ts`
