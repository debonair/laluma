import React, { useState, useEffect } from 'react';
import { submissionService, type Submission } from '../services/submission.service';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';

const CATEGORIES = ['Motherhood', 'Health & Wellness', 'Parenting Tips', 'Recipes', 'Mental Health', 'Fitness', 'Other'];

const SubmitContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'submit' | 'my'>('submit');
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [category, setCategory] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'my') loadSubmissions();
    }, [activeTab]);

    const loadSubmissions = async () => {
        try {
            setLoading(true);
            const data = await submissionService.getMine();
            setSubmissions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !body.trim() || !category) return;

        try {
            setSubmitting(true);
            setError(null);
            await submissionService.create({ title, body, category });
            setTitle('');
            setBody('');
            setCategory('');
            setSuccess('Your content has been submitted for review!');
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : 'Failed to submit content. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: '#F59E0B',
            approved: '#10B981',
            rejected: '#EF4444'
        };
        return (
            <span style={{
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: `${colors[status] || '#6B7280'}20`,
                color: colors[status] || '#6B7280'
            }}>
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Submit Content</h1>
            </header>

            <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem', marginBottom: '1rem' }}>
                <button
                    className={activeTab === 'submit' ? 'btn-primary' : 'btn-ghost'}
                    onClick={() => setActiveTab('submit')}
                    style={{ flex: 1, padding: '0.5rem' }}
                >
                    ✏️ New Submission
                </button>
                <button
                    className={activeTab === 'my' ? 'btn-primary' : 'btn-ghost'}
                    onClick={() => setActiveTab('my')}
                    style={{ flex: 1, padding: '0.5rem' }}
                >
                    📄 My Submissions
                </button>
            </div>

            <main className="page-content">
                {activeTab === 'submit' ? (
                    <div className="content-card" style={{ padding: '1.5rem' }}>
                        {success && (
                            <div style={{
                                padding: '1rem',
                                backgroundColor: '#D1FAE5',
                                color: '#065F46',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                fontWeight: 500
                            }}>
                                ✅ {success}
                            </div>
                        )}
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
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a compelling title..."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                                    <option value="">Select category...</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Write your article content here..."
                                    rows={12}
                                    required
                                    style={{ minHeight: '200px' }}
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%' }}>
                                {submitting ? 'Submitting...' : 'Submit for Review'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div>
                        {loading ? (
                            <div style={{ padding: '1rem' }}>
                                <Skeleton height={120} style={{ marginBottom: '1rem' }} borderRadius="12px" />
                                <Skeleton height={120} style={{ marginBottom: '1rem' }} borderRadius="12px" />
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
                                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</p>
                                <p style={{ color: 'var(--text-secondary)' }}>No submissions yet. Submit your first article!</p>
                            </div>
                        ) : (
                            submissions.map(s => (
                                <div key={s.id} className="content-card" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{s.title}</h3>
                                        {getStatusBadge(s.status)}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                                        {s.category} • {new Date(s.createdAt).toLocaleDateString()}
                                    </p>
                                    {s.rejectionReason && (
                                        <p style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.5rem' }}>
                                            Reason: {s.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default SubmitContent;
