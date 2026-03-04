# Story 1.5: Profile Viewing & Editing (FR4)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story
As a member,
I want to view and edit my profile information (avatar, bio, display name),
So that I can control how I represent myself to the community.

## Acceptance Criteria
1. **Given** I am an authenticated member,
   **When** I navigate to the Profile Settings screen,
   **Then** I can upload a new avatar image, update my bio, and change my display name,
   **And** saving these changes updates my public presence across the platform asynchronously.

## Tasks / Subtasks

- [x] Task 1: Verify Profile Updating Endpoint (AC: 1)
  - [x] Subtask 1.1: Ensure `PATCH /users/me` (or similar) supports updating `displayName` and `aboutMe`.
  - [x] Subtask 1.2: Validate input limits (e.g., bio character counts).
- [x] Task 2: Verify Avatar Upload Endpoint (AC: 1)
  - [x] Subtask 2.1: Ensure `POST /users/me/avatar` supports image uploads (multipart/form-data) and saves the reference to DB `profileImageUrl`.
- [x] Task 3: Unit Tests (AC: 1)
  - [x] Subtask 3.1: Write unit tests in `user.controller.test.ts` for profile updating logic and avatar uploading.

## Dev Notes
- The core controller logic for this might already exist in `user.controller.ts` from earlier holistic implementations. If so, simply write the unit tests and ensure edge cases (validation) operate correctly.
- Avatar upload relies on multer middleware (`imageUpload`) which was patched previously in `upload.ts`.

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
None

### Completion Notes List
- Verified `PATCH /users/me` using `updateCurrentUser`. `updateProfileSchema` checks validation successfully for Name limits and Bio limits.
- Verified `POST /users/me/avatar` acts as multipart-file upload safely recording to `profileImageUrl` via Prisma.
- Wrote robust new unit tests covering positive updates and failure variants for both routes.
- Executed `npm run test` yielding 45 total positive passing tests.

### File List
- `backend/src/controllers/user.controller.test.ts`
