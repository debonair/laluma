import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoUpload from '../components/VideoUpload';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';
import './ContentForm.css';

interface ContentFormData {
    title: string;
    body: string;
    excerpt: string;
    category: string;
    authorName: string;
    videoUrl: string;
    discountCode?: string;
    discountValue?: string;
    eventDate?: string;
    eventLocation?: string;
    latitude?: number | '';
    longitude?: number | '';
    contentType: 'article' | 'video' | 'mixed' | 'event' | 'promotion';
    isPremium: boolean;
    premiumTier?: 'premium' | 'premium_plus';
    isFeatured: boolean;
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    sponsorName?: string;
    sponsorLogoUrl?: string;
    sponsorLink?: string;
}

const CATEGORIES = ['Wellness', 'Breastfeeding', 'Parenting', 'Teen Parenting'];

const ContentForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ContentFormData>({
        title: '',
        body: '',
        excerpt: '',
        category: 'Wellness',
        authorName: '',
        videoUrl: '',
        contentType: 'article',
        isPremium: false,
        isFeatured: false,
        status: 'draft'
    });

    const fetchContent = React.useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/content/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setFormData({
                title: data.title || '',
                body: data.body || '',
                excerpt: data.excerpt || '',
                category: data.category || 'Wellness',
                authorName: data.authorName || '',
                videoUrl: data.videoUrl || '',
                contentType: data.contentType || 'article',
                isPremium: data.isPremium || false,
                premiumTier: data.premiumTier,
                isFeatured: data.isFeatured || false,
                status: data.status || 'draft',
                sponsorName: data.sponsorName || '',
                sponsorLogoUrl: data.sponsorLogoUrl || '',
                sponsorLink: data.sponsorLink || '',
                discountCode: data.discountCode || '',
                discountValue: data.discountValue || '',
                eventDate: data.eventDate ? new Date(data.eventDate).toISOString().slice(0, 16) : '',
                eventLocation: data.eventLocation || '',
                latitude: data.latitude ?? '',
                longitude: data.longitude ?? ''
            });
        } catch (err) {
            console.error('Error fetching content:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            fetchContent();
        }
    }, [id, fetchContent]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);
            const url = id
                ? `http://localhost:3000/api/content/${id}`
                : 'http://localhost:3000/api/content';

            const method = id ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                latitude: formData.latitude === '' ? null : Number(formData.latitude),
                longitude: formData.longitude === '' ? null : Number(formData.longitude),
                publishedAt: formData.status === 'approved' ? new Date().toISOString() : undefined,
                eventDate: formData.eventDate ? new Date(formData.eventDate).toISOString() : undefined
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                navigate('/admin/content');
            } else {
                const resData = await response.json().catch(() => ({}));
                setError(resData.error || resData.message || 'Failed to save content');
            }
        } catch (err) {
            console.error('Error saving content:', err);
            const msg = err instanceof Error ? err.message : 'Failed to save content';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleVideoUploaded = (videoUrl: string) => {
        setFormData(prev => ({ ...prev, videoUrl }));
    };

    if (loading) {
        return (
            <div className="page-container" style={{ padding: '2rem' }}>
                <Skeleton height={50} width="60%" style={{ marginBottom: '2rem' }} />
                <Skeleton height={400} borderRadius="12px" />
            </div>
        );
    }

    return (

        <div className="page-container">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                <button type="button" onClick={() => navigate(-1)} className="btn-link">
                    ←
                </button>
                <h1>{id ? 'Edit Content' : 'Create New Content'}</h1>
            </div>

            <main className="page-content">
                {error && (
                    <div style={{
                        background: 'rgba(255, 107, 107, 0.1)',
                        border: '1px solid rgba(255, 107, 107, 0.3)',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        color: '#ff4444',
                        fontSize: '0.9rem',
                        marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}
                <form className="content-form" onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <section className="form-section">
                        <h2>Basic Information</h2>

                        <div className="form-group">
                            <label htmlFor="title">Title *</label>
                            <input
                                type="text"
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="Enter content title"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="excerpt">Excerpt</label>
                            <textarea
                                id="excerpt"
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                rows={3}
                                placeholder="Brief summary of the content"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="authorName">Author Name</label>
                                <input
                                    type="text"
                                    id="authorName"
                                    value={formData.authorName}
                                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                                    placeholder="Author name"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Content Type & Media */}
                    <section className="form-section">
                        <h2>Content Type & Media</h2>

                        <div className="form-group">
                            <label htmlFor="contentType">Content Type *</label>
                            <select
                                id="contentType"
                                value={formData.contentType}
                                onChange={(e) => setFormData({ ...formData, contentType: e.target.value as ContentFormData['contentType'] })}
                                required
                            >
                                <option value="article">Article (Text Only)</option>
                                <option value="video">Video (Video Only)</option>
                                <option value="mixed">Mixed (Video + Text)</option>
                                <option value="event">Event</option>
                                <option value="promotion">Promotion (Discount)</option>
                            </select>
                            <span className="form-hint">
                                Choose the format or type of this content
                            </span>
                        </div>

                        {(formData.contentType === 'video' || formData.contentType === 'mixed') && (
                            <VideoUpload
                                onVideoUploaded={handleVideoUploaded}
                                currentVideoUrl={formData.videoUrl}
                            />
                        )}

                        {(formData.contentType === 'article' || formData.contentType === 'mixed') && (
                            <div className="form-group">
                                <label htmlFor="body">Article Body *</label>
                                <textarea
                                    id="body"
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    rows={15}
                                    required={formData.contentType === 'article'}
                                    placeholder="Write your article content here..."
                                />
                            </div>
                        )}

                        {formData.contentType === 'event' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="eventDate">Event Date & Time *</label>
                                    <input
                                        type="datetime-local"
                                        id="eventDate"
                                        value={formData.eventDate || ''}
                                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                        required={formData.contentType === 'event'}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="eventLocation">Event Location String *</label>
                                    <input
                                        type="text"
                                        id="eventLocation"
                                        value={formData.eventLocation || ''}
                                        onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                                        placeholder="e.g. Centennial Park or Zoom Link"
                                        required={formData.contentType === 'event'}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="latitude">Latitude *</label>
                                        <input
                                            type="number"
                                            step="any"
                                            id="latitude"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                            placeholder="e.g. 40.7128"
                                            required={formData.contentType === 'event'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="longitude">Longitude *</label>
                                        <input
                                            type="number"
                                            step="any"
                                            id="longitude"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                                            placeholder="e.g. -74.0060"
                                            required={formData.contentType === 'event'}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="body">Event Details *</label>
                                    <textarea
                                        id="body"
                                        value={formData.body}
                                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                        rows={8}
                                        required={formData.contentType === 'event'}
                                        placeholder="Describe the event..."
                                    />
                                </div>
                            </>
                        )}

                        {formData.contentType === 'promotion' && (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="discountCode">Discount Code</label>
                                        <input
                                            type="text"
                                            id="discountCode"
                                            value={formData.discountCode || ''}
                                            onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })}
                                            placeholder="e.g. LUMA20"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="discountValue">Discount Value *</label>
                                        <input
                                            type="text"
                                            id="discountValue"
                                            value={formData.discountValue || ''}
                                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                            placeholder="e.g. 20% Off"
                                            required={formData.contentType === 'promotion'}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="body">Promotion Details *</label>
                                    <textarea
                                        id="body"
                                        value={formData.body}
                                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                        rows={8}
                                        required={formData.contentType === 'promotion'}
                                        placeholder="Describe the promotion and terms..."
                                    />
                                </div>
                            </>
                        )}
                    </section>

                    {/* Premium & Features */}
                    <section className="form-section">
                        <h2>Premium & Features</h2>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.isPremium}
                                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                                />
                                <span>Premium Content</span>
                            </label>
                        </div>

                        {formData.isPremium && (
                            <div className="form-group">
                                <label htmlFor="premiumTier">Premium Tier</label>
                                <select
                                    id="premiumTier"
                                    value={formData.premiumTier || 'premium'}
                                    onChange={(e) => setFormData({ ...formData, premiumTier: e.target.value as ContentFormData['premiumTier'] })}
                                >
                                    <option value="premium">Premium</option>
                                    <option value="premium_plus">Premium+</option>
                                </select>
                            </div>
                        )}

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                />
                                <span>Featured Content</span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label htmlFor="status">Status</label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentFormData['status'] })}
                            >
                                <option value="draft">Draft</option>
                                <option value="pending">Pending Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </section>

                    {/* Sponsor Information */}
                    <section className="form-section">
                        <h2>Sponsor Information (Optional)</h2>

                        <div className="form-group">
                            <label htmlFor="sponsorName">Sponsor Name</label>
                            <input
                                type="text"
                                id="sponsorName"
                                value={formData.sponsorName}
                                onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
                                placeholder="Sponsor company name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="sponsorLogoUrl">Sponsor Logo URL</label>
                            <input
                                type="url"
                                id="sponsorLogoUrl"
                                value={formData.sponsorLogoUrl}
                                onChange={(e) => setFormData({ ...formData, sponsorLogoUrl: e.target.value })}
                                placeholder="https://example.com/logo.png"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="sponsorLink">Sponsor Link</label>
                            <input
                                type="url"
                                id="sponsorLink"
                                value={formData.sponsorLink}
                                onChange={(e) => setFormData({ ...formData, sponsorLink: e.target.value })}
                                placeholder="https://sponsor-website.com"
                            />
                        </div>
                    </section>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate('/admin/content')}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : (id ? 'Update Content' : 'Create Content')}
                        </button>
                    </div>
                </form>
            </main>
            <BottomNav />
        </div>
    );

};

export default ContentForm;
