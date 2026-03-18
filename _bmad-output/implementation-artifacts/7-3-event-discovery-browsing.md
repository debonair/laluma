# Story 7.3: Event Discovery & Browsing

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a member,
I want to browse a chronological list or map of upcoming Luma Spaces events,
So that I can find meetups happening in my local area.

## Acceptance Criteria

1. **Given** I am an authenticated member,
   **When** I access the "Luma Spaces" tab,
   **Then** I see a paginated, date-ordered list of upcoming events.
2. **Given** I am an authenticated member,
   **When** I access the "Luma Spaces" tab,
   **Then** events that I am already registered for are visually flagged.
3. **Given** I am an authenticated member,
   **When** I view the event list,
   **Then** I can filter events by date range (upcoming, this week, this month).
4. **Given** I am an authenticated member,
   **When** I view the event list,
   **Then** I can filter events by proximity/location.
5. **Given** I am an authenticated member,
   **When** I select an event from the list,
   **Then** I see the event details page with full information (title, description, location, time, capacity, registered count).

## Tasks / Subtasks

- [x] Task 1: Implement Event Discovery API Endpoints (AC: 1, 3, 4, 5)
  - [x] Subtask 1.1: Create GET /api/events/discover (authenticated members)
  - [x] Subtask 1.2: Add pagination support (limit, offset)
  - [x] Subtask 1.3: Add date range filtering (dateFilter, startDate, endDate)
  - [x] Subtask 1.4: Add location/proximity filtering (latitude, longitude, radius)
  - [x] Subtask 1.5: Create GET /api/events/:id/details for event details
- [x] Task 2: Implement Event List Service Logic (AC: 1, 2, 3, 4)
  - [x] Subtask 2.1: Query events ordered by startTime ascending
  - [x] Subtask 2.2: Filter to only show published events
  - [x] Subtask 2.3: Include user's registration status in response
  - [x] Subtask 2.4: Calculate and include registered count per event
- [x] Task 3: Build Luma Spaces Frontend Page (AC: 1, 2, 3, 4)
  - [x] Subtask 3.1: Create "Luma Spaces" tab/page in navigation (BottomNav)
  - [x] Subtask 3.2: Implement event list component with pagination
  - [x] Subtask 3.3: Add date range filter controls (upcoming, this week, this month)
  - [x] Subtask 3.4: Add location filter controls (radius slider)
  - [x] Subtask 3.5: Visual indicator for registered events (green border + badge)
- [x] Task 4: Build Event Details View (AC: 5)
  - [x] Subtask 4.1: Create event detail page/component
  - [x] Subtask 4.2: Display all event information
  - [x] Subtask 4.3: Show registration status and button
- [ ] Task 5: Tests and Validation (AC: All)
  - [ ] Subtask 5.1: Write unit tests for event discovery service
  - [ ] Subtask 5.2: Write integration tests for event API endpoints
  - [ ] Subtask 5.3: Test pagination, filtering edge cases

## Dev Notes

- **Architecture Details:** Uses Express 4, Prisma 6, following patterns from previous stories (e.g., Group discovery/search - Story 2.3).
- **Authentication:** Story 1.2 established Keycloak integration. Members must be authenticated to view events.
- **Database:** 
  - Event model exists from Story 7.1 with fields: title, description, location, latitude, longitude, startTime, endTime, registrationDeadline, capacity, status.
  - EventRegistration model tracks user registrations with status (confirmed/waitlisted/cancelled).
- **Event Status:** Only events with status = 'published' should be visible to members.
- **Pagination:** Implement cursor-based or offset-based pagination. Follow pattern from Story 2.3 (group discovery).
- **Location Filtering:** Use existing geolocation field pattern from Group model. Calculate distance using PostGIS or Haversine formula.
- **User Preference:** UserPreference already has `interestedInEvents` boolean. Consider filtering based on this preference in future iterations.

### Project Structure Notes

- **Backend:** 
  - Routes: `backend/src/routes/event.routes.ts` (extend existing from Story 7.2)
  - Controllers: `backend/src/controllers/event.controller.ts`
  - Services: `backend/src/services/event.service.ts`
- **Frontend:**
  - New page at `frontend/src/pages/spaces/LumaSpaces.tsx` or `frontend/src/pages/events/EventDiscovery.tsx`
  - Components at `frontend/src/components/events/`
- **Naming Conventions:** Follow existing patterns:
  - Routes: RESTful, plural nouns (e.g., `/api/events`)
  - File names: `kebab-case`
  - DB columns: `snake_case`
- **Dependencies:** 
  - Frontend uses React Query for data fetching
  - Backend uses Prisma ORM

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-7-3]
- [Source: _bmad-output/implementation-artifacts/7-1-physical-events-database-infrastructure.md] - Event, EventRegistration models from Story 7.1
- [Source: _bmad-output/implementation-artifacts/7-2-admin-event-creation-management.md] - Event CRUD from Story 7.2
- [Source: _bmad-output/planning-artifacts/architecture.md] - Events (Luma Spaces) routing info
- [Source: backend/src/routes/event.routes.ts] - Existing event routes pattern
- [Source: backend/src/services/group.service.ts] - Group discovery patterns for pagination/filtering reference

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
