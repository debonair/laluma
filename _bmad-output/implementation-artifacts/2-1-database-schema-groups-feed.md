# Story 2.1: Database Schema for Groups & Feed

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story
As a backend developer,
I want to update the Prisma schema for Groups, Post relations, and user memberships,
So that the data layer can support group discovery, joining, and chronological feed queries.

## Acceptance Criteria
1. **Given** the existing database schema,
   **When** the migration is run,
   **Then** the `Group`, `GroupMembership`, and `Post` models are created/updated,
   **And** relations between Users, Groups, and Posts are correctly established.

## Tasks / Subtasks

- [x] Task 1: Verify Schema (AC: 1)
  - [x] Subtask 1.1: Verify if the `Group`, `GroupMember`, and `Post` schemas already exist inside `backend/prisma/schema.prisma` (from previous iterations).
  - [x] Subtask 1.2: Ensure they meet all criteria for group discovery (e.g. `createdAt`, `isPrivate`, location data) joining (`GroupMember`), and feeds (`Post` relations to User and Group).
- [x] Task 2: Validate Migration State (AC: 1)
  - [x] Subtask 2.1: If there are required updates, compile types `npx prisma generate` and sync via `npx prisma db push` or `prisma migrate dev`.
- [x] Task 3: Controller Checks (Optional)
  - [x] Subtask 3.1: Given that schemas might already be present, ensure there is at least one test or endpoint asserting these items link together correctly (e.g., verifying `Post` creation is bound to a valid group in our test suite).

## Dev Notes
- Since we had a strong setup phase earlier in Epic 1, many of these models were drafted broadly. We just need to verify they match the exact needs of Epic 2 perfectly and lock in the types. We will treat `GroupMember` as the mapping for User <-> Group.

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
None

### Completion Notes List
- Verified `Group` model has required `name`, `description`, `imageEmoji`, `imageUrl`, geo tags `latitude`/`longitude`, and `isPrivate` flags.
- Verified `GroupMember` model correctly joins `userId` and `groupId` via cascade actions.
- Verified `Post` model properly references `user` via `authorId` and targets `groupId` while providing `createdAt`.
- Verified controllers already have passing unit tests mapping group interactions (51 passing). DB passes schemas checks naturally. No DB changes required.

### File List
- `backend/prisma/schema.prisma`
