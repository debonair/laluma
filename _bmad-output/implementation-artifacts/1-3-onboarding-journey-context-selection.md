# Story 1.3: Onboarding Journey - Context Selection (FR2)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a newly registered member,
I want to select my current life stage and journey context during onboarding,
So that my experience is tailored to my specific reality as a single mother.

## Acceptance Criteria

1. **Given** I have just completed registration and have no context fields set,
   **When** I load the app for the first time,
   **Then** I am routed to a safe, guided onboarding flow,
   **And** I can select my "life stage" and "journey context",
   **And** I cannot bypass this step, but I can change these settings later in my profile.

## Tasks / Subtasks

- [x] Task 1: Create Profile Onboarding API Endpoints (AC: 1)
  - [x] Subtask 1.1: Create `backend/src/controllers/user.controller.ts` with an `updateOnboardingContext` endpoint that accepts `lifeStage` and `journeyContext`.
  - [x] Subtask 1.2: Validate input against predefined enums/constants for life stages and contexts.
  - [x] Subtask 1.3: Update the user record via Prisma.
- [x] Task 2: Create User Routes (AC: 1)
  - [x] Subtask 2.1: Add `backend/src/routes/user.routes.ts` protecting the endpoint with the `authenticate` middleware.
  - [x] Subtask 2.2: Mount `/users` routes on the main Express app in `backend/src/index.ts`.
- [x] Task 3: Expose Onboarding Completion Status (AC: 1)
  - [x] Subtask 3.1: Add a `GET /users/me` endpoint (or similar) that returns the current user's profile so the frontend knows if `lifeStage` or `journeyContext` is missing and can route the user to the onboarding flow based on this.
- [x] Task 4: Write Unit Tests (AC: 1)
  - [x] Subtask 4.1: Create `backend/src/controllers/user.controller.test.ts`.
  - [x] Subtask 4.2: Verify that updating context fails if fields are invalid.
  - [x] Subtask 4.3: Verify that updating works and saves to PostgreSQL.
  - [x] Subtask 4.4: Verify `GET /users/me` returns profile attributes properly.

## Dev Notes

- The `User` model in `schema.prisma` already has `lifeStage` and `journeyContext` fields (String, nullable) from Story 1.1. We don't need any database migrations for this story!
- We need to define logical constants in code for the allowed values for `lifeStage` (e.g. 'expecting', 'new_mom', 'toddler_years', etc.) and `journeyContext` (e.g. 'solo_by_choice', 'co_parenting', 'widowed', etc.) or we can just accept any string for now. Let's strictly validate against a predefined Zod schema list of allowed values.
- The UI routing logic (cannot bypass the step) happens on the frontend. The backend only needs to provide the `GET /users/me` state to enable the frontend's routing guards.

## Dev Agent Record

### Agent Model Used
Antigravity 

### Debug Log References
None

### Completion Notes List
- Evaluated Prisma schema and verified `lifeStage` and `journeyContext` were already configured.
- Implemented `updateOnboardingContext` and `getCurrentUser` returning `hasCompletedOnboarding` flag and matching constants.
- Generated tests, checked off API coverage.
- Code Review phase automatically identified missing guard clauses around `req.user.userId`. Applied `401 Unauthorized` checks gracefully handling this scenario.

### File List
- `backend/src/controllers/user.controller.ts`
- `backend/src/controllers/user.controller.test.ts`
- `backend/src/routes/user.routes.ts`
