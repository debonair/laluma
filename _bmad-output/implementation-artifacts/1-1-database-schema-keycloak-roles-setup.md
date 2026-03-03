# Story 1.1: Database Schema & Keycloak Roles Setup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a platform administrator,
I want the core identity data models and Keycloak RBAC roles configured,
so that the identity system can support the 5-role permission model and user profile data.

## Acceptance Criteria

1. **Given** an empty or existing Keycloak realm,
   **When** the initialization script or Terraform is run,
   **Then** the 5 roles (`member`, `moderator`, `editorial`, `admin`, `brand_partner`) are created.
2. **Given** the Prisma data schema,
   **When** the migration is run,
   **Then** the Prisma schema is updated to include a `role` field on the `User` model along with profile fields (`avatar`, `bio`, `displayName`, `lifeStage`, `journeyContext`).
3. **Given** the Prisma data schema,
   **When** the migration is run,
   **Then** add `anonymousFlag` and an identity link reference to `Post` and moderation settings to `Group`.

## Tasks / Subtasks

- [x] Task 1: Keycloak Role Configuration (AC: 1)
  - [x] Subtask 1.1: Create Keycloak configuration script (or Terraform config) to set up the 5 realm roles (`member`, `moderator`, `editorial`, `admin`, `brand_partner`).
  - [x] Subtask 1.2: Update the JIT (Just-In-Time) provisioning logic so that newly registered users are automatically assigned the `member` role upon their first login.
- [x] Task 2: Prisma Schema Updates (AC: 2, 3)
  - [x] Subtask 2.1: Update the `User` model to include `role` (enum mapping to the RBAC roles), `avatar` (string/URL), `bio` (string), `displayName` (string), `lifeStage` (string), and `journeyContext` (string).
  - [x] Subtask 2.2: Update the `Post` model to include an `anonymousFlag` (boolean, default false) and a reference to the secure identity link in the isolated schema.
  - [x] Subtask 2.3: Update the `Group` model to include moderation settings (JSON or specific fields).
  - [x] Subtask 2.4: Generate and run the Prisma migration (`npx prisma migrate dev`).

## Dev Notes

- **Architecture Details:** The existing architecture uses Express 4, Prisma 6, and PostgreSQL 15. The first implementation task specified by the architecture document is a complete Prisma model audit to add these fields so that all other feature work is unblocked.
- **Keycloak JIT Adaptation:** Keycloak is already integrated, but you must intercept the first login payload to assign the `member` role safely.
- **Anonymous Post Design Constraint:** Note that the anonymous identity linking store itself must reside in a completely isolated database schema and remain inaccessible to direct API queries. This story only creates the *reference* on the `Post` side.

### Project Structure Notes

- **Backend:** Prisma schema is at `backend/prisma/schema.prisma`. 
- **Roles Context:** Ensure backend typings in `backend/src/middleware/rbac.ts` cover all 5 roles.
- No existing conflicts detected - this is adding directly to established baseline structure.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#First-Implementation-Task]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1-1]

## Dev Agent Record

### Agent Model Used

Antigravity 

### Debug Log References

### Completion Notes List
- Generated setup bash script `backend/scripts/setup-keycloak-roles.sh` for the 5 realm roles.
- Updated Prisma schema `backend/prisma/schema.prisma` including profile fields, anonymous flag on posts, and group moderation settings.
- Ran `npx prisma migrate dev --name add_role_profile_anonymous_fields` up.
- Checked and updated Keycloak roles derived into JIT provisioning to match new schema inside `backend/src/middleware/auth.ts`.
- Verified API routes testing via `npm run test` using `vitest` which passed for controllers.
- **Code Review Fixes:** Added `UserRole` Prisma enum; removed redundant `avatar`/`bio`/`anonymousFlag` fields (existing fields cover these); added `@map()` snake_case DB mappings; added `npm run setup:keycloak` npm script; ran `prisma generate` so `UserRole` is type-safe in auth.ts.

### File List
- `backend/scripts/setup-keycloak-roles.sh`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/` (migration generated)
- `backend/src/middleware/auth.ts`
- `backend/package.json`
