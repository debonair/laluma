# Story 3.3: Post Editing & Deletion (FR9)

Status: done

## Story
As a member who has previously posted,
I want to edit the text of my post or permanently delete it,
So that I can correct mistakes or remove content I no longer wish to share.

## Acceptance Criteria
1. **Given** I am viewing a post I authored,
   **When** I select "Edit" and update the text,
   **Then** the post displays an "(edited)" badge to the community,
   **And When** I select "Delete",
   **Then** the post and its associated media are soft-deleted from the feed and database.

## Tasks / Subtasks

- [x] Task 1: Schema Updates (AC: 1)
  - [x] Subtask 1.1: Add `isDeleted DateTime?` or `isDeleted Boolean` to `Post` Prisma model (we will use `deletedAt DateTime?` for soft-delete pattern).
  - [x] Subtask 1.2: Ensure `GET /feed` and other read queries filter out `deletedAt != null` posts.
- [x] Task 2: Edit Endpoint (AC: 1)
  - [x] Subtask 2.1: Add `PUT /groups/:groupId/posts/:postId` endpoint in `posts.controller.ts`.
  - [x] Subtask 2.2: Ensure only the author can edit the post. Note: UI badge relies on `updatedAt > createdAt` comparison.
- [x] Task 3: Soft Delete Endpoint (AC: 1)
  - [x] Subtask 3.1: Update `DELETE /groups/:groupId/posts/:postId` to perform a soft delete (`deletedAt = now()`) instead of hard deletion.
- [x] Task 4: Unit Testing (AC: 1)
  - [x] Subtask 4.1: Write tests for editing (success, unauthorized author).
  - [x] Subtask 4.2: Write tests for soft deleting.

## Dev Notes
- For the `(edited)` badge, frontend will check if `updatedAt` is significantly after `createdAt`.
- We already have a `deletePost` endpoint in `posts.controller.ts`, just need to modify it from `prisma.post.delete` to `prisma.post.update({ data: { deletedAt: new Date() } })`.

## Dev Agent Record

### Agent Model Used
Antigravity M37

### Debug Log References
None

### Completion Notes List
- Constructed soft-delete strategy via `deletedAt DateTime?` mappings globally to Postgres DB tables using Prisma mapping representations natively.
- Fixed `getGroupPosts`, `getPostComments` mappings to actively reject `deletedAt !== null` database elements for filtering.
- Reconfigured `deletePost` route to act as `update` replacing actual destructs with soft deletes natively.
- Appended `editPost` inside controller configurations utilizing standard payloads for modifying logic safely returning `updatedAt` for badge assertions frontendly. 

### File List
- `backend/prisma/schema.prisma`
- `backend/src/routes/posts.routes.ts`
- `backend/src/controllers/posts.controller.ts`
- `backend/src/controllers/posts.controller.test.ts`
- `backend/src/test/setup.ts`
