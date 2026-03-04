# Story 3.1: Named Post Creation (FR9)

Status: done

## Story
As a member,
I want to create a structured post within a group using my real identity,
So that I can share my experiences or ask questions to the community.

## Acceptance Criteria
1. **Given** I am an authenticated member belonging to a group,
   **When** I create a new post with text content and submit it,
   **Then** the post is visible in the group feed with my specific display name and avatar,
   **And** the post creation adheres to the server-side keyword blocklist check (epic 6 dependency).

## Tasks / Subtasks

- [x] Task 1: Post Creation Endpoint (AC: 1)
  - [x] Subtask 1.1: Verify `POST /groups/:groupId/posts` endpoint in `posts.controller.ts` works as expected.
  - [x] Subtask 1.2: Ensure the post response includes the author's display name and username.
- [x] Task 2: Blocklist Validation (Placeholder for Epic 6) (AC: 1)
  - [x] Subtask 2.1: Add a placeholder comment/TODO for keyword blocklist check in `createPost`.
- [x] Task 3: Unit Testing (AC: 1)
  - [x] Subtask 3.1: Verify `posts.controller.test.ts` validates post creation effectively.

## Dev Notes
- We implemented `createPost` in `posts.controller.ts` previously for socket emits. We need to double-check the controller to make sure it includes the `author` populated fields.

## Dev Agent Record

### Agent Model Used
Antigravity M37

### Debug Log References
None

### Completion Notes List
- Existing `createPost` inside `posts.controller.ts` implemented during Epic 2 natively adheres to basic functionality (AC 1).
- Updated `createPost` to eagerly return `profile_image_url` on author populated responses, meeting the AC request for displaying avatars in the frontend responses.
- Added code `# TODO (Epic 6): Implement server-side keyword blocklist validation here` as explicit linkage.
- Validated via existing `vitest` tests from earlier; UI returns match expected types. 

### File List
- `backend/src/controllers/posts.controller.ts`
