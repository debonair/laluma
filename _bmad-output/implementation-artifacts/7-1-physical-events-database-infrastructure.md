# Story 7.1: Physical Events Database Infrastructure

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a backend developer,
I want to create the Prisma schemas for Events, Event Registrations, and Waitlists,
so that the system can support event discovery and attendance tracking.

## Acceptance Criteria

1. **Given** the existing database structure,
   **When** the migration is run,
   **Then** `Event`, `EventRegistration`, and `EventWaitlist` models are created.
2. **Given** the Event model,
   **When** the schema is designed,
   **Then** geolocation fields (`latitude`, `longitude`) are correctly typed as Float with appropriate indexes for location-based queries.
3. **Given** the Event model,
   **When** the schema is designed,
   **Then** timing fields (`startTime`, `endTime`, `registrationDeadline`) are correctly typed as DateTime.
4. **Given** the EventRegistration model,
   **When** the schema is designed,
   **Then** it includes `userId`, `eventId`, `status` (confirmed/waitlisted/cancelled), and `registeredAt` fields.
5. **Given** the EventWaitlist model,
   **When** the schema is designed,
   **Then** it includes `userId`, `eventId`, `position` (queue position), and `notifiedAt` fields.
6. **Given** all models,
   **When** relationships are defined,
   **Then** proper foreign key constraints and cascade delete rules are configured.

## Tasks / Subtasks

- [x] Task 1: Create Event Model (AC: 1, 2, 3)
  - [x] Subtask 1.1: Define Event model with all required fields (title, description, location, capacity, dates)
  - [x] Subtask 1.2: Add geolocation fields (latitude, longitude) with spatial index
  - [x] Subtask 1.3: Add timing fields (startTime, endTime, registrationDeadline)
  - [x] Subtask 1.4: Add status field (draft, published, cancelled, completed)
  - [x] Subtask 1.5: Add organizer relationship to User
- [x] Task 2: Create EventRegistration Model (AC: 1, 4)
  - [x] Subtask 2.1: Define EventRegistration with userId, eventId, status
  - [x] Subtask 2.2: Add unique constraint on (userId, eventId) to prevent duplicate registrations
  - [x] Subtask 2.3: Configure cascade delete when event or user is removed
- [x] Task 3: Create EventWaitlist Model (AC: 1, 5)
  - [x] Subtask 3.1: Define EventWaitlist with userId, eventId, position
  - [x] Subtask 3.2: Add unique constraint on (userId, eventId)
  - [x] Subtask 3.3: Add index on (eventId, position) for efficient queue retrieval
- [x] Task 4: Generate and Run Migration (AC: 6)
  - [x] Subtask 4.1: Run `npx prisma migrate dev` to create migration
  - [x] Subtask 4.2: Verify migration applies successfully
  - [x] Subtask 4.3: Run `npx prisma generate` to update client

## Dev Notes

- **Architecture Details:** The existing architecture uses Express 4, Prisma 6, and PostgreSQL 15. This story creates the foundational data models for Epic 7 (Physical Events).
- **Location-based Queries:** The Group model already has `latitude`, `longitude`, `city`, `country` fields with indexes. Follow the same pattern for Event model.
- **User Preference Integration:** UserPreference already has `interestedInEvents` boolean (set to true by default). Future event discovery queries should filter based on this preference.
- **Capacity Management:** The Event model should track `capacity` (max attendees) and `registeredCount` (computed or stored). Story 7.4 will handle capacity decrement on registration.
- **Waitlist Logic:** The waitlist should automatically promote users when spots open (handled in Story 7.5).

### Project Structure Notes

- **Backend:** Prisma schema is at `backend/prisma/schema.prisma`.
- **Naming Conventions:** Follow existing patterns:
  - DB columns: `snake_case` (e.g., `start_time`, `registered_at`)
  - Prisma fields: `camelCase` (e.g., `startTime`, `registeredAt`)
  - Table names: lowercase plural via `@@map`
- **Existing Patterns:** The `Group` model (lines 120-147) and `UserPreference` (lines 93-118) provide good reference for field definitions and indexes.
- **No conflicts detected:** This is adding new models to the existing baseline structure.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-7-1]
- [Source: _bmad-output/planning-artifacts/architecture.md] (if exists)
- [Source: backend/prisma/schema.prisma] - Existing models for pattern reference

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

- `backend/prisma/schema.prisma` - Added Event, EventRegistration, EventWaitlist models and EventStatus, RegistrationStatus enums
- `backend/prisma/migrations/20260304174754_add_physical_events/migration.sql` - Migration to create the physical events tables
- `backend/src/services/event.service.test.ts` - Integration tests for the new models
