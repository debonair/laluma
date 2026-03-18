/**
 * Event Routes - Admin Event Creation & Management (Story 7.2)
 *
 * Admin/Moderator routes for event management:
 * - POST /api/events - Create new event
 * - GET /api/events - List all events (admin view)
 * - GET /api/events/:id - Get single event
 * - PUT /api/events/:id - Update existing event
 * - DELETE /api/events/:id - Delete event
 * - POST /api/events/:id/publish - Publish draft event
 * - POST /api/events/:id/cancel - Cancel event
 *
 * Member-facing routes (Story 7.3):
 * - GET /api/events/discover - Discover events with filters
 * - GET /api/events/:id/details - Get event details
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
    cancelEvent,
    getAllEvents,
    getEventById,
    discoverEvents,
    getEventDetails,
    registerForEvent,
    cancelRegistration,
    getRegistrationStatus,
    getMyEvents,
} from '../controllers/event.controller';

const router = Router();

// All event routes require authentication
router.use(authenticate);

// ============================================================================
// Member-facing routes (Story 7.3 - Event Discovery & Browsing)
// ============================================================================

// GET /api/events/discover - Discover events with pagination and filters
router.get('/discover', discoverEvents);

// GET /api/events/:id/details - Get event details
router.get('/:id/details', getEventDetails);

// ============================================================================
// Member Event Registration Routes (Story 7.4)
// ============================================================================

// POST /api/events/:id/register - Register for an event
router.post('/:id/register', registerForEvent);

// POST /api/events/:id/cancel-registration - Cancel registration
router.post('/:id/cancel-registration', cancelRegistration);

// GET /api/events/:id/registration-status - Get user's registration status
router.get('/:id/registration-status', getRegistrationStatus);

// GET /api/events/my - Get user's registered and waitlisted events (Story 7.6)
router.get('/my', getMyEvents);


// ============================================================================
// Admin/Moderator routes for event management
// ============================================================================

router.post('/', requireRole('admin', 'moderator'), createEvent);
router.get('/', requireRole('admin', 'moderator'), getAllEvents);
router.get('/:id', requireRole('admin', 'moderator'), getEventById);
router.put('/:id', requireRole('admin', 'moderator'), updateEvent);
router.delete('/:id', requireRole('admin', 'moderator'), deleteEvent);
router.post('/:id/publish', requireRole('admin', 'moderator'), publishEvent);
router.post('/:id/cancel', requireRole('admin', 'moderator'), cancelEvent);

export default router;
