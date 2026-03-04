# Story 3.5: Post and Comment Reactions (FR11)

Status: done

## Story
As a member,
I want to add lightweight reactions (e.g., hearts, "heard") to posts and comments,
So that I can show solidarity without needing to write a full reply.

## Acceptance Criteria
1. **Given** I am viewing a post or comment,
   **When** I tap the reaction icon,
   **Then** the UI updates optimistically,
   **And** the server increments the reaction count for that specific piece of content.

## Tasks / Subtasks
- [ ] Task 1: Schema Updates
  - [ ] Subtask 1.1: Add `reactionType String @default("like")` to `PostLike`.
  - [ ] Subtask 1.2: Create `CommentLike` model with `reactionType`.
  - [ ] Subtask 1.3: Update Prisma schema and `npx prisma db push`.
- [ ] Task 2: Post Reactions
  - [ ] Subtask 2.1: Update `likePost` endpoint schema to capture `reactionType`.
  - [ ] Subtask 2.2: Ensure backward compatibility mapping logic.
- [ ] Task 3: Comment Reactions Endpoint
  - [ ] Subtask 3.1: Create `POST /:postId/comments/:commentId/like`.
  - [ ] Subtask 3.2: Create `DELETE /:postId/comments/:commentId/like`.
- [ ] Task 4: Unit Testing
  - [ ] Subtask 4.1: Write tests for updated `likePost`.
  - [ ] Subtask 4.2: Write tests for `likeComment` / `unlikeComment`.

## Dev Notes
- For the UI optimistic updates, socket emits like `post_updated` and `comment_updated` will be pushed with updated counts.
- Reusing `PostLike` and creating `CommentLike` instead of a generic `Reaction` table ensures we don't break existing dependencies heavily.
- Allow `reactionType` in the `POST` payload.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
