# Story 6.1: Real-Time Keyword Blocklist (FR20)

Status: done

## Story

As a platform administrator,
I want the system to synchronously check new posts against a severe keyword blocklist before saving them,
So that worst-case content never reaches the primary database or feed.

## Acceptance Criteria

1. **Given** a user is submitting a new post or comment,
   **When** the payload contains words matching the exact phrases in the blocklist (managed via env or db),
   **Then** the server forcefully rejects the request with a descriptive error,
   **And** the data is not written to the database.

## Tasks / Subtasks

- [x] Task 1: Create a Blocklist Validation Service
  - [x] Subtask 1.1: Create `backend/src/services/moderation.service.ts` with a `containsBlockedKeywords(text: string): boolean` helper function.
  - [x] Subtask 1.2: Implement keyword matching logic. Load keywords from `process.env.BLOCKLIST_KEYWORDS` (comma-separated strings) or fallback to a hardcoded array if empty.
  - [x] Subtask 1.3: Write unit tests in `moderation.service.test.ts` verifying word-boundary checks and case-insensitivity.

- [x] Task 2: Intercept Post Creation
  - [x] Subtask 2.1: In `backend/src/controllers/posts.controller.ts` in `createPost` function, check the `content` against the blocklist before calling Prisma.
  - [x] Subtask 2.2: If blocked, return a 400 Bad Request with `{ error: 'Bad Request', message: 'Content contains restricted keywords.', code: 'CONTENT_BLOCKED' }`.
  - [x] Subtask 2.3: Write integration tests asserting blocked posts return 400 and are not saved in the DB.

- [x] Task 3: Intercept Comment Creation
  - [x] Subtask 3.1: In `backend/src/controllers/posts.controller.ts` in `createComment` function, check the `content` against the blocklist before calling Prisma.
  - [x] Subtask 3.2: If blocked, return a 400 Bad Request.
  - [x] Subtask 3.3: Write integration tests asserting blocked comments return 400 and are not saved in the DB.

## Dev Notes

### Architecture Context
- **Validation layer**: We are performing this check *synchronously* during the HTTP request handler before Prisma `create` is called. It is distinct from the async AI Sentiment Pipeline (Story 6.2).
- **Keyword Source**: Since there is no DB model for keywords yet, using a comma-separated environment variable (`BLOCKLIST_KEYWORDS`) parsed into an array on startup is the requested architecture "(managed via env or db)".
- **Matching logic**: Ensure case-insensitive matching (`toLowerCase()`), and ideally respect word boundaries (so banning "ass" doesn't block "glass"). A straightforward Regex with `\b` boundaries is recommended.

### File Locations
- `backend/src/services/moderation.service.ts` (NEW) - Core blocklist logic.
- `backend/src/services/moderation.service.test.ts` (NEW) - Testing the helper.
- `backend/src/controllers/posts.controller.ts` (MODIFY) - Add blocklist check to `createPost` and `createComment`.
- `backend/src/controllers/posts.controller.test.ts` (MODIFY) - Add tests for the new failure paths.

### Validation Expectations
- `cd backend && npm test` should pass 100%. The test suite existing for posts must not break for valid payloads.

## Dev Agent Record

### Agent Model Used
Antigravity

### Completion Notes List
- `backend/src/services/moderation.service.ts` created to handle blocklist parsing from `process.env.BLOCKLIST_KEYWORDS`.
- Blocklist tests added in `moderation.service.test.ts` confirming case-insensitivity, word boundary regex functionality, and comma parsing handle gaps correctly.
- Synchronous blocklist checks added inside `createPost` and `createComment` in `backend/src/controllers/posts.controller.ts` to reject matching text with HTTP 400.
- Integration tests written in `posts.controller.test.ts` confirming the blocklist interrupts requests gracefully.
- Entire test suite passes perfectly with 128 tests total.

### File List
- `backend/src/services/moderation.service.ts`
- `backend/src/services/moderation.service.test.ts`
- `backend/src/controllers/posts.controller.ts`
- `backend/src/controllers/posts.controller.test.ts`

### Change Log
- Added string-based moderation blocklist checker service
- Prevented posts and comments containing explicit blacklisted terms from writing to the DB via 400 error handling
