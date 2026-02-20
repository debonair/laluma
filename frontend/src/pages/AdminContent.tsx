import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import './AdminContent.css';

interface Content {
    id: string;
    title: string;
    excerpt: string;
    category: string;
    authorName: string;
    isPremium: boolean;
    premiumTier?: string;
    isFeatured: boolean;
    contentType?: string;
    status: string;
    viewCount: number;
    likesCount: number;
    commentsCount: number;
    publishedAt: string;
    createdAt: string;
}

const AdminContent: React.FC = () => {
    const [content, setContent] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    const fetchContent = React.useCallback(async () => {
        try {
            setLoading(true);
            const statusParam = filter === 'all' ? '' : `?status=${filter}`;
            const response = await fetch(`http://localhost:3000/api/content${statusParam}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setContent(data.content || []);
        } catch (error) {
            console.error('Error fetching content:', error);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchContent();
    }, [fetchContent]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this content?')) return;

        try {
            await fetch(`http://localhost:3000/api/content/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            fetchContent();
        } catch (error) {
            console.error('Error deleting content:', error);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await fetch(`http://localhost:3000/api/content/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            fetchContent();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            draft: 'badge-draft',
            pending: 'badge-pending',
            approved: 'badge-approved',
            rejected: 'badge-rejected'
        };
        return badges[status] || 'badge-default';
    };

    return (

        <div className="page-container">
            <div className="page-header admin-header">
                <h1>Content Management</h1>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/admin/content/new')}
                >
                    + New Content
                </button>
            </div>

            <main className="page-content">
                <div className="filters">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={filter === 'draft' ? 'active' : ''}
                        onClick={() => setFilter('draft')}
                    >
                        Drafts
                    </button>
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        Pending
                    </button>
                    <button
                        className={filter === 'approved' ? 'active' : ''}
                        onClick={() => setFilter('approved')}
                    >
                        Approved
                    </button>
                    <button
                        className={filter === 'rejected' ? 'active' : ''}
                        onClick={() => setFilter('rejected')}
                    >
                        Rejected
                    </button>
                </div>

                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <div className="content-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Author</th>
                                    <th>Status</th>
                                    <th>Premium</th>
                                    <th>Featured</th>
                                    <th>Stats</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {content.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="title-cell">
                                                <strong>{item.title}</strong>
                                                <span className="excerpt">{item.excerpt}</span>
                                            </div>
                                        </td>
                                        <td>{item.category}</td>
                                        <td>
                                            <span className={`type-badge type-${item.contentType || 'article'}`}>
                                                {item.contentType === 'video' ? '🎬 Video' : item.contentType === 'mixed' ? '📝🎬 Mixed' : '📝 Article'}
                                            </span>
                                        </td>
                                        <td>{item.authorName || 'N/A'}</td>
                                        <td>
                                            <select
                                                className={`status-badge ${getStatusBadge(item.status)}`}
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </td>
                                        <td>
                                            {item.isPremium ? (
                                                <span className="premium-badge">
                                                    {item.premiumTier === 'premium_plus' ? 'Premium+' : 'Premium'}
                                                </span>
                                            ) : (
                                                <span className="free-badge">Free</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.isFeatured && <span className="featured-icon">⭐</span>}
                                        </td>
                                        <td>
                                            <div className="stats">
                                                <span>👁 {item.viewCount}</span>
                                                <span>❤️ {item.likesCount}</span>
                                                <span>💬 {item.commentsCount}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions">
                                                <button
                                                    className="btn-neutral"
                                                    onClick={() => navigate(`/admin/content/edit/${item.id}`)}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn-danger"
                                                    onClick={() => handleDelete(item.id)}
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {content.length === 0 && (
                            <div className="empty-state">
                                <p>No content found</p>
                            </div>
                        )}
                    </div>
                )}
                {/* Spacer for bottom nav */}
                <div style={{ height: '60px' }}></div>
            </main>
            <BottomNav />
        </div>
    );

};

export default AdminContent;
