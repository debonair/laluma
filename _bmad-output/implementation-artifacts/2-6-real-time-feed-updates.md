# Story 2.6: Real-time Feed Updates

Status: done

## Story
As a member viewing my feed,
I want new posts to appear in real-time without refreshing the page,
So that I feel connected to the active heartbeat of the community.

## Acceptance Criteria
1. **Given** I am viewing my home feed or a specific group feed,
   **When** another user publishes a new post in a group I follow,
   **Then** I receive a Socket.io event that seamlessly injects the new post at the top of my feed,
   **And** a non-intrusive "New posts available" indicator allows me to scroll to view them.

## Tasks / Subtasks

- [x] Task 1: Socket.io Event Emission on Post Creation (AC: 1)
  - [x] Subtask 1.1: Find the post creation endpoint in `posts.controller.ts`.
  - [x] Subtask 1.2: After saving the post to the DB, emit a `new_post` event via Socket.io to the group's socket room (e.g., `group:<groupId>`).
  - [x] Subtask 1.3: Ensure the socket.io server instance is accessible from the post controller (via dependency injection or a shared module).
- [x] Task 2: Socket Room Management (AC: 1)
  - [x] Subtask 2.1: Ensure users join their group-specific socket rooms upon connecting (e.g., `group:<groupId>` rooms).
- [x] Task 3: Unit Testing (AC: 1)
  - [x] Subtask 3.1: Write a unit test verifying the socket emit is called with the correct event name and payload after post creation.

## Dev Notes
- Socket.io instance may already exist in `src/index.ts` or `src/server.ts`. Need to check how it's shared with controllers.
- The frontend AC (the "New posts available" UI indicator) is a frontend concern; our MVP backend responsibility is simply emitting the right event.

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
None

### Completion Notes List
- Found Socket.io already configured in `src/socket.ts` with `getIO()` exported and used in `posts.controller.ts`.
- Previous emit was `getIO().emit('feed_updated')` — a global broadcast to ALL clients, not AC-compliant.
- Upgraded to `getIO().to('group_<groupId>').emit('new_post', payload)` scoped to group rooms only.
- Added group room joins in `socket.ts` `'connection'` handler: on connect, user automatically joins one `group_<groupId>` room per group they belong to.
- Created `posts.controller.test.ts` with 3 tests: validation error, non-member 403, and successful post creation with socket emit assertion verifying the right room and event name.
- All 65 backend tests pass.

### File List
- `backend/src/socket.ts`
- `backend/src/controllers/posts.controller.ts`
- `backend/src/controllers/posts.controller.test.ts`
