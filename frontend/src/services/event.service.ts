import api from './api';

// Event types matching backend
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface Event {
    id: string;
    title: string;
    description: string;
    location?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    capacity: number;
    registeredCount: number;
    status: EventStatus;
    startTime: string;
    endTime: string;
    registrationDeadline?: string;
    createdAt: string;
    updatedAt: string;
    organizerId?: string;
    _count?: {
        registrations: number;
        waitlists: number;
    };
}

export interface CreateEventInput {
    title: string;
    description: string;
    location?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    capacity: number;
    startTime: string;
    endTime: string;
    registrationDeadline?: string;
    status?: EventStatus;
}

export interface UpdateEventInput {
    title?: string;
    description?: string;
    location?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    capacity?: number;
    startTime?: string;
    endTime?: string;
    registrationDeadline?: string;
    status?: EventStatus;
}

export interface EventListResponse {
    events: Event[];
    total: number;
}

// Get all events (admin view)
export async function getAllEvents(options?: {
    status?: string;
    skip?: number;
    take?: number;
}): Promise<EventListResponse> {
    try {
        const params = new URLSearchParams();
        if (options?.status) params.append('status', options.status);
        if (options?.skip) params.append('skip', String(options.skip));
        if (options?.take) params.append('take', String(options.take));

        const response = await api.get(`/events?${params.toString()}`);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch events');
    }
}

// Get single event by ID
export async function getEventById(eventId: string): Promise<Event> {
    try {
        const response = await api.get(`/events/${eventId}`);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch event');
    }
}

// Create new event
export async function createEvent(input: CreateEventInput): Promise<Event> {
    try {
        const response = await api.post('/events', input);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to create event');
    }
}

// Update existing event
export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<Event> {
    try {
        const response = await api.put(`/events/${eventId}`, input);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to update event');
    }
}

// Delete event
export async function deleteEvent(eventId: string): Promise<void> {
    try {
        await api.delete(`/events/${eventId}`);
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to delete event');
    }
}

// Publish draft event
export async function publishEvent(eventId: string): Promise<Event> {
    try {
        const response = await api.post(`/events/${eventId}/publish`);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to publish event');
    }
}

// Cancel event (notifies registered members)
export async function cancelEvent(eventId: string): Promise<Event> {
    try {
        const response = await api.post(`/events/${eventId}/cancel`);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to cancel event');
    }
}

// ============================================================================
// Event Discovery - Member-facing (Story 7.3)
// ============================================================================

export interface DiscoverEventsParams {
    latitude?: number;
    longitude?: number;
    radius?: number;
    dateFilter?: 'upcoming' | 'this_week' | 'this_month';
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
}

export interface DiscoveredEvent {
    id: string;
    title: string;
    description: string;
    location?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
    capacity: number;
    registeredCount: number;
    status: EventStatus;
    startTime: string;
    endTime: string;
    registrationDeadline?: string;
    isRegistered: boolean;
    registrationStatus: string | null;
}

export interface EventDetails extends DiscoveredEvent {
    spotsLeft: number;
    registrationDate: string | null;
    waitlistPosition?: number | null;
}

/**
 * Discover events for members - paginated, date-ordered, filtered
 * GET /api/events/discover
 */
export async function discoverEvents(params: DiscoverEventsParams = {}): Promise<{ events: DiscoveredEvent[]; total: number }> {
    try {
        const searchParams = new URLSearchParams();

        if (params.latitude !== undefined) searchParams.set('latitude', params.latitude.toString());
        if (params.longitude !== undefined) searchParams.set('longitude', params.longitude.toString());
        if (params.radius !== undefined) searchParams.set('radius', params.radius.toString());
        if (params.dateFilter) searchParams.set('dateFilter', params.dateFilter);
        if (params.startDate) searchParams.set('startDate', params.startDate);
        if (params.endDate) searchParams.set('endDate', params.endDate);
        if (params.skip !== undefined) searchParams.set('skip', params.skip.toString());
        if (params.take !== undefined) searchParams.set('take', params.take.toString());

        const response = await api.get(`/events/discover?${searchParams.toString()}`);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to discover events');
    }
}

/**
 * Get event details for members
 * GET /api/events/:id/details
 */
export async function getEventDetails(eventId: string): Promise<EventDetails> {
    try {
        const response = await api.get(`/events/${eventId}/details`);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch event details');
    }
}

// ============================================================================
// Event Registration - Member-facing (Story 7.4)
// ============================================================================

export interface RegistrationResult {
    registration: {
        id: string;
        status: string;
    };
    alreadyRegistered?: boolean;
    upgraded?: boolean;
    isWaitlisted?: boolean;
    waitlistPosition?: number;
    message: string;
}

/**
 * Register for an event
 * POST /api/events/:id/register
 */
export async function registerForEvent(eventId: string): Promise<RegistrationResult> {
    try {
        const response = await api.post(`/events/${eventId}/register`);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to register for event');
    }
}

/**
 * Cancel event registration
 * POST /api/events/:id/cancel-registration
 */
export async function cancelEventRegistration(eventId: string): Promise<{ message: string }> {
    try {
        const response = await api.post(`/events/${eventId}/cancel-registration`);
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to cancel registration');
    }
}
/**
 * Get events current user is involved in (Story 7.6)
 * GET /api/events/my
 */
export async function getMyEvents(): Promise<EventDetails[]> {
    try {
        const response = await api.get('/events/my');
        return response.data;
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to fetch your events');
    }
}
