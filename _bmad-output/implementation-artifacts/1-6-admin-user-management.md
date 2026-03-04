# Story 1.6: Admin User Management (FR8, FR54)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story
As an admin,
I want to be able to deactivate/remove accounts and manage user roles via an admin interface,
So that I can enforce community safety and delegate operational duties.

## Acceptance Criteria
1. **Given** I am authenticated with the `admin` role,
   **When** I access the Admin Dashboard -> User Management section,
   **Then** I can view a list of all registered users,
   **And** I can assign/revoke roles (e.g., promote a member to moderator),
   **And** I can deactivate a user account, preventing them from logging in immediately without hard-deleting their data.

## Tasks / Subtasks

- [x] Task 1: Admin User Listing Endpoint (AC: 1)
  - [x] Subtask 1.1: Ensure an admin-protected endpoint exists to scan and fetch all users (`GET /admin/users`) using `admin.controller.ts`.
- [x] Task 2: Role Management Endpoint (AC: 1)
  - [x] Subtask 2.1: Ensure an endpoint exists to change a user's local `role` database column (e.g. `PATCH /admin/users/:id/role`).
  - [x] Subtask 2.2: Trigger a synchronous request to Keycloak `kcAdminClient.users.update` or equivalent if required, to keep SSO identity roles mapped correctly to the new role. (Or assume JIT login handles the mapping in next session).
- [x] Task 3: User Deactivation Endpoint (AC: 1)
  - [x] Subtask 3.1: Add functionality to `PATCH /admin/users/:id/status` protecting state changes (e.g. deactivate user).
  - [x] Subtask 3.2: Make sure this sets `enabled: false` via Keycloak's API to immediately invalidate authentication.
- [x] Task 4: Admin Role Middleware (AC: 1)
  - [x] Subtask 4.1: Ensure an `authenticateAdmin` or `requireRole('admin')` middleware secures these routes properly.
- [x] Task 5: Unit Tests (AC: 1)
  - [x] Subtask 5.1: Create `admin.controller.test.ts` mocking Keycloak calls and verifying Prisma state changes and HTTP responses.

## Dev Notes
- Security is paramount here. The routes must be checked by role.
- Active authentication revocation / banning requires disabling the user directly inside Keycloak, otherwise relying on Prisma columns alone might let an active JWT remain valid. Keycloak Client API must be invoked via `'@keycloak/keycloak-admin-client'`.

## Dev Agent Record

### Agent Model Used
Antigravity

### Debug Log References
None

### Completion Notes List
- Evaluated and added `isActive` boolean property to Prisma's User schema, performing `prisma migrate dev` (handled via DB push).
- Established `@keycloak/keycloak-admin-client` explicitly into dependencies and implemented robust `utils/keycloak.ts`.
- Added standard endpoint `GET /admin/users`.
- Added dynamic property `PATCH /admin/users/:id/role` resolving local states and caching Keycloak update capabilities.
- Added deactivation `PATCH /admin/users/:id/status` triggering actual Keycloak `enabled: false` state pushing API.
- Secured routes via existing `requireRole('app-admin', 'admin')`.
- Unit tested edge-case mocked inputs yielding 51 total passing tests across the backend workspace.

### File List
- `backend/prisma/schema.prisma`
- `backend/src/controllers/admin.controller.ts`
- `backend/src/routes/admin.routes.ts`
- `backend/src/utils/keycloak.ts`
- `backend/src/controllers/admin.controller.test.ts`
- `backend/package.json`

