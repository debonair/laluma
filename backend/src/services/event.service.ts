/**
 * Event Service - Admin Event Creation & Management (Story 7.2)
 *
 * Provides admin/moderator capabilities for:
 * - Creating events with capacity limits
 * - Editing events
 * - Cancelling events with notification to registered members
 * - Publishing draft events
 */

import prisma from '../utils/prisma';
import { sendPushToUser, PushPayload } from './pushNotification.service';
import { getIO } from '../socket';

// Event status values (matching Prisma schema)
const EventStatus = {
    draft: 'draft',
    published: 'published',
    cancelled: 'cancelled',
    completed: 'completed',
} as const;

// Registration status values (matching Prisma schema)
const RegistrationStatus = {
    confirmed: 'confirmed',
    waitlisted: 'waitlisted',
    cancelled: 'cancelled',
} as const;

export type EventStatusType = typeof EventStatus[keyof typeof EventStatus];
export type RegistrationStatusType = typeof RegistrationStatus[keyof typeof RegistrationStatus];

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
    startTime: Date;
    endTime: Date;
    registrationDeadline?: Date;
    status?: EventStatusType;
    organizerId?: string;
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
    startTime?: Date;
    endTime?: Date;
    registrationDeadline?: Date;
    status?: EventStatusType;
}

/**
 * Create a new event (Admin/Moderator only)
 * AC 1: Create event with title, description, location, time, capacity
 */
export async function createEvent(input: CreateEventInput) {
    const event = await prisma.event.create({
        data: {
            title: input.title,
            description: input.description,
            location: input.location,
            address: input.address,
            latitude: input.latitude,
            longitude: input.longitude,
            city: input.city,
            country: input.country,
            capacity: input.capacity,
            registeredCount: 0,
            startTime: input.startTime,
            endTime: input.endTime,
            registrationDeadline: input.registrationDeadline,
            status: input.status || EventStatus.draft,
            organizerId: input.organizerId,
        },
    });

    return event;
}

/**
 * Update an existing event (Admin/Moderator only)
 * AC 2: Capacity modification dynamically updates required registration space
 * AC 3: Changes reflected immediately for all users
 */
export async function updateEvent(eventId: string, input: UpdateEventInput) {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!existingEvent) {
        throw new Error('Event not found');
    }

    // Validate capacity if being changed
    if (input.capacity !== undefined && input.capacity !== null) {
        // Ensure capacity is not less than current registered count
        if (input.capacity < existingEvent.registeredCount) {
            throw new Error(
                `Capacity cannot be less than current registered count (${existingEvent.registeredCount})`
            );
        }
    }

    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: {
            ...(input.title && { title: input.title }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.location !== undefined && { location: input.location }),
            ...(input.address !== undefined && { address: input.address }),
            ...(input.latitude !== undefined && { latitude: input.latitude }),
            ...(input.longitude !== undefined && { longitude: input.longitude }),
            ...(input.city !== undefined && { city: input.city }),
            ...(input.country !== undefined && { country: input.country }),
            ...(input.capacity !== undefined && { capacity: input.capacity }),
            ...(input.startTime && { startTime: input.startTime }),
            ...(input.endTime && { endTime: input.endTime }),
            ...(input.registrationDeadline !== undefined && { registrationDeadline: input.registrationDeadline }),
            ...(input.status && { status: input.status }),
        },
    });

    return updatedEvent;
}

/**
 * Cancel an event and notify all registered members
 * AC 4: All registered members are automatically notified
 */
export async function cancelEvent(eventId: string) {
    // Check if event exists
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            registrations: {
                where: { status: RegistrationStatus.confirmed },
                include: { user: true },
            },
        },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    // Update event status to cancelled
    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { status: EventStatus.cancelled },
    });

    // Cancel all registrations
    await prisma.eventRegistration.updateMany({
        where: { eventId, status: RegistrationStatus.confirmed },
        data: { status: RegistrationStatus.cancelled },
    });

    // Notify all registered users
    interface RegisteredUser {
        user: { id: string };
    }
    const notificationPromises = event.registrations.map(async (registration: RegisteredUser) => {
        try {
            const payload: PushPayload = {
                title: 'Event Cancelled',
                body: `The event "${event.title}" has been cancelled.`,
                data: {
                    type: 'event',
                    eventId: event.id,
                    deepLink: `luma://event/${event.id}`,
                },
            };
            await sendPushToUser(registration.user.id, payload);
            
            // Real-time socket update
            getIO().to(`user_${registration.user.id}`).emit('registration_update', {
                type: 'event_cancelled',
                eventId: event.id
            });
        } catch (error) {
            console.error(`Failed to send notification to user ${registration.user.id}:`, error);
        }
    });

    await Promise.allSettled(notificationPromises);

    return updatedEvent;
}

/**
 * Publish a draft event
 * AC 1: Event visible to members when published
 */
export async function publishEvent(eventId: string) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    if (event.status !== EventStatus.draft) {
        throw new Error('Only draft events can be published');
    }

    const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: { status: EventStatus.published },
    });

    return updatedEvent;
}

/**
 * Get all events (admin view - includes draft)
 */
export async function getAllEvents(options?: {
    skip?: number;
    take?: number;
    status?: EventStatusType;
}) {
    const where = options?.status ? { status: options.status } : {};

    const [events, total] = await Promise.all([
        prisma.event.findMany({
            where,
            skip: options?.skip,
            take: options?.take,
            orderBy: { startTime: 'asc' },
            include: {
                _count: {
                    select: {
                        registrations: true,
                        waitlists: true,
                    },
                },
            },
        }),
        prisma.event.count({ where }),
    ]);

    return { events, total };
}

/**
 * Get single event by ID
 */
export async function getEventById(eventId: string) {
    return prisma.event.findUnique({
        where: { id: eventId },
        include: {
            registrations: {
                where: { status: RegistrationStatus.confirmed },
                include: { user: true },
            },
            waitlists: {
                include: { user: true },
                orderBy: { position: 'asc' },
            },
        },
    });
}

/**
 * Delete an event (Admin only)
 * Removes event and cascades to registrations and waitlists
 */
export async function deleteEvent(eventId: string) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    // Delete event (cascades to registrations and waitlists)
    await prisma.event.delete({
        where: { id: eventId },
    });

    return { success: true };
}

// ============================================================================
// Event Discovery - Member-facing (Story 7.3)
// ============================================================================

export interface DiscoverEventsInput {
    userId: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // in km
    startDate?: Date;
    endDate?: Date;
    dateFilter?: 'upcoming' | 'this_week' | 'this_month';
    skip?: number;
    take?: number;
}

/**
 * Discover events for members - paginated, date-ordered, filtered by location
 * AC 1: Paginated, date-ordered list of upcoming events
 * AC 2: Include user's registration status
 * AC 3: Filter by date range
 * AC 4: Filter by proximity/location
 */
export async function discoverEvents(input: DiscoverEventsInput) {
    const { userId, latitude, longitude, radius = 50, startDate, endDate, dateFilter, skip = 0, take = 20 } = input;

    // Build date filter
    let filterStartDate: Date | undefined;
    let filterEndDate: Date | undefined;
    const now = new Date();

    if (dateFilter) {
        switch (dateFilter) {
            case 'upcoming':
                filterStartDate = now;
                break;
            case 'this_week': {
                const weekEnd = new Date(now);
                weekEnd.setDate(weekEnd.getDate() + 7);
                filterStartDate = now;
                filterEndDate = weekEnd;
                break;
            }
            case 'this_month': {
                const monthEnd = new Date(now);
                monthEnd.setMonth(monthEnd.getMonth() + 1);
                filterStartDate = now;
                filterEndDate = monthEnd;
                break;
            }
        }
    } else if (startDate || endDate) {
        filterStartDate = startDate;
        filterEndDate = endDate;
    } else {
        // Default: show upcoming events only
        filterStartDate = now;
    }

    // Get all published events for filtering
    // Build date filter for Prisma query
    const dateRange: { gte?: Date; lte?: Date } = {};
    if (filterStartDate) {
        dateRange.gte = filterStartDate;
    }
    if (filterEndDate) {
        dateRange.lte = filterEndDate;
    }

    // Combine status and date filters
    const where = Object.keys(dateRange).length > 0
        ? { status: EventStatus.published, startTime: dateRange }
        : { status: EventStatus.published };

    const events = await prisma.event.findMany({
        where,
        orderBy: { startTime: 'asc' },
        skip,
        take,
        include: {
            registrations: {
                where: { userId },
                select: { id: true, status: true },
            },
            _count: {
                select: {
                    registrations: {
                        where: { status: RegistrationStatus.confirmed },
                    },
                },
            },
        },
    });

    // Get total count
    const total = await prisma.event.count({ where });

    // Filter by distance if location provided
    let filteredEvents = events;
    if (latitude !== undefined && longitude !== undefined) {
        filteredEvents = events.filter(event => {
            if (event.latitude === null || event.longitude === null) return true; // Include if no coords set

            const R = 6371; // Earth's radius in km
            const dLat = (event.latitude - latitude) * Math.PI / 180;
            const dLon = (event.longitude - longitude) * Math.PI / 180;
            const lat1 = latitude * Math.PI / 180;
            const lat2 = event.latitude * Math.PI / 180;

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return distance <= radius;
        });
    }

    // Map to response format with registration status
    const mappedEvents = filteredEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        address: event.address,
        latitude: event.latitude,
        longitude: event.longitude,
        city: event.city,
        country: event.country,
        capacity: event.capacity,
        registeredCount: event._count.registrations,
        status: event.status,
        startTime: event.startTime,
        endTime: event.endTime,
        registrationDeadline: event.registrationDeadline,
        // User's registration status
        isRegistered: event.registrations.length > 0,
        registrationStatus: event.registrations[0]?.status || null,
    }));

    return { events: mappedEvents, total };
}

/**
 * Get event details for members
 * AC 5: Full event information
 */
export async function getEventDetails(eventId: string, userId: string) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            registrations: {
                where: { userId },
                select: { id: true, status: true, createdAt: true },
            },
            _count: {
                select: {
                    registrations: {
                        where: { status: RegistrationStatus.confirmed },
                    },
                },
            },
        },
    });

    if (!event || event.status !== EventStatus.published) {
        return null; // Event not found or not published
    }

    return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        address: event.address,
        latitude: event.latitude,
        longitude: event.longitude,
        city: event.city,
        country: event.country,
        capacity: event.capacity,
        registeredCount: event._count.registrations,
        spotsLeft: Math.max(0, event.capacity - event._count.registrations),
        status: event.status,
        startTime: event.startTime,
        endTime: event.endTime,
        registrationDeadline: event.registrationDeadline,
        isRegistered: event.registrations.length > 0,
        registrationStatus: event.registrations[0]?.status || null,
        registrationDate: event.registrations[0]?.createdAt || null,
    };
}

// ============================================================================
// Event Registration - Member-facing (Story 7.4)
// ============================================================================

/**
 * Register for an event
 * AC 1: Create EventRegistration, decrement capacity
 * AC 3: Send push notification on registration
 * AC 4: Handle full event - offer waitlist
 */
export async function registerForEvent(eventId: string, userId: string) {
    // Get event with current registration count
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            _count: {
                select: {
                    registrations: {
                        where: { status: RegistrationStatus.confirmed },
                    },
                },
            },
        },
    });

    if (!event) {
        throw new Error('Event not found');
    }

    if (event.status !== EventStatus.published) {
        throw new Error('Event is not available for registration');
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        throw new Error('Registration deadline has passed');
    }

    // Check if user already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });

    if (existingRegistration) {
        if (existingRegistration.status === RegistrationStatus.confirmed) {
            return { registration: existingRegistration, alreadyRegistered: true, message: 'Already registered for this event' };
        }
        if (existingRegistration.status === RegistrationStatus.waitlisted) {
            // User is on waitlist - upgrade to confirmed if space available
            if (event._count.registrations < event.capacity) {
                const updated = await prisma.eventRegistration.update({
                    where: { id: existingRegistration.id },
                    data: { status: RegistrationStatus.confirmed },
                });
                // Increment registered count
                await prisma.event.update({
                    where: { id: eventId },
                    data: { registeredCount: { increment: 1 } },
                });
                return { registration: updated, upgraded: true, message: 'Upgraded from waitlist to confirmed' };
            }
        }
        if (existingRegistration.status === RegistrationStatus.cancelled) {
            // Re-register
            const updated = await prisma.eventRegistration.update({
                where: { id: existingRegistration.id },
                data: { status: RegistrationStatus.confirmed, createdAt: new Date() },
            });
            await prisma.event.update({
                where: { id: eventId },
                data: { registeredCount: { increment: 1 } },
            });
            return { registration: updated, message: 'Registration restored' };
        }
    }

    // Check if event is full
    const isFull = event._count.registrations >= event.capacity;

    if (isFull) {
        // Add to waitlist instead
        const waitlistCount = await prisma.eventWaitlist.count({
            where: { eventId },
        });

        const waitlistEntry = await prisma.eventWaitlist.create({
            data: {
                userId,
                eventId,
                position: waitlistCount + 1,
            },
        });

        // Create waitlisted registration record for tracking
        const registration = await prisma.eventRegistration.create({
            data: {
                userId,
                eventId,
                status: RegistrationStatus.waitlisted,
            },
        });

        return {
            registration,
            waitlistEntry,
            waitlistPosition: waitlistCount + 1,
            isWaitlisted: true,
            message: 'Event is full. You have been added to the waitlist.',
        };
    }

    // Create registration with transaction
    const registration = await prisma.$transaction(async (tx) => {
        // Double-check capacity within transaction
        const currentEvent = await tx.event.findUnique({
            where: { id: eventId },
            select: { registeredCount: true, capacity: true },
        });

        if (!currentEvent || currentEvent.registeredCount >= currentEvent.capacity) {
            throw new Error('Event is now full');
        }

        // Create registration
        const newRegistration = await tx.eventRegistration.create({
            data: {
                userId,
                eventId,
                status: RegistrationStatus.confirmed,
            },
        });

        // Increment registered count
        await tx.event.update({
            where: { id: eventId },
            data: { registeredCount: { increment: 1 } },
        });

        return newRegistration;
    });

    // Real-time socket update
    getIO().to(`user_${userId}`).emit('registration_update', {
        type: registration.status === RegistrationStatus.waitlisted ? 'waitlisted' : 'registered',
        eventId
    });

    return { registration, message: isFull ? 'Event is full. You have been added to the waitlist.' : 'Successfully registered for event' };
}

/**
 * Cancel event registration
 * AC 2: Cancel registration option for registered users
 */
export async function cancelRegistration(eventId: string, userId: string) {
    const registration = await prisma.eventRegistration.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });

    if (!registration) {
        throw new Error('Registration not found');
    }

    if (registration.status === RegistrationStatus.cancelled) {
        return { registration, message: 'Registration already cancelled' };
    }

    // Update registration status
    const updated = await prisma.eventRegistration.update({
        where: { id: registration.id },
        data: { status: RegistrationStatus.cancelled },
    });

    // Only decrement registered count and promote if the registration was confirmed
    let promotedWaitlistUser = null;
    
    if (registration.status === RegistrationStatus.confirmed) {
        // Decrement registered count
        await prisma.event.update({
            where: { id: eventId },
            data: { registeredCount: { decrement: 1 } },
        });

        // Check if there's someone on the waitlist to promote
        const nextWaitlistEntry = await prisma.eventWaitlist.findFirst({
            where: { eventId },
            orderBy: { position: 'asc' },
        });

        if (nextWaitlistEntry) {
            // Promote waitlist user to confirmed
            await prisma.eventRegistration.updateMany({
                where: {
                    userId: nextWaitlistEntry.userId,
                    eventId,
                    status: RegistrationStatus.waitlisted,
                },
                data: { status: RegistrationStatus.confirmed },
            });

            // Increment registered count for the new confirmed user
            await prisma.event.update({
                where: { id: eventId },
                data: { registeredCount: { increment: 1 } },
            });

            // Remove from waitlist
            await prisma.eventWaitlist.delete({
                where: { id: nextWaitlistEntry.id },
            });

            // Reorder remaining waitlist positions
            const remainingWaitlist = await prisma.eventWaitlist.findMany({
                where: { eventId },
                orderBy: { position: 'asc' },
            });

            for (let i = 0; i < remainingWaitlist.length; i++) {
                if (remainingWaitlist[i].position !== i + 1) {
                    await prisma.eventWaitlist.update({
                        where: { id: remainingWaitlist[i].id },
                        data: { position: i + 1 },
                    });
                }
            }

            promotedWaitlistUser = nextWaitlistEntry.userId;
            
            // Notification logic for promoted user
            try {
                const payload: PushPayload = {
                    title: 'Spot Available!',
                    body: `A spot opened up for your waitlisted event. You are now registered!`,
                    data: {
                        type: 'event',
                        eventId,
                        deepLink: `luma://event/${eventId}`,
                    },
                };
                await sendPushToUser(promotedWaitlistUser, payload);
                
                // Real-time socket update
                getIO().to(`user_${promotedWaitlistUser}`).emit('registration_update', {
                    type: 'promoted',
                    eventId
                });
            } catch (error) {
                console.error('Failed to notify promoted user:', error);
            }
        }
    } else if (registration.status === RegistrationStatus.waitlisted) {
        // Just remove from waitlist and reorder
        await prisma.eventWaitlist.delete({
            where: {
                userId_eventId: { userId, eventId }
            }
        });

        const remainingWaitlist = await prisma.eventWaitlist.findMany({
            where: { eventId },
            orderBy: { position: 'asc' },
        });

        for (let i = 0; i < remainingWaitlist.length; i++) {
            if (remainingWaitlist[i].position !== i + 1) {
                await prisma.eventWaitlist.update({
                    where: { id: remainingWaitlist[i].id },
                    data: { position: i + 1 },
                });
            }
        }
    }

    return {
        registration: updated,
        promotedWaitlistUser,
        message: 'Registration cancelled successfully',
    };
}

/**
 * Get all events the user is registered for or waitlisted on (Story 7.6)
 */
export async function getMyEvents(userId: string) {
    const registrations = await prisma.eventRegistration.findMany({
        where: {
            userId,
            status: {
                in: [RegistrationStatus.confirmed, RegistrationStatus.waitlisted]
            }
        },
        include: {
            event: {
                include: {
                    _count: {
                        select: {
                            registrations: {
                                where: { status: RegistrationStatus.confirmed }
                            }
                        }
                    }
                }
            }
        },
        orderBy: {
            event: {
                startTime: 'asc'
            }
        }
    });

    const mapped = await Promise.all(registrations.map(async (reg) => {
        let waitlistPosition = null;
        if (reg.status === RegistrationStatus.waitlisted) {
            const waitlistEntry = await prisma.eventWaitlist.findUnique({
                where: {
                    userId_eventId: {
                        userId,
                        eventId: reg.eventId
                    }
                }
            });
            waitlistPosition = waitlistEntry?.position || null;
        }

        return {
            id: reg.event.id,
            title: reg.event.title,
            description: reg.event.description,
            location: reg.event.location,
            address: reg.event.address,
            city: reg.event.city,
            startTime: reg.event.startTime,
            endTime: reg.event.endTime,
            status: reg.event.status,
            registrationStatus: reg.status,
            waitlistPosition,
            registeredAt: reg.createdAt,
            spotsLeft: Math.max(0, reg.event.capacity - reg.event._count.registrations)
        };
    }));

    return mapped;
}

/**
 * Get user's registration status for an event
 */
export async function getRegistrationStatus(eventId: string, userId: string) {
    const registration = await prisma.eventRegistration.findUnique({
        where: {
            userId_eventId: {
                userId,
                eventId,
            },
        },
    });

    if (!registration) {
        return { isRegistered: false, status: null };
    }

    let waitlistPosition = null;
    if (registration.status === RegistrationStatus.waitlisted) {
        const waitlistEntry = await prisma.eventWaitlist.findUnique({
            where: {
                userId_eventId: {
                    userId,
                    eventId,
                },
            },
        });
        waitlistPosition = waitlistEntry?.position || null;
    }

    return {
        isRegistered: registration.status === RegistrationStatus.confirmed || registration.status === RegistrationStatus.waitlisted,
        status: registration.status,
        waitlistPosition,
        registeredAt: registration.createdAt,
    };
}

