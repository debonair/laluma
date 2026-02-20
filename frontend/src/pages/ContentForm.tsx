import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoUpload from '../components/VideoUpload';
import BottomNav from '../components/BottomNav';
import './ContentForm.css';

interface ContentFormData {
    title: string;
    body: string;
    excerpt: string;
    category: string;
    authorName: string;
    videoUrl: string;
    contentType: 'article' | 'video' | 'mixed';
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
                sponsorLink: data.sponsorLink || ''
            });
        } catch (error) {
            console.error('Error fetching content:', error);
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
            const url = id
                ? `http://localhost:3000/api/content/${id}`
                : 'http://localhost:3000/api/content';

            const method = id ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                publishedAt: formData.status === 'approved' ? new Date().toISOString() : undefined
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
                alert('Failed to save content');
            }
        } catch (error) {
            console.error('Error saving content:', error);
            alert('Failed to save content');
        } finally {
            setSaving(false);
        }
    };

    const handleVideoUploaded = (videoUrl: string) => {
        setFormData(prev => ({ ...prev, videoUrl }));
    };

    if (loading) {
        return <div className="content-form-loading">Loading...</div>;
    }

    return (

        <div className="page-container">
            <div className="page-header content-form-header">
                <button className="back-button" onClick={() => navigate('/admin/content')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '1.2rem', cursor: 'pointer', marginRight: '1rem' }}>
                    ←
                </button>
                <h1>{id ? 'Edit Content' : 'Create New Content'}</h1>
            </div>

            <main className="page-content">
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
                            </select>
                            <span className="form-hint">
                                Choose whether this content is text-only, video-only, or both
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
                {/* Spacer for bottom nav */}
                <div style={{ height: '60px' }}></div>
            </main>
            <BottomNav />
        </div>
    );

};

export default ContentForm;
