# Story 7.5: Event Waitlist Queueing (FR30)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a member trying to attend a full event,
I want to join a waitlist,
so that I can automatically be offered a spot if another member cancels their registration.

## Acceptance Criteria

1. [ ] Given an event is at 100% capacity, when I view the event, the "Register" button is replaced by "Join Waitlist"
2. [ ] Then clicking it adds me to a sequential queue
3. [ ] And I am informed of my current place in line
4. [ ] When a registered member cancels their registration, the first person in the waitlist is notified and offered the spot
5. [ ] Waitlist positions update in real-time for all waiting members
6. [ ] Members can leave the waitlist at any time
7. [ ] Waitlist expires 24 hours before the event start time

## Tasks / Subtasks

- [ ] Implement waitlist functionality in Event model (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Add waitlist relation to Event model
  - [ ] Create EventWaitlist model with position and timestamp fields
  - [ ] Implement waitlist joining logic
  - [ ] Implement waitlist position management
  - [ ] Implement automatic spot offering when registration is cancelled
  - [ ] Implement waitlist cleanup 24 hours before event
  - [ ] Implement waitlist leaving functionality

- [ ] Update event registration API endpoints (AC: #1, #2, #3, #4, #5, #6, #7)
  - [ ] Modify registration endpoint to check capacity and redirect to waitlist when full
  - [ ] Create waitlist join/leave endpoints
  - [ ] Implement waitlist position retrieval endpoint
  - [ ] Add waitlist expiration logic

- [ ] Update frontend event detail view (AC: #1, #2, #3)
  - [ ] Show "Join Waitlist" button when event is at capacity
  - [ ] Display current waitlist position when joined
  - [ ] Show real-time updates to waitlist position
  - [ ] Allow leaving waitlist

- [ ] Implement notification system for waitlist offers (AC: #4)
  - [ ] Create waitlist offer notification template
  - [ ] Implement notification triggering when spot becomes available
  - [ ] Add timeout for waitlist offer acceptance
  - [ ] Move to next waitlist member if offer expires

- [ ] Add waitlist expiration cleanup job (AC: #7)
  - [ ] Create scheduled job to remove waitlist entries 24 hours before event
  - [ ] Notify waitlisted members of expiration
  - [ ] Log waitlist expiration for analytics

## Dev Notes

- Relevant architecture patterns and constraints
  - Follows the BullMQ worker pattern for async operations (waitlist expiration cleanup)
  - Uses cursor-based pagination for waitlist lists if needed
  - Implements optimistic UI for waitlist join/leave operations
  - Never exposes internal waitlist mechanics beyond position number
  - Follows `{ error, code }` error response format
  - Uses React Query for server state management in frontend
  - Follows co-located component pattern for waitlist UI components

- Source tree components to touch
  - backend/src/models/Event.ts (add waitlist relation)
  - backend/src/models/EventWaitlist.ts (new model)
  - backend/src/routes/events.ts (registration/waitlist endpoints)
  - backend/src/controllers/eventController.ts (waitlist logic)
  - backend/src/services/eventService.ts (waitlist business logic)
  - backend/src/jobs/waitlistExpirationJob.ts (cleanup job)
  - backend/src/workers/eventWorker.ts (if needed for async processing)
  - frontend/src/components/event/EventDetail.tsx (waitlist UI)
  - frontend/src/services/eventService.ts (React Query wrappers)
  - frontend/src/hooks/useEvent.ts (custom hook for waitlist operations)

- Testing standards summary
  - Unit tests for EventWaitlist model validations
  - Integration tests for waitlist join/leave APIs
  - E2E tests for waitlist flow (join -> position update -> offer -> accept/decline)
  - Test waitlist expiration timing logic
  - Test concurrent waitlist operations
  - Device coverage: iOS latest + -1, Android latest + -1, mobile web (Chrome, Safari)

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
  - Backend follows `routes/ → controllers/ → services/` pattern
  - Frontend follows co-located component pattern with `index.tsx`, `ComponentName.test.tsx`, `types.ts`
  - Uses PascalCase for TypeScript types/interfaces, camelCase for files
  - Uses SCREAMING_SNAKE_CASE for environment variables with service prefix (EVENT_*)
  - Follows API endpoint naming: kebab-case plural nouns (`/api/events/:id/waitlist`)

- Detected conflicts or variances (with rationale)
  - No conflicts detected - waitlist feature aligns with existing event management architecture
  - Waitlist expiration job follows existing pattern of scheduled maintenance jobs (like GDPR export)
  - Real-time waitlist position updates extend existing Socket.io pattern used for feed updates

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.5: Event Waitlist Queueing (FR30)]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- [Source: _bmad-output/planning-artifacts/prd.md#API Design]
- [Source: _bmad-output/planning-artifacts/prd.md#State Management]
- [Source: _bmad-output/planning-artifacts/prd.md#Testing Requirements]

## Dev Agent Record

### Agent Model Used

nvidia/nemotron-3-super-120b-a12b:free

### Debug Log References

### Completion Notes List

### File List
- backend/src/models/EventWaitlist.ts
- backend/src/routes/events.ts
- backend/src/controllers/eventController.ts
- backend/src/services/eventService.ts
- backend/src/jobs/waitlistExpirationJob.ts
- frontend/src/components/event/EventDetail.tsx
- frontend/src/services/eventService.ts
- frontend/src/hooks/useEvent.ts