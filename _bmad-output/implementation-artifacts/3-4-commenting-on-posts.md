# Story 3.4: Commenting on Posts (FR11)

Status: done

## Story
As a member,
I want to write replies/comments underneath a post,
So that I can provide support or engage in a discussion.

## Acceptance Criteria
1. **Given** I am viewing a post in my feed,
   **When** I submit a text comment,
   **Then** the comment appears linearly underneath the post,
   **And** the post's comment count is incremented,
   **And** the post author receives a notification (Epic 5 dependency).

## Tasks / Subtasks
- [x] Task 1: Verify `createComment` endpoint completes ACs
  - [x] Subtask 1.1: Ensure `createComment` increments post `commentsCount`.
  - [x] Subtask 1.2: Ensure `getPostComments` sorts ascendingly (linearly).
- [x] Task 2: Edit/Delete Comments (Implicitly expected based on Post Editing & Deletion)
  - [x] Subtask 2.1: Implement `editComment` endpoint.
  - [x] Subtask 2.2: Implement `deleteComment` endpoint (soft delete).
- [x] Task 3: Unit Testing
  - [x] Subtask 3.1: Write tests for `createComment`.
  - [x] Subtask 3.2: Write tests for `editComment` and `deleteComment`.

## Dev Notes
- We already added `createComment` and `getPostComments` in Story 3.2. We need to check if they fulfill the incrementing condition and sorting condition.
- We should also add edit and delete for comments to maintain feature parity with posts.

## Dev Agent Record

### Agent Model Used
Antigravity M37

### Debug Log References
None

### Completion Notes List
- Validated `createComment` correctly incrementing `commentsCount`.
- Validated `getPostComments` effectively sorting `comments` linearly ascendingly.
- Constructed `editComment` to accept edit updates by origin user, utilizing `zod` definitions mirroring posts schemas.
- Reconstructed `deleteComment` to perform transactional decrements inside a soft-delete scope correctly updating timestamps.
- Added comprehensive unit-testing for testing validations correctly mocking Prisma models natively in the testing suite.

### File List
- `backend/src/routes/posts.routes.ts`
- `backend/src/controllers/posts.controller.ts`
- `backend/src/controllers/posts.controller.test.ts`
- `backend/src/test/setup.ts`
