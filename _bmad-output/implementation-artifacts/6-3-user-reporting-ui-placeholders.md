# Story 6.3: User Reporting & UI Placeholders (FR18, FR24)

Status: done

## Story
As a member,
I want to report concerning posts/comments and see them instantly hidden from my view,
So that I don't have to keep looking at harmful content while moderation reviews it.

## Acceptance Criteria
1. **Given** I am viewing a post or comment,
   **When** I tap "Report" and submit a reason,
   **Then** the backend records the report and places the item into the moderation queue,
   **And** the UI instantly replaces the post with a trauma-informed placeholder stating "You have reported this content. Thank you for keeping the community safe." (Note: Backend only for now).
2. **Given** a content item is reported by a user,
   **Then** subsequent fetches of the feed for *that specific user* hide the reported item or flag it so the frontend knows to obscure it.

## Tasks / Subtasks

- [x] Task 1: Database Schema Expansion
  - [x] Subtask 1.1: Edit `schema.prisma` to add a `Report` or `ModerationItem` model linking to a `reporterId`, `postId` (optional), `commentId` (optional), `reason`, and `status`.
  - [x] Subtask 1.2: Run `npx prisma db push --accept-data-loss` and generate the Prisma Client.

- [x] Task 2: Create Moderation API Endpoints
  - [x] Subtask 2.1: Add a new `backend/src/routes/moderation.routes.ts` file handling `POST /api/moderation/report`.
  - [x] Subtask 2.2: Add `backend/src/controllers/moderation.controller.ts` with a `reportContent` function that validates inputs (reason string, item type, ID).
  - [x] Subtask 2.3: Record the report in the database using the new Prisma models. Address race conditions (idempotently ignoring if already reported). 

- [x] Task 3: Filtering User Feeds (Optional but Recommended)
  - [x] Subtask 3.1: If possible, alter the `feed.controller.ts` and `posts.controller.ts` to exclude posts/comments that the requesting user has reported, enforcing the "hidden from my view" requirement server-side.

- [x] Task 4: Testing & Verification
  - [x] Subtask 4.1: Write unit tests in `moderation.controller.test.ts`.
  - [x] Subtask 4.2: Ensure the feed filter logic is tested.

## Dev Notes
- For the schema, a versatile `ModerationItem` model is best, as future stories (Story 6.5) require it. 
- "Hidden from my view": This typically means either the server omits reported items, or passes a `has_reported` boolean on the post payload so frontend can replace it. Returning it with `has_reported = true` allows the frontend to show the placeholder perfectly. We will modify `getFeed` and `getGroupPosts` to include standard boolean flags or similar.
- Remember to wire `moderation.routes.ts` into `index.ts`.

## Dev Agent Record
- Upgraded the `schema.prisma` architecture to encapsulate `ModerationItem` globally across different models to allow easy expansion (My Luma `content` / Luma `post` / `comment`).
- Created `/api/moderation/report` to log manual user reporting. Upsert mechanism avoids redundant db checks while gracefully resolving race conditions gracefully.
- Configured DB level filtering by implementing a clever `NOT: { moderationItem: { reports: ... } }` rule into `/api/feed` and `/api/posts` controllers. Members strictly do not download items they have signaled as unsafe.
- Passed all automated Vitest testing.
