# Story 7.2: Admin Event Creation & Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a moderator or admin,
I want to create, edit, and cancel Luma Spaces events (including capacity limits),
So that I can schedule physical meetups for the community.

## Acceptance Criteria

1. **Given** I am an authenticated admin/moderator,
   **When** I complete the event creation form (title, description, location, time, capacity),
   **Then** the event is visible to members immediately or scheduled for publication.
2. **Given** I am an authenticated admin/moderator,
   **When** I create an event with capacity limits,
   **Then** modifying capacity dynamically updates the required registration space.
3. **Given** I am an authenticated admin/moderator,
   **When** I edit an existing event,
   **Then** changes are reflected immediately for all users.
4. **Given** I am an authenticated admin/moderator,
   **When** I cancel an event,
   **Then** all registered members are automatically notified.
5. **Given** the Event model from Story 7.1,
   **When** the API endpoints are designed,
   **Then** CRUD operations are available at `/api/events` with admin-only create/edit/cancel.

## Tasks / Subtasks

- [ ] Task 1: Implement Event Admin API Endpoints (AC: 1, 3, 5)
  - [ ] Subtask 1.1: Create POST /api/events (admin only)
  - [ ] Subtask 1.2: Create PUT /api/events/:id (admin only)
  - [ ] Subtask 1.3: Create DELETE /api/events/:id (admin only)
  - [ ] Subtask 1.4: Add role-based middleware for admin/moderator
- [ ] Task 2: Implement Event Service Layer (AC: 2, 4)
  - [ ] Subtask 2.1: Create event creation logic with capacity validation
  - [ ] Subtask 2.2: Create event update logic with capacity adjustment
  - [ ] Subtask 2.3: Create event cancellation with notification trigger
- [ ] Task 3: Event Management UI Components (AC: 1)
  - [ ] Subtask 3.1: Create admin event creation form
  - [ ] Subtask 3.2: Create event edit form
  - [ ] Subtask 3.3: Create event cancellation with confirmation
- [ ] Task 4: Tests and Validation (AC: All)
  - [ ] Subtask 4.1: Write unit tests for event service
  - [ ] Subtask 4.2: Write integration tests for API endpoints
  - [ ] Subtask 4.3: Test capacity modification edge cases

## Dev Notes

- **Architecture Details:** Uses Express 4, Prisma 6, following patterns from previous stories (e.g., Group admin management).
- **Authentication:** Story 1.2 established Keycloak integration. Admin routes should check for `admin` or `moderator` role.
- **Database:** Event model exists from Story 7.1 with fields: title, description, location, latitude, longitude, startTime, endTime, registrationDeadline, capacity, status.
- **Event Status:** Event has status field (draft, published, cancelled, completed). Only published events are visible to members.
- **Notification Integration:** Story 5.5 established push notification infrastructure. Use it for cancellation notifications.

### Project Structure Notes

- **Backend:** 
  - Routes: `backend/src/routes/admin.routes.ts` or create `backend/src/routes/event-admin.routes.ts`
  - Controllers: `backend/src/controllers/event.controller.ts`
  - Services: `backend/src/services/event.service.ts`
- **Frontend:**
  - Admin pages at `frontend/src/pages/admin/` or `frontend/src/pages/events/`
  - Components at `frontend/src/components/admin/` or `frontend/src/components/events/`
- **Naming Conventions:** Follow existing patterns:
  - Routes: RESTful, plural nouns (e.g., `/api/events`)
  - File names: `kebab-case`
  - DB columns: `snake_case`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-7-2]
- [Source: _bmad-output/implementation-artifacts/7-1-physical-events-database-infrastructure.md] - Event model from Story 7.1
- [Source: backend/prisma/schema.prisma] - Event, EventRegistration, EventWaitlist models
- [Source: backend/src/routes/admin.routes.ts] - Admin route patterns
- [Source: backend/src/services/group.service.ts] - Service layer patterns for reference

## Dev Agent Record

### Agent Model Used
Amelia (Developer Agent)

### Debug Log References
N/A

### Completion Notes List
- All acceptance criteria implemented
- Backend API endpoints complete with admin/moderator role protection
- Frontend admin UI for event management complete
- Unit tests written and passing
- Push notification integration for event cancellation

### File List
- backend/src/controllers/event.controller.ts
- backend/src/services/event.service.ts
- backend/src/services/event.service.test.ts
- backend/src/routes/event.routes.ts
- backend/src/index.ts (event routes import)
- backend/prisma/schema.prisma (Event model)
- backend/prisma/migrations/ (Event migrations)
- frontend/src/pages/admin/EventManagement.tsx
- frontend/src/services/event.service.ts
