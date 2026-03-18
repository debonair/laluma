# Story 7.6: "My Events" Dashboard (FR31)

Status: in-progress

## Story

As a member,
I want to view a dedicated list of events I am registered for or waitlisted on,
so that I can easily manage my schedule and access physical event details.

## Acceptance Criteria

1. [ ] A member can access a "My Events" view from the Luma Spaces section.
2. [ ] The "My Events" view displays two sections: "Registered" and "Waitlisted".
3. [ ] The "Registered" section shows upcoming events the member has successfully registered for.
4. [ ] The "Waitlisted" section shows events the member is currently on the waitlist for, including their current numeric position.
5. [ ] A member can cancel their registration for any upcoming event from this view.
6. [ ] A member can leave the waitlist for any event from this view.
7. [ ] When a registration is cancelled, the waitlist promotion logic (implemented in Story 7.5) is triggered.
8. [ ] The dashboard updates in real-time when registration status or waitlist positions change (leveraging the existing Socket.io pattern).

## Tasks / Subtasks

- [ ] Backend: Implement registration and waitlist retrieval (AC: #2, #3, #4)
  - [ ] Add `getMyRegistrations` endpoint to `routes/lumaSpaces.ts`
  - [ ] Implement logic in `lumaSpacesService.ts` to fetch events where the user is `REGISTERED` or `WAITLISTED`
  - [ ] Ensure waitlist position is calculated/returned for each waitlisted event
- [ ] Backend: Implement cancellation and leave-waitlist endpoints (AC: #5, #6, #7)
  - [ ] Create `DELETE /api/luma-spaces/registrations/:eventId` for cancelling RSVP
  - [ ] Create `DELETE /api/luma-spaces/waitlist/:eventId` for leaving waitlist
  - [ ] Ensure cancellation triggers `offerWaitlistSpot` logic from Story 7.5
- [ ] Frontend: Create "My Events" dashboard page (AC: #1, #2, #3, #4)
  - [ ] Create `MyEvents.tsx` in `pages/spaces/`
  - [ ] Implement a tabbed interface or dual-list view for Registered vs. Waitlisted
  - [ ] Create `EventRegistrationCard` component to show event details and actions
- [ ] Frontend: Implement management actions (AC: #5, #6)
  - [ ] Add "Cancel RSVP" functionality with a trauma-informed confirmation dialog
  - [ ] Add "Leave Waitlist" functionality with confirmation
- [ ] Frontend: Real-time updates (AC: #8)
  - [ ] Integrate Socket.io listeners to refresh `myRegistrations` query when position changes or spots are offered
- [ ] Verification & Tests
  - [ ] Unit tests for registration retrieval and cancellation services
  - [ ] Integration tests for the new `lumaSpaces` endpoints
  - [ ] E2E test: Register -> View in Dashboard -> Cancel -> Verify waitlist promotion (if applicable)

## Dev Notes

- **Architecture Alignment**: Follows the `routes/ → controllers/ → services/` pattern as per `architecture.md`.
- **State Management**: Uses React Query for fetching and invalidating the user's registrations list.
- **Safety & Trust**: Cancellation dialogs should use warm, supportive language ("We understand things come up – thank you for letting us know so another mother can join").
- **Real-time**: Leverages existing `SocketConnection` to handle background updates for waitlist positions.
- **API Endpoints**: 
  - `GET /api/luma-spaces/my/events`
  - `DELETE /api/luma-spaces/my/events/:id` (handles both reg and waitlist depending on context)

### References
- [PRD FR31](file:///Users/duma/Projects/luma/_bmad-output/planning-artifacts/prd.md)
- [Architecture Component Map](file:///Users/duma/Projects/luma/_bmad-output/planning-artifacts/architecture.md)
- [Story 7.5: Event Waitlist Queueing](file:///Users/duma/Projects/luma/_bmad-output/implementation-artifacts/7-5-event-waitlist-queueing.md)
