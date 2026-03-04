# Story 4.2: Anonymous Post Creation (FR5)

Status: done

## Story
As a member in a vulnerable moment,
I want to publish a post anonymously,
So that I can share something deeply personal without my named profile being attached to it in the community.

## Acceptance Criteria
1. **Given** I am creating a new post,
   **When** I select the "Post Anonymously" toggle and submit,
   **Then** the UI confirms my explicit consent for anonymous posting,
   **And** the server generates a placeholder anonymous avatar and display name (e.g., "[Color] [Noun]"),
   **And** the post is published to the feed without exposing my real identity to other members.

## Tasks / Subtasks
- [x] Task 1: Generate Anonymous Profiles
  - [x] Subtask 1.1: Create a utility or service to reliably produce unique anonymous animal/color avatars and names (e.g. "Emerald Elephant").
- [x] Task 2: Controller Integration 
  - [x] Subtask 2.1: Update `createPost` to honor the `isAnonymous` flag.
  - [x] Subtask 2.2: Ensure encryption mapping via the `AnonymousPostLink` table for traceability.
  - [x] Subtask 2.3: Modify the payload to strip real identity logic (name, avatar) before socket emit and database save.
- [x] Task 3: Unit Testing
  - [x] Subtask 3.1: Unit testing isolated `createPost` behaviors for Anonymous content masking.

## Dev Notes
- The "UI confirms consent" refers to the frontend, but the backend simply needs to accept the `isAnonymous` boolean.
- We must utilize the crypto service from story 4.1 to save the encrypted ID into `AnonymousPostLink` alongside the `postId` or a unique identity link.
- Generation of the anonymized names can use simple arrays of generic adjectives and animal names to keep logic locally contained.

## Dev Agent Record

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
- `utils/anonymousProfile.test.ts` passed for deterministic avatar assignments.
- `posts.controller.test.ts` tested anonymous parameter interception and masking payload.

### Completion Notes List
- Verified anonymous creation safely detaches `author` information through the `$transaction` layer.
- Ensured deterministic generation uses `Math.abs()` mapping via seeded hashes to avoid negative indexes runtime.
- Emitted payload properly intercepts and substitutes generated IDs. Check passed via tests. 

### File List
- `backend/src/utils/anonymousProfile.ts`
- `backend/src/utils/anonymousProfile.test.ts`
- `backend/src/controllers/posts.controller.ts`
- `backend/src/controllers/posts.controller.test.ts`
