# Story 7.4: Event Registration

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a member,
I want to register/RSVP for an upcoming Luma Spaces event,
So that I can secure my spot and receive attendance details.

## Acceptance Criteria

1. **Given** an event has available capacity,
   **When** I select "Register",
   **Then** an `EventRegistration` is created for me,
   **And** the remaining capacity of the event decreases by 1,
   **And** the UI shows a success state with the event's precise location (which was previously blurred).

2. **Given** I am already registered for an event,
   **When** I view the event details,
   **Then** I see my registration status (confirmed),
   **And** I have the option to cancel my registration.

3. **Given** my registration is confirmed,
   **When** I register,
   **Then** I receive a push notification confirming my registration,
   **And** the event details become visible (unblurred location).

4. **Given** the event has reached full capacity,
   **When** I attempt to register,
   **Then** I am informed the event is full,
   **And** I am offered to join the waitlist instead.

## Tasks / Subtasks

- [ ] Task 1: Implement Event Registration API (AC: 1, 4)
  - [ ] Subtask 1.1: Add `registerForEvent` function to event.service.ts
  - [ ] Subtask 1.2: Add `cancelRegistration` function to event.service.ts
  - [ ] Subtask 1.3: Add registration capacity validation
  - [ ] Subtask 1.4: Add waitlist integration (if event is full)
- [ ] Task 2: Implement Event Registration Controller Endpoints (AC: 1)
  - [ ] Subtask 2.1: Add POST /api/events/:id/register endpoint
  - [ ] Subtask 2.2: Add POST /api/events/:id/cancel-registration endpoint
  - [ ] Subtask 2.3: Add GET /api/events/:id/registration-status endpoint
- [ ] Task 3: Implement Registration Notifications (AC: 3)
  - [ ] Subtask 3.1: Send push notification on successful registration
  - [ ] Subtask 3.2: Include event details and location in notification
- [ ] Task 4: Frontend Registration UI (AC: 1, 2)
  - [ ] Subtask 4.1: Add "Register" button to event details page
  - [ ] Subtask 4.2: Show registration status (registered/not registered)
  - [ ] Subtask 4.3: Show "Cancel Registration" option for registered users
  - [ ] Subtask 4.4: Display success state with unblurred location after registration
  - [ ] Subtask 4.5: Handle "event full" scenario with waitlist option
- [ ] Task 5: Tests and Validation (AC: All)
  - [ ] Subtask 5.1: Write unit tests for registration service functions
  - [ ] Subtask 5.2: Write integration tests for registration endpoints
  - [ ] Subtask 5.3: Test capacity edge cases (full, exactly at capacity)

## Dev Notes

### Architecture Details

- **Stack:** Express 4, Prisma 6, React 19, Keycloak JWT auth
- **Event Model:** Already exists from Story 7.1 with fields: id, title, description, location, address, latitude, longitude, city, country, capacity, registeredCount, startTime, endTime, registrationDeadline, status
- **EventRegistration Model:** Already exists from Story 7.1 with fields: userId, eventId, status (confirmed/waitlisted/cancelled), createdAt
- **Registration Status Constants:** Use `RegistrationStatus.confirmed`, `RegistrationStatus.waitlisted`, `RegistrationStatus.cancelled` from event.service.ts
- **Notification:** Story 5.5 established push notification infrastructure - use `sendPushToUser` from pushNotification.service.ts

### Previous Story Intelligence (Story 7.3)

- Event discovery (Story 7.3) already provides `getEventDetails(eventId, userId)` which includes:
  - `isRegistered`: boolean
  - `registrationStatus`: confirmed | waitlisted | cancelled | null
  - `spotsLeft`: Math.max(0, event.capacity - event._count.registrations)
- The event details response already shows if user is registered - reuse this for the registration button state
- Location is currently blurred until user registers - need to implement this on frontend

### Project Structure Notes

- **Backend:**
  - Service: `backend/src/services/event.service.ts` - Add registration functions here
  - Controller: `backend/src/controllers/event.controller.ts` - Add registration endpoints
  - Routes: `backend/src/routes/event.routes.ts` - Add registration routes
- **Frontend:**
  - Service: `frontend/src/services/event.service.ts` - Add registration API calls
  - Pages: `frontend/src/pages/events/EventDetails.tsx` or similar - Add registration UI
  - Components: `frontend/src/components/events/RegistrationButton.tsx`

### Naming Conventions

- Routes: RESTful - `/api/events/:id/register`, `/api/events/:id/cancel-registration`
- File names: `kebab-case`
- Database columns: `snake_case`
- Prisma fields: `camelCase`

### Technical Requirements

1. **Capacity Validation:** Before registration, check `event.registeredCount < event.capacity`
2. **Atomic Updates:** Use Prisma transactions to:
   - Create registration record
   - Increment event's `registeredCount`
3. **Duplicate Prevention:** Handle case where user already registered (return existing registration)
4. **Registration Deadline:** Check if `event.registrationDeadline` has passed before allowing registration
5. **Event Status:** Only allow registration for `published` events

### Testing Standards

- Use Vitest (NOT Jest) - see project-context.md
- Follow pattern from `backend/src/services/event.service.test.ts`
- Mock Prisma client using `vi.mock()` 
- Test coverage should include:
  - Successful registration
  - Registration when event is full
  - Registration after deadline
  - Duplicate registration attempt
  - Registration cancellation

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

