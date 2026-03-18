import { useState, useEffect } from 'react';
import {
    getAllEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
    cancelEvent,
    type Event,
    type EventStatus,
    type CreateEventInput,
    type UpdateEventInput,
} from '../../services/event.service';

const EventManagement: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Form state
    const [formData, setFormData] = useState<CreateEventInput>({
        title: '',
        description: '',
        location: '',
        address: '',
        city: '',
        country: '',
        capacity: 50,
        startTime: '',
        endTime: '',
        registrationDeadline: '',
        status: 'draft',
    });

    useEffect(() => {
        loadEvents();
    }, [statusFilter]);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await getAllEvents({
                status: statusFilter || undefined,
            });
            setEvents(response.events);
        } catch (err) {
            setError('Failed to load events');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                await updateEvent(editingEvent.id, formData as UpdateEventInput);
            } else {
                await createEvent(formData);
            }
            setShowForm(false);
            setEditingEvent(null);
            resetForm();
            loadEvents();
        } catch (err) {
            setError('Failed to save event');
            console.error(err);
        }
    };

    const handleEdit = (event: Event) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description,
            location: event.location || '',
            address: event.address || '',
            city: event.city || '',
            country: event.country || '',
            capacity: event.capacity,
            startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
            endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
            registrationDeadline: event.registrationDeadline
                ? new Date(event.registrationDeadline).toISOString().slice(0, 16)
                : '',
            status: event.status,
        });
        setShowForm(true);
    };

    const handleDelete = async (eventId: string) => {
        if (!window.confirm('Are you sure you want to delete this event?')) {
            return;
        }
        try {
            await deleteEvent(eventId);
            loadEvents();
        } catch (err) {
            setError('Failed to delete event');
            console.error(err);
        }
    };

    const handlePublish = async (eventId: string) => {
        try {
            await publishEvent(eventId);
            loadEvents();
        } catch (err) {
            setError('Failed to publish event');
            console.error(err);
        }
    };

    const handleCancel = async (eventId: string) => {
        if (!window.confirm('Are you sure you want to cancel this event? All registered members will be notified.')) {
            return;
        }
        try {
            await cancelEvent(eventId);
            loadEvents();
        } catch (err) {
            setError('Failed to cancel event');
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            location: '',
            address: '',
            city: '',
            country: '',
            capacity: 50,
            startTime: '',
            endTime: '',
            registrationDeadline: '',
            status: 'draft',
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'draft':
                return 'badge-secondary';
            case 'published':
                return 'badge-success';
            case 'cancelled':
                return 'badge-danger';
            case 'completed':
                return 'badge-info';
            default:
                return '';
        }
    };

    if (loading) {
        return <div className="loading">Loading events...</div>;
    }

    return (
        <div className="event-management">
            <div className="page-header">
                <h1>Event Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingEvent(null);
                        resetForm();
                    }}
                >
                    {showForm ? 'Cancel' : 'Create Event'}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button onClick={() => setError(null)} className="close">
                        &times;
                    </button>
                </div>
            )}

            {showForm && (
                <div className="card mb-4">
                    <div className="card-header">
                        <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="title">Title *</label>
                                <input
                                    type="text"
                                    id="title"
                                    className="form-control"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description *</label>
                                <textarea
                                    id="description"
                                    className="form-control"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows={4}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group col-md-6">
                                    <label htmlFor="location">Location</label>
                                    <input
                                        type="text"
                                        id="location"
                                        className="form-control"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>

                                <div className="form-group col-md-6">
                                    <label htmlFor="address">Address</label>
                                    <input
                                        type="text"
                                        id="address"
                                        className="form-control"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group col-md-4">
                                    <label htmlFor="city">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        className="form-control"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>

                                <div className="form-group col-md-4">
                                    <label htmlFor="country">Country</label>
                                    <input
                                        type="text"
                                        id="country"
                                        className="form-control"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>

                                <div className="form-group col-md-4">
                                    <label htmlFor="capacity">Capacity *</label>
                                    <input
                                        type="number"
                                        id="capacity"
                                        className="form-control"
                                        value={formData.capacity}
                                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) })}
                                        required
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group col-md-4">
                                    <label htmlFor="startTime">Start Time *</label>
                                    <input
                                        type="datetime-local"
                                        id="startTime"
                                        className="form-control"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group col-md-4">
                                    <label htmlFor="endTime">End Time *</label>
                                    <input
                                        type="datetime-local"
                                        id="endTime"
                                        className="form-control"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group col-md-4">
                                    <label htmlFor="registrationDeadline">Registration Deadline</label>
                                    <input
                                        type="datetime-local"
                                        id="registrationDeadline"
                                        className="form-control"
                                        value={formData.registrationDeadline}
                                        onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    className="form-control"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as EventStatus })}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    {editingEvent ? 'Update Event' : 'Create Event'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingEvent(null);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="filter-section mb-4">
                <label htmlFor="statusFilter">Filter by Status: </label>
                <select
                    id="statusFilter"
                    className="form-control"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ width: 'auto', display: 'inline-block' }}
                >
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <div className="events-list">
                {events.length === 0 ? (
                    <div className="empty-state">
                        <p>No events found. Create your first event!</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Capacity</th>
                                <th>Registered</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id}>
                                    <td>
                                        <strong>{event.title}</strong>
                                    </td>
                                    <td>
                                        {new Date(event.startTime).toLocaleDateString()} -{' '}
                                        {new Date(event.startTime).toLocaleTimeString()}
                                    </td>
                                    <td>{event.location || event.city || 'TBD'}</td>
                                    <td>{event.capacity}</td>
                                    <td>
                                        {event.registeredCount} / {event.capacity}
                                    </td>
                                    <td>
                                        <span className={`badge ${getStatusBadgeClass(event.status)}`}>
                                            {event.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            {event.status === 'draft' && (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handlePublish(event.id)}
                                                    title="Publish"
                                                >
                                                    Publish
                                                </button>
                                            )}
                                            {(event.status === 'draft' || event.status === 'published') && (
                                                <button
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => handleCancel(event.id)}
                                                    title="Cancel"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => handleEdit(event)}
                                                title="Edit"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(event.id)}
                                                title="Delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default EventManagement;
