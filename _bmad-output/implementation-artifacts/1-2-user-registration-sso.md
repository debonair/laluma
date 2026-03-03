# Story 1.2: User Registration & SSO (FR1)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a new visitor,
I want to securely create an account using my email or social login (Google/Apple),
So that I can access the Luma platform.

## Acceptance Criteria

1. **Given** I am an unauthenticated visitor on the native app or web,
   **When** I press "Sign in with Google", "Sign in with Apple", or enter my email/password,
   **Then** I am authenticated via Keycloak,
   **And** a User record is created in the PostgreSQL database via JIT provisioning with the default `member` role,
   **And** my secure session (JWT) is established across restarts.

## Tasks / Subtasks

- [x] Task 1: Fix existing role-assignment bug in signUp controller (AC: 1)
  - [x] Subtask 1.1: In `backend/src/controllers/auth.controller.ts`, the `signUp` function assigns the old `app-user` role (line ~154). Update it to assign the new `member` role from the `UserRole` enum instead.
- [x] Task 2: Validate OAuth Social Login redirect flows exist (AC: 1)
  - [x] Subtask 2.1: Confirm (or document as out-of-scope for this story) that Keycloak realm already has Google / Apple Identity Providers configured. If not, add a note in Dev Notes and create a placeholder redirect endpoint at `GET /auth/oauth/:provider` that returns a Keycloak-generated redirect URL.
- [x] Task 3: Validate persistent JWT session across app restarts (AC: 1)
  - [x] Subtask 3.1: Confirm the existing `POST /auth/refresh` endpoint uses the Keycloak refresh token correctly. Verify it returns a new `accessToken` and `refreshToken` and that the frontend (Capacitor/React) stores these securely (AsyncStorage / SecureStorage). Document the storage strategy in Dev Notes if not already captured.
- [x] Task 4: Write/update unit tests (AC: 1)
  - [x] Subtask 4.1: Update `backend/src/controllers/auth.controller.test.ts` to assert the `member` role is assigned (not `app-user`) during sign-up.
  - [x] Subtask 4.2: Add test cases for the `POST /auth/refresh` endpoint to verify token response shape.

## Dev Notes

### Previous Story Intelligence (Story 1.1)
- **UserRole enum** was added to `backend/prisma/schema.prisma`. Import it via `import { UserRole } from '@prisma/client'` when referencing roles.
- **JIT provisioning** in `backend/src/middleware/auth.ts` already maps all 5 Keycloak realm roles correctly.
- **Key finding:** The `signUp` function in `auth.controller.ts` (line 154) still assigns `'app-user'` role — a legacy role that no longer exists. This is a **bug that must be fixed** as Task 1.

### Architecture Constraints
- **Backend:** Express 4 / Prisma 6 / PostgreSQL 15 + Keycloak 26.
- **Auth Flow:** ROPC (Resource Owner Password Credentials / Direct Grant) is used for email/password. Social logins go through Keycloak Identity Provider redirect flows.
- **Social SSO:** Google and Apple OAuth are configured at the Keycloak realm level. The mobile app (Capacitor) uses Keycloak's PKCE redirect flow to handle social sign-in. This story only needs to verify the flow is wired, not build OAuth from scratch.
- **Token Persistence:** Capacitor apps should use `@capacitor-community/secure-storage-plugin` or `Preferences.set(...)` to store the refresh token between sessions. The backend does not need changes for this — it's frontend concern only.

### Project Structure Notes
- Auth controller: `backend/src/controllers/auth.controller.ts`
- Auth middleware (JIT provisioning): `backend/src/middleware/auth.ts`
- Auth routes: `backend/src/routes/auth.routes.ts`
- Auth tests: `backend/src/controllers/auth.controller.test.ts`

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1-2]
- [Source: backend/src/controllers/auth.controller.ts#signUp (legacy app-user role bug at line ~154)]
- [Source: backend/src/middleware/auth.ts (UserRole JIT mapping - done in Story 1.1)]

## Dev Agent Record

### Agent Model Used

Antigravity

### Debug Log References

### Completion Notes List
- Fixed the previous bug where `app-user` role was requested in `signUp`. Replaced with `member`.
- Verified the refresh token logic in `refreshToken` inside `auth.controller.ts` is robust and issues new JWTs.
- Created a placeholder `GET /auth/oauth/:provider` route to define where the React/Capacitor application initiates Identity Provider flows for Google/Apple using PKCE.
- Updated `auth.controller.test.ts` to verify the missing endpoints and modified the previously failing mock payload testing.
- `npm run test` confirms 33 unit tests pass.
- **Code Review Fixes:** Addressed unhandled promise rejection in role assignment try/catch block during `signUp`; ran `npm audit fix` addressing `minimatch` and `multer`. (Left `tar` vulnerabilities alone as they reside deep inside mapbox dependency). Added OAuth callback routing documentation; committed all changes cleanly to Git.

### File List
- `backend/src/controllers/auth.controller.ts`
- `backend/src/routes/auth.routes.ts`
- `backend/src/controllers/auth.controller.test.ts`
