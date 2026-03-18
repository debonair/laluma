import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
    createEvent,
    updateEvent,
    cancelEvent,
    publishEvent,
    getAllEvents,
    getEventById,
    deleteEvent,
    registerForEvent,
    cancelRegistration,
    getRegistrationStatus
} from './event.service';
import prisma from '../utils/prisma';
import { getIO } from '../socket';

// Mock the socket.io instance
vi.mock('../socket', () => ({
    getIO: vi.fn(() => ({
        to: vi.fn().mockReturnThis(),
        emit: vi.fn().mockReturnThis(),
    })),
}));

// Mock the prisma client
vi.mock('../utils/prisma', () => ({
    default: {
        event: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
            count: vi.fn(),
        },
        eventRegistration: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        eventWaitlist: {
            count: vi.fn(),
            create: vi.fn(),
            findFirst: vi.fn(),
            delete: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
    },
}));

// Mock push notification service
vi.mock('./pushNotification.service', () => ({
    sendPushToUser: vi.fn().mockResolvedValue(undefined),
}));

describe('Event Service', () => {
    const mockEvent = {
        id: 'event-123',
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        address: '123 Test St',
        latitude: 40.7128,
        longitude: -74.006,
        city: 'New York',
        country: 'USA',
        capacity: 100,
        registeredCount: 0,
        status: 'draft' as const,
        startTime: new Date('2026-04-01T18:00:00Z'),
        endTime: new Date('2026-04-01T20:00:00Z'),
        registrationDeadline: new Date('2026-03-31T18:00:00Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
        organizerId: 'user-123',
    };

    beforeAll(() => {
        // Reset all mocks before tests
        vi.clearAllMocks();
    });

    afterAll(() => {
        vi.restoreAllMocks();
    });

    describe('createEvent', () => {
        it('should create an event with all required fields', async () => {
            vi.mocked(prisma.event.create).mockResolvedValue(mockEvent as any);

            const input = {
                title: 'Test Event',
                description: 'Test Description',
                location: 'Test Location',
                address: '123 Test St',
                latitude: 40.7128,
                longitude: -74.006,
                city: 'New York',
                country: 'USA',
                capacity: 100,
                startTime: new Date('2026-04-01T18:00:00Z'),
                endTime: new Date('2026-04-01T20:00:00Z'),
                registrationDeadline: new Date('2026-03-31T18:00:00Z'),
            };

            const result = await createEvent(input);

            expect(result).toEqual(mockEvent);
            expect(prisma.event.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    title: input.title,
                    description: input.description,
                    capacity: input.capacity,
                    status: 'draft',
                }),
            });
        });

        it('should create event with published status when specified', async () => {
            const publishedEvent = { ...mockEvent, status: 'published' as const };
            vi.mocked(prisma.event.create).mockResolvedValue(publishedEvent as any);

            const input = {
                title: 'Test Event',
                description: 'Test Description',
                capacity: 100,
                startTime: new Date('2026-04-01T18:00:00Z'),
                endTime: new Date('2026-04-01T20:00:00Z'),
                status: 'published' as const,
            };

            const result = await createEvent(input);

            expect(result.status).toBe('published');
        });
    });

    describe('updateEvent', () => {
        it('should update an existing event', async () => {
            const updatedEvent = { ...mockEvent, title: 'Updated Title' };
            (prisma.event.findUnique as any).mockResolvedValue(mockEvent);
            (prisma.event.update as any).mockResolvedValue(updatedEvent);

            const result = await updateEvent('event-123', { title: 'Updated Title' });

            expect(result.title).toBe('Updated Title');
            expect(prisma.event.update).toHaveBeenCalledWith({
                where: { id: 'event-123' },
                data: { title: 'Updated Title' },
            });
        });

        it('should throw error if event not found', async () => {
            (prisma.event.findUnique as any).mockResolvedValue(null);

            await expect(updateEvent('non-existent', { title: 'Test' }))
                .rejects.toThrow('Event not found');
        });

        it('should throw error if capacity is less than registered count', async () => {
            const eventWithRegistrations = { ...mockEvent, registeredCount: 50 };
            (prisma.event.findUnique as any).mockResolvedValue(eventWithRegistrations);

            await expect(updateEvent('event-123', { capacity: 30 }))
                .rejects.toThrow('Capacity cannot be less than current registered count');
        });
    });

    describe('cancelEvent', () => {
        it('should cancel event and notify registered members', async () => {
            const cancelledEvent = { ...mockEvent, status: 'cancelled' as const };
            const mockRegistration = {
                id: 'reg-1',
                userId: 'user-1',
                user: { id: 'user-1' },
            };

            (prisma.event.findUnique as any).mockResolvedValue({
                ...mockEvent,
                registrations: [mockRegistration],
            });
            (prisma.event.update as any).mockResolvedValue(cancelledEvent);
            (prisma.eventRegistration.updateMany as any).mockResolvedValue({ count: 1 });

            const result = await cancelEvent('event-123');

            expect(result.status).toBe('cancelled');
            expect(prisma.eventRegistration.updateMany).toHaveBeenCalled();
        });

        it('should throw error if event not found', async () => {
            (prisma.event.findUnique as any).mockResolvedValue(null);

            await expect(cancelEvent('non-existent'))
                .rejects.toThrow('Event not found');
        });
    });

    describe('publishEvent', () => {
        it('should publish a draft event', async () => {
            const publishedEvent = { ...mockEvent, status: 'published' as const };
            (prisma.event.findUnique as any).mockResolvedValue(mockEvent);
            (prisma.event.update as any).mockResolvedValue(publishedEvent);

            const result = await publishEvent('event-123');

            expect(result.status).toBe('published');
        });

        it('should throw error if event not found', async () => {
            (prisma.event.findUnique as any).mockResolvedValue(null);

            await expect(publishEvent('non-existent'))
                .rejects.toThrow('Event not found');
        });

        it('should throw error if event is not in draft status', async () => {
            const publishedEvent = { ...mockEvent, status: 'published' as const };
            (prisma.event.findUnique as any).mockResolvedValue(publishedEvent);

            await expect(publishEvent('event-123'))
                .rejects.toThrow('Only draft events can be published');
        });
    });

    describe('getAllEvents', () => {
        it('should return all events with pagination', async () => {
            const events = [mockEvent];
            (prisma.event.findMany as any).mockResolvedValue(events);
            (prisma.event.count as any).mockResolvedValue(1);

            const result = await getAllEvents({ skip: 0, take: 10 });

            expect(result.events).toEqual(events);
            expect(result.total).toBe(1);
        });

        it('should filter by status when provided', async () => {
            const events = [mockEvent];
            (prisma.event.findMany as any).mockResolvedValue(events);
            (prisma.event.count as any).mockResolvedValue(1);

            await getAllEvents({ status: 'draft' });

            expect(prisma.event.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'draft' },
                })
            );
        });
    });

    describe('getEventById', () => {
        it('should return event by ID', async () => {
            (prisma.event.findUnique as any).mockResolvedValue(mockEvent);

            const result = await getEventById('event-123');

            expect(result).toEqual(mockEvent);
        });

        it('should return null for non-existent event', async () => {
            (prisma.event.findUnique as any).mockResolvedValue(null);

            const result = await getEventById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('deleteEvent', () => {
        it('should delete an event', async () => {
            (prisma.event.findUnique as any).mockResolvedValue(mockEvent);
            (prisma.event.delete as any).mockResolvedValue(mockEvent);

            const result = await deleteEvent('event-123');

            expect(result.success).toBe(true);
            expect(prisma.event.delete).toHaveBeenCalledWith({
                where: { id: 'event-123' },
            });
        });

        it('should throw error if event not found', async () => {
            (prisma.event.findUnique as any).mockResolvedValue(null);

            await expect(deleteEvent('non-existent'))
                .rejects.toThrow('Event not found');
        });
    });

    // ============================================================================
    // Registration Tests (Story 7.4)
    // ============================================================================

    describe('registerForEvent', () => {
        const mockEventWithCapacity = {
            ...mockEvent,
            status: 'published' as const,
            _count: { registrations: 50 },
        };

        it('should register for an event successfully', async () => {
            const mockRegistration = { id: 'reg-1', userId: 'user-1', eventId: 'event-123', status: 'confirmed' as const };

            (prisma.event.findUnique as any).mockResolvedValue({
                ...mockEventWithCapacity,
                registrationDeadline: null,
            });
            (prisma.eventRegistration.findUnique as any).mockResolvedValue(null);
            (prisma.$transaction as any).mockImplementation(async (callback: any) => {
                return callback(prisma);
            });
            (prisma.event.findUnique as any).mockResolvedValueOnce({ registeredCount: 50, capacity: 100, status: 'published', _count: { registrations: 50 } });
            (prisma.eventRegistration.create as any).mockResolvedValue(mockRegistration);
            (prisma.event.update as any).mockResolvedValue({});

            const result = await registerForEvent('event-123', 'user-1');

            expect(result.registration).toBeDefined();
            expect(result.message).toContain('Successfully registered');
        });

        it('should throw error if event not found', async () => {
            (prisma.event.findUnique as any).mockResolvedValue(null);

            await expect(registerForEvent('non-existent', 'user-1'))
                .rejects.toThrow('Event not found');
        });

        it('should throw error if event is not published', async () => {
            (prisma.event.findUnique as any).mockResolvedValue({ ...mockEvent, status: 'draft' as const });

            await expect(registerForEvent('event-123', 'user-1'))
                .rejects.toThrow('Event is not available for registration');
        });

        it('should add to waitlist if event is full', async () => {
            const mockWaitlistRegistration = { id: 'reg-waitlist', userId: 'user-1', eventId: 'event-123', status: 'waitlisted' as const };

            (prisma.event.findUnique as any).mockResolvedValue({
                ...mockEventWithCapacity,
                _count: { registrations: 100 },
                registrationDeadline: null,
            });
            (prisma.eventRegistration.findUnique as any).mockResolvedValue(null);
            (prisma.eventWaitlist.count as any).mockResolvedValue(0);
            (prisma.eventWaitlist.create as any).mockResolvedValue({ id: 'waitlist-1', position: 1 });
            (prisma.eventRegistration.create as any).mockResolvedValue(mockWaitlistRegistration);

            const result = await registerForEvent('event-123', 'user-1');

            expect(result.isWaitlisted).toBe(true);
            expect(result.message).toContain('waitlist');
        });

        it('should return already registered message if user is already registered', async () => {
            const existingRegistration = { id: 'reg-1', userId: 'user-1', eventId: 'event-123', status: 'confirmed' as const };

            (prisma.event.findUnique as any).mockResolvedValue({
                ...mockEventWithCapacity,
                registrationDeadline: null,
            });
            (prisma.eventRegistration.findUnique as any).mockResolvedValue(existingRegistration);

            const result = await registerForEvent('event-123', 'user-1');

            expect(result.alreadyRegistered).toBe(true);
        });
    });

    describe('cancelRegistration', () => {
        it('should cancel registration successfully', async () => {
            const existingRegistration = { id: 'reg-1', userId: 'user-1', eventId: 'event-123', status: 'confirmed' as const };

            (prisma.eventRegistration.findUnique as any).mockResolvedValue(existingRegistration);
            (prisma.eventRegistration.update as any).mockResolvedValue({ ...existingRegistration, status: 'cancelled' });
            (prisma.event.update as any).mockResolvedValue({});
            (prisma.eventWaitlist.findFirst as any).mockResolvedValue(null);

            const result = await cancelRegistration('event-123', 'user-1');

            expect(result.message).toContain('cancelled');
        });

        it('should throw error if registration not found', async () => {
            (prisma.eventRegistration.findUnique as any).mockResolvedValue(null);

            await expect(cancelRegistration('event-123', 'user-1'))
                .rejects.toThrow('Registration not found');
        });
    });

    describe('getRegistrationStatus', () => {
        it('should return registration status for registered user', async () => {
            const registration = { id: 'reg-1', userId: 'user-1', eventId: 'event-123', status: 'confirmed' as const, createdAt: new Date() };

            (prisma.eventRegistration.findUnique as any).mockResolvedValue(registration);

            const result = await getRegistrationStatus('event-123', 'user-1');

            expect(result.isRegistered).toBe(true);
            expect(result.status).toBe('confirmed');
        });

        it('should return null status for non-registered user', async () => {
            (prisma.eventRegistration.findUnique as any).mockResolvedValue(null);

            const result = await getRegistrationStatus('event-123', 'user-1');

            expect(result.isRegistered).toBe(false);
            expect(result.status).toBeNull();
        });
    });
});
