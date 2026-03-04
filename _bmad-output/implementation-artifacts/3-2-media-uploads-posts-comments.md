# Story 3.2: Media Uploads for Posts/Comments (FR10)

Status: done

## Story
As a member creating a post or comment,
I want to attach images securely,
So that I can share visual context with the community.

## Acceptance Criteria
1. **Given** I am creating a post or comment,
   **When** I attach an image file,
   **Then** the UI confirms upload initiation within 3 seconds,
   **And** the file is uploaded to object storage directly via a signed URL,
   **And** the resulting media URL is attached to my post/comment payload.

## Tasks / Subtasks

- [x] Task 1: Pre-signed URL Endpoint (AC: 1)
  - [x] Subtask 1.1: Create `POST /media/upload-url` endpoint to generate S3/R2 direct upload pre-signed URLs.
  - [x] Subtask 1.2: Ensure the endpoint validates file type (images only) and size constraints.
- [x] Task 2: Schema Update (AC: 1)
  - [x] Subtask 2.1: Add `mediaUrls String[]` array column to `Post` and `Comment` models in Prisma schema if they don't exist.
- [x] Task 3: Post/Comment Creation Endpoints (AC: 1)
  - [x] Subtask 3.1: Update `createPost` to accept and save an optional `mediaUrls` array.
  - [x] Subtask 3.2: Add `mediaUrls` to the response payloads.
- [x] Task 4: Unit Testing (AC: 1)
  - [x] Subtask 4.1: Write unit tests for the upload-url generation.
  - [x] Subtask 4.2: Update `posts.controller.test.ts` to cover `mediaUrls` behavior.

## Dev Notes
- Need an AWS S3 client configured via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`.
- Ensure environment variables are structured to support configuring an S3-compatible service (like Cloudflare R2 or standard AWS S3).

## Dev Agent Record

### Agent Model Used
Antigravity M37

### Debug Log References
None

### Completion Notes List
- Updated Prisma schema to include `mediaUrls String[] @map("media_urls")` inside the `Post` and `Comment` models, respectively.
- Refactored `createPost` & `createComment` inside `posts.controller.ts` to natively parse, map, explicitly accept and hydrate API records containing `.mediaUrls` properties.
- Constructed a `media.controller.ts` providing the `POST /api/media/upload-url` logic with AWS S3 `@aws-sdk/s3-request-presigner` capability securely. Mocks environment flags (`AWS_BUCKET_NAME`, `AWS_REGION`, etc) for usage flexibility later.
- Unit Testing passed with 73 total tests completed utilizing Vitest seamlessly!

### File List
- `backend/prisma/schema.prisma`
- `backend/package.json`
- `backend/src/controllers/media.controller.ts`
- `backend/src/controllers/media.controller.test.ts`
- `backend/src/routes/media.routes.ts`
- `backend/src/index.ts`
- `backend/src/controllers/posts.controller.ts`
- `backend/src/controllers/posts.controller.test.ts`
