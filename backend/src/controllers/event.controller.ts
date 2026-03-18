/**
 * Event Controller - Admin Event Creation & Management (Story 7.2)
 *
 * Handles admin/moderator operations for:
 * - POST /api/events - Create new event
 * - PUT /api/events/:id - Update existing event
 * - DELETE /api/events/:id - Delete event
 * - POST /api/events/:id/publish - Publish draft event
 * - POST /api/events/:id/cancel - Cancel event
 * - GET /api/events - List all events (admin view)
 * - GET /api/events/:id - Get single event
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as eventService from '../services/event.service';

// Create a new event (Admin/Moderator only)
export async function createEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
        const {
            title,
            description,
            location,
            address,
            latitude,
            longitude,
            city,
            country,
            capacity,
            startTime,
            endTime,
            registrationDeadline,
            status,
        } = req.body;

        // Validate required fields
        if (!title || !description || !startTime || !endTime || capacity === undefined) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Missing required fields: title, description, startTime, endTime, capacity',
            });
            return;
        }

        const event = await eventService.createEvent({
            title,
            description,
            location,
            address,
            latitude,
            longitude,
            city,
            country,
            capacity,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
            status: status as any,
            organizerId: req.user?.userId,
        });

        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to create event',
        });
    }
}

// Update an existing event (Admin/Moderator only)
export async function updateEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
        const eventId = req.params.id as string;
        const {
            title,
            description,
            location,
            address,
            latitude,
            longitude,
            city,
            country,
            capacity,
            startTime,
            endTime,
            registrationDeadline,
            status,
        } = req.body;

        const event = await eventService.updateEvent(eventId, {
            title,
            description,
            location,
            address,
            latitude,
            longitude,
            city,
            country,
            capacity,
            startTime: startTime ? new Date(startTime) : undefined,
            endTime: endTime ? new Date(endTime) : undefined,
            registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : undefined,
            status: status as any,
        });

        res.json(event);
    } catch (error) {
        console.error('Error updating event:', error);
        const statusCode = error instanceof Error && error.message === 'Event not found' ? 404 : 500;
        res.status(statusCode).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to update event',
        });
    }
}

// Delete an event (Admin/Moderator only)
export async function deleteEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
        const eventId = req.params.id as string;

        await eventService.deleteEvent(eventId);

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting event:', error);
        const statusCode = error instanceof Error && error.message === 'Event not found' ? 404 : 500;
        res.status(statusCode).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to delete event',
        });
    }
}

// Publish a draft event (Admin/Moderator only)
export async function publishEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
        const eventId = req.params.id as string;

        const event = await eventService.publishEvent(eventId);

        res.json(event);
    } catch (error) {
        console.error('Error publishing event:', error);
        const statusCode = error instanceof Error && error.message === 'Event not found' ? 404 : 500;
        res.status(statusCode).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to publish event',
        });
    }
}

// Cancel an event and notify registered members (Admin/Moderator only)
export async function cancelEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
        const eventId = req.params.id as string;

        const event = await eventService.cancelEvent(eventId);

        res.json(event);
    } catch (error) {
        console.error('Error cancelling event:', error);
        const statusCode = error instanceof Error && error.message === 'Event not found' ? 404 : 500;
        res.status(statusCode).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to cancel event',
        });
    }
}

// Get all events (Admin view - includes draft)
export async function getAllEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { status, skip, take } = req.query;

        const result = await eventService.getAllEvents({
            status: status as any,
            skip: skip ? parseInt(skip as string, 10) : undefined,
            take: take ? parseInt(take as string, 10) : undefined,
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch events',
        });
    }
}

// Get single event by ID
export async function getEventById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const eventId = req.params.id as string;

        const event = await eventService.getEventById(eventId);

        if (!event) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Event not found',
            });
            return;
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch event',
        });
    }
}

// ============================================================================
// Event Discovery - Member-facing (Story 7.3)
// ============================================================================

/**
 * Discover events for members - paginated, date-ordered, filtered
 * GET /api/events/discover
 * 
 * Query params:
 * - latitude: User's latitude for proximity filtering
 * - longitude: User's longitude for proximity filtering  
 * - radius: Search radius in km (default: 50)
 * - dateFilter: 'upcoming' | 'this_week' | 'this_month'
 * - startDate: ISO date string for custom range start
 * - endDate: ISO date string for custom range end
 * - skip: Pagination offset
 * - take: Pagination limit
 */
export async function discoverEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const {
            latitude,
            longitude,
            radius,
            dateFilter,
            startDate,
            endDate,
            skip,
            take,
        } = req.query;

        // Validate coordinates
        const lat = latitude ? parseFloat(latitude as string) : undefined;
        const lon = longitude ? parseFloat(longitude as string) : undefined;

        if (lat !== undefined && (lat < -90 || lat > 90)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Latitude must be between -90 and 90',
            });
            return;
        }

        if (lon !== undefined && (lon < -180 || lon > 180)) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Longitude must be between -180 and 180',
            });
            return;
        }

        // Validate radius
        const parsedRadius = radius ? parseInt(radius as string, 10) : undefined;
        if (parsedRadius !== undefined && parsedRadius < 1) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Radius must be at least 1 km',
            });
            return;
        }

        const result = await eventService.discoverEvents({
            userId,
            latitude: lat,
            longitude: lon,
            radius: parsedRadius,
            dateFilter: dateFilter as 'upcoming' | 'this_week' | 'this_month' | undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            skip: skip ? parseInt(skip as string, 10) : undefined,
            take: take ? parseInt(take as string, 10) : undefined,
        });

        res.json(result);
    } catch (error) {
        console.error('Error discovering events:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to discover events',
        });
    }
}

/**
 * Get event details for members
 * GET /api/events/:id/details
 */
export async function getEventDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;
        const eventId = req.params.id as string;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const event = await eventService.getEventDetails(eventId, userId);

        if (!event) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Event not found or not available',
            });
            return;
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch event details',
        });
    }
}

// ============================================================================
// Event Registration - Member-facing (Story 7.4)
// ============================================================================

/**
 * Register for an event
 * POST /api/events/:id/register
 */
export async function registerForEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;
        const eventId = req.params.id as string;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const result = await eventService.registerForEvent(eventId, userId);

        res.status(201).json(result);
    } catch (error) {
        console.error('Error registering for event:', error);
        const statusCode = error instanceof Error &&
            ['Event not found', 'Event is not available for registration',
                'Registration deadline has passed', 'Event is now full'].includes(error.message) ? 400 : 500;
        res.status(statusCode).json({
            error: statusCode === 400 ? 'Bad Request' : 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to register for event',
        });
    }
}

/**
 * Cancel event registration
 * POST /api/events/:id/cancel-registration
 */
export async function cancelRegistration(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;
        const eventId = req.params.id as string;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const result = await eventService.cancelRegistration(eventId, userId);

        res.json(result);
    } catch (error) {
        console.error('Error cancelling registration:', error);
        const statusCode = error instanceof Error && error.message === 'Registration not found' ? 404 : 500;
        res.status(statusCode).json({
            error: statusCode === 404 ? 'Not Found' : 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to cancel registration',
        });
    }
}

/**
 * Get user's registration status for an event
 * GET /api/events/:id/registration-status
 */
export async function getRegistrationStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;
        const eventId = req.params.id as string;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const result = await eventService.getRegistrationStatus(eventId, userId);

        res.json(result);
    } catch (error) {
        console.error('Error fetching registration status:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch registration status',
        });
    }
}
/**
 * Get events the current user is registered for or waitlisted on (Story 7.6)
 * GET /api/events/my
 */
export async function getMyEvents(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'User not authenticated',
            });
            return;
        }

        const events = await eventService.getMyEvents(userId);

        res.json(events);
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Failed to fetch your events',
        });
    }
}
