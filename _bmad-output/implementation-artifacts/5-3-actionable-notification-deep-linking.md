# Story 5.3: Actionable Notification Deep Linking

Status: done

## Story
As a member receiving a push notification,
I want tapping the notification to open directly to the relevant conversation, post, or event,
So that I don't have to manually search for the context of the alert.

## Acceptance Criteria
1. **Given** I have received a push notification about a specific DM,
   **When** I tap the notification from my OS lock screen,
   **Then** the La Luma app opens and routes me directly to that specific conversation thread.

## Tasks / Subtasks
- [x] Task 1: Backend — Deep Link Data in Push Payloads
  - [x] Subtask 1.1: `sendPushToUser` callers populate `data.deepLink` with `luma://conversation/<id>` URL.
  - [x] Subtask 1.2: `messages.controller.ts` `sendMessage` and `sendAttachmentMessage` fire push with `data.deepLink`, `conversationId`, and `type`.
- [x] Task 2: Payload Schema Documentation
  - [x] Subtask 2.1: `PushPayload.data` documented with a full JSDoc describing the deep-link URL scheme and all standard fields.
- [x] Task 3: Unit Tests
  - [x] Subtask 3.1: Added test verifying `sendPushToUser` is called with correct `data.deepLink` on `sendMessage`.

## Dev Notes
- Deep linking is primarily a **mobile-client concern** (Capacitor / native SDKs handle the URL scheme routing). The backend responsibility is to include the correct `data.deepLink` field in the FCM/APNs `data` bag — NOT in the visible `notification.body`.
- Use the URL scheme `luma://<resource>/<id>` consistently to allow the Capacitor app to parse the route.

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
- Used `setImmediate` in the test to allow the fire-and-forget push promise to settle before asserting.

### Completion Notes List
- All `sendPushToUser` calls in `messages.controller.ts` now include `data.deepLink = luma://conversation/<id>`, `conversationId`, and `type = direct_message`.
- `PushPayload.data` interface documented with the canonical `luma://` URL scheme for conversations, posts, and events.
- 4-test messages controller suite + full suite (106 tests) green.

### File List
- `backend/src/controllers/messages.controller.ts`
- `backend/src/controllers/messages.controller.test.ts`
- `backend/src/services/pushNotification.service.ts`
