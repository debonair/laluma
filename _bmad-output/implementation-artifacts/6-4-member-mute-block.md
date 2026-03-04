# Story 6.4: Member Mute & Block (FR19)

Status: done

## Story
As a member,
I want to mute or block specific users,
So that I can enforce my personal boundaries and prevent them from contacting me or seeing my named posts.

## Acceptance Criteria
- [x] Users can block other users via a dedicated API endpoint (`POST /users/:userId/block`).
- [x] Users can unblock users (`DELETE /users/:userId/block`).
- [x] Blocked users' past and future posts/comments are omitted from the blocking user's chronological feed and group post lists.
- [x] Blocked users are prevented from creating new Direct Message conversations or sending messages in existing ones to the blocking user.
- [x] The blocking action is mutually enforcing (the blocked user also cannot see the blocker's posts).

## Tasks / Subtasks

- [x] Task 1: Database Schema Expansion
  - [x] Subtask 1.1: Edit `schema.prisma` to add a `UserBlock` model storing `blockerId` and `blockedId` with a unique compound constraint.
  - [x] Subtask 1.2: Run `npx prisma db push --accept-data-loss` and fetch the generated Prisma Client.

- [x] Task 2: Create Block Endpoints
  - [x] Subtask 2.1: Implement logic in `user.controller.ts` (or `block.controller.ts`) for blocking (`blockUser`) and unblocking (`unblockUser`) users.
  - [x] Subtask 2.2: Add the new routes to the Express application context.

- [x] Task 3: Enforcing Block Filtering (Feeds & Posts)
  - [x] Subtask 3.1: Modify `feed.controller.ts` and `posts.controller.ts` to actively exclude posts/comments where the author is within the user's blocked list or has blocked the user.

- [x] Task 4: Enforcing Block Filtering (Direct Messages)
  - [x] Subtask 4.1: Modify `messages.controller.ts` to reject creating conversations with blocked users or sending messages.

- [x] Task 5: Testing & Verification
  - [x] Subtask 5.1: Write unit tests for the new blocking endpoints.
  - [x] Subtask 5.2: Ensure feed filtering and DM sending logic strictly honors the blocklist.

## Dev Notes
- Rely on Prisma's `NOT: { authorId: { in: blockedUserIds } }` for efficient query-side resolution in feed controllers.
- Check user contexts gracefully. Blocks are sensitive and should 404 or return generic error messages for the blocked user when they try to engage to prevent block-discovery retaliation.

---

## Dev Agent Record
- Added `UserBlock` model to Prisma schema
- Generated Prisma client successfully
- Implemented `/users/:id/block` for `POST` and `DELETE` requests in user routes
- Queried global block relations within feeds, posts, and comments controllers
- Included a pre-message guard in the real-time messages controller ensuring blocks block direct messages in both directions
- Passed extensive unit tests and linting protocols

## Review Agent Record
- Verified correct typing structure of all query schemas and payload bindings
- DB relationships were well-formed with cascading deletes applied to user closures correctly
- Logic behaves mutually as spec requests
- Checked for potential regressions and everything works cleanly. Unit tests verified.
