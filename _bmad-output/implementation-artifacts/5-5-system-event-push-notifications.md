# Story 5.5: System & Event Push Notifications (FR33, FR46, FR47)

Status: done

## Story

As a member,
I want to receive push notifications for event reminders and updates on content I reported to the moderation team,
So that I stay informed on crucial logistics and my safety actions.

## Acceptance Criteria

1. **Given** I am registered for an upcoming Luma Spaces event,
   **When** the event occurs within 24 hours,
   **Then** I receive a push notification reminding me of the event.

2. **Given** I have submitted a content report,
   **When** a moderator resolves my report (takes any action),
   **Then** I receive a push notification notifying me that my report has been reviewed.

3. **Given** all notification pushes from this story,
   **When** I tap the notification,
   **Then** the `deepLink` field routes the app to the right screen (event detail or notifications list).

4. **Given** I have opted out of the `event` notification category,
   **When** an event reminder would otherwise fire,
   **Then** no push is delivered (existing opt-out gating in `sendPushToUser` handles this).

5. **Given** I have opted out of the `moderation` notification category,
   **When** a moderation resolution would otherwise fire,
   **Then** no push is delivered.

## Tasks / Subtasks

- [x] Task 1: Implement `sendEventReminderPush` helper (AC: 1, 3, 4)
  - [x] Subtask 1.1: Add `sendEventReminderPush(userId, eventId, eventTitle, eventDate)` to `pushNotification.service.ts`. Payload: type `event`, title `"Reminder: Upcoming Event"`, body `"Your event starts in less than 24 hours."`, data `{ type: 'event', deepLink: 'luma://event/<eventId>' }`.
  - [x] Subtask 1.2: Write unit test asserting `sendEventReminderPush` calls `sendPushToUser` with correct payload shape (mock `sendPushToUser`).

- [x] Task 2: Implement `sendModerationResolutionPush` helper (AC: 2, 3, 5)
  - [x] Subtask 2.1: Add `sendModerationResolutionPush(userId, reportId)` to `pushNotification.service.ts`. Payload: type `moderation`, title `"Your Report Has Been Reviewed"`, body `"A moderator has reviewed your recent report."`, data `{ type: 'moderation', deepLink: 'luma://notifications' }` (no reportId in deepLink — avoid leaking moderation detail in data bag).
  - [x] Subtask 2.2: Write unit test asserting `sendModerationResolutionPush` calls `sendPushToUser` with correct payload shape.

- [x] Task 3: Expose internal test/trigger endpoints for developer validation (AC: 1, 2)
  - [x] Subtask 3.1: Add `POST /api/notifications/trigger/event-reminder` (admin-only, `authenticate` + `requireRole('app-admin')`) that accepts `{ userId, eventId, eventTitle, eventDate }` and calls `sendEventReminderPush`. Returns `{ triggered: true }`.
  - [x] Subtask 3.2: Add `POST /api/notifications/trigger/moderation-resolution` (admin-only) that accepts `{ userId, reportId }` and calls `sendModerationResolutionPush`. Returns `{ triggered: true }`.
  - [x] Subtask 3.3: Register both routes in `notification.routes.ts`.
  - [x] Subtask 3.4: Write integration tests: authenticated admin hits each endpoint, assert 200 + `{ triggered: true }`. Assert 400 for missing params.

- [x] Task 4: Validate opt-out gating inherited from Story 5.4 (AC: 4, 5)
  - [x] Subtask 4.1: Write unit test: mock `isUserOptedIn` (via `prisma.userPreference.findUnique`) returning `notifyEvents: false`; assert `sendPushToUser` sends zero FCM calls when `type === 'event'`.
  - [x] Subtask 4.2: Write unit test: same for `notifyModeration: false` and `type === 'moderation'`.

## Dev Notes

### Architecture Context

- **Push delivery** is entirely handled by `sendPushToUser` in `backend/src/services/pushNotification.service.ts`. This story adds two **thin wrapper functions** in the same file — no new service file is needed.
- **Opt-out gating** is already wired inside `sendPushToUser` via `isUserOptedIn`. Because the helpers in this story pass `data.type: 'event'` or `data.type: 'moderation'`, the existing `CATEGORY_TO_PREF` mapping (`event → notifyEvents`, `moderation → notifyModeration`) gates them automatically. No new code needed for AC 4 & 5.
- **No `Event` or `Report` Prisma models exist yet** — Epic 7 (events) and Epic 6 (moderation) build those. This story exposes **admin-only trigger endpoints** as the callable integration point. When those epics land they will import and call the helper functions directly.
- **Privacy rule**: Push payloads must NOT include raw event titles, group names, or moderation details in the `notification.title/body` at the OS level (lock-screen privacy). Generic strings only. Any rich detail should be fetched in-app after deep-link navigation.
- **Deep-link scheme**: `luma://<resource>/<id>`. For events: `luma://event/<eventId>`. For moderation resolution: `luma://notifications` (opens the in-app notification list).

### Patterns to Follow (from previous stories)

- Update `CATEGORY_TO_PREF` comment in `pushNotification.service.ts` if needed (it already maps `event` and `moderation` — just verify).
- Correct import: `import { sendPushToUser } from './pushNotification.service'` (relative, same file — the helpers live in the service file itself).
- Controller functions use `async (req: AuthRequest, res: Response): Promise<void> =>` pattern.
- Routes use `authenticate` + `requireRole('app-admin')` for admin-only endpoints.
- All new routes must be added to `backend/src/routes/notification.routes.ts` and verified in `backend/src/index.ts` that `/api/notifications` is registered (it already is from Story 5.2).
- Use `(prisma as any).userPreference` cast in tests where Prisma types don't yet include the Story 5.4-added fields.
- Test file: `backend/src/controllers/notification.controller.test.ts` (existing) — add new describe blocks there rather than creating a new test file.
- Mock pattern: `vi.mock('../services/pushNotification.service', () => ({ sendPushToUser: vi.fn() }))` then import `{ sendPushToUser }` from mock.

### File Locations

| File | Action |
|---|---|
| `backend/src/services/pushNotification.service.ts` | MODIFY — add `sendEventReminderPush` and `sendModerationResolutionPush` |
| `backend/src/controllers/notification.controller.ts` | MODIFY — add `triggerEventReminder` and `triggerModerationResolution` controller fns |
| `backend/src/routes/notification.routes.ts` | MODIFY — register two new admin-only POST routes |
| `backend/src/controllers/notification.controller.test.ts` | MODIFY — add new test describe blocks for Task 3 + Task 4 |

### Validation Expectations

- Run `cd backend && npm test` — all existing 111+ tests must still pass after changes.
- New tests: minimum 6 (2 helper unit tests + 2 integration endpoint tests × 2 callers each = 6).

### Project Structure Notes

- No new route files. Routes added to existing `notification.routes.ts`.
- No new Prisma migrations — no schema changes required.
- No frontend changes — this story is backend-only.

### References

- [Source: _bmad-output/implementation-artifacts/5-4-notification-preferences-privacy.md] — establishes opt-out gating pattern and `CATEGORY_TO_PREF` mapping
- [Source: _bmad-output/implementation-artifacts/5-2-push-notification-foundation.md] — establishes `sendPushToUser`, `PushPayload`, and `registerDeviceToken`
- [Source: _bmad-output/implementation-artifacts/5-3-actionable-notification-deep-linking.md] — establishes `deepLink` field convention
- [Source: backend/src/services/pushNotification.service.ts] — existing service to extend
- [Source: backend/src/controllers/notification.controller.ts] — existing controller to extend
- [Source: _bmad-output/project-context.md#Backend Architecture] — route/controller patterns, auth middleware usage

## Dev Agent Record

### Agent Model Used

Antigravity (create-story + dev-story + code-review)

### Debug Log References
- Removed stale duplicate helper function definitions that appeared after replace_file_content operation on test file.
- Addressed minor spacing issues found during adversarial code review.

### Completion Notes List
- `sendEventReminderPush(userId, eventId)` added to `pushNotification.service.ts` — privacy-safe generic title/body, `type: 'event'` data key, deep link `luma://event/<eventId>`.
- `sendModerationResolutionPush(userId, reportId)` added — deep link `luma://notifications` (avoids leaking report detail on lock screen).
- `triggerEventReminder` and `triggerModerationResolution` admin controller functions added to `notification.controller.ts` with 400-validation on missing params.
- Two admin-only routes registered in `notification.routes.ts` using `requireRole('app-admin')`.
- 10 new tests added covering: trigger endpoints (happy path + 400 validation), payload delegation to service helpers, opt-out gating contract verification.
- Full test suite: 119/119 tests pass (16 files). No regressions.

### File List
- `backend/src/services/pushNotification.service.ts`
- `backend/src/controllers/notification.controller.ts`
- `backend/src/controllers/notification.controller.test.ts`
- `backend/src/routes/notification.routes.ts`

### Change Log
- Added `sendEventReminderPush` and `sendModerationResolutionPush` helpers to push notification service (Story 5.5)
