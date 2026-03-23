import React, { useState, useEffect, useCallback } from 'react';
import { submissionService, type Submission } from '../services/submission.service';
import { useToast } from '../context/ToastContext';
import BottomNav from '../components/BottomNav';
import Skeleton from '../components/Skeleton';

const AdminSubmissions: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [filter, setFilter] = useState<string>('pending');
    const [loading, setLoading] = useState(true);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const { addToast } = useToast();

    const loadSubmissions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await submissionService.getAll(filter || undefined);
            setSubmissions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

    const handleApprove = async (id: string) => {
        if (!confirm('Approve this submission? It will be published as content.')) return;
        try {
            await submissionService.approve(id);
            loadSubmissions();
        } catch (err) {
            console.error(err);
            addToast('Failed to approve submission', 'error');
        }
    };

    const handleReject = async () => {
        if (!rejectId) return;
        try {
            await submissionService.reject(rejectId, rejectReason);
            setRejectId(null);
            setRejectReason('');
            loadSubmissions();
        } catch (err) {
            console.error(err);
            addToast('Failed to reject submission', 'error');
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444' };
        return colors[status] || '#6B7280';
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Review Submissions</h1>
            </header>

            <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {['pending', 'approved', 'rejected', ''].map(f => (
                    <button
                        key={f}
                        className={filter === f ? 'btn-primary' : 'btn-ghost'}
                        onClick={() => setFilter(f)}
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        {f || 'All'}
                    </button>
                ))}
            </div>

            <main className="page-content">
                {loading ? (
                    <div style={{ padding: '1rem' }}>
                        <Skeleton height={140} style={{ marginBottom: '1rem' }} borderRadius="12px" />
                        <Skeleton height={140} style={{ marginBottom: '1rem' }} borderRadius="12px" />
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '2rem' }}>📭</p>
                        <p style={{ color: 'var(--text-secondary)' }}>No {filter} submissions</p>
                    </div>
                ) : (
                    submissions.map(s => (
                        <div key={s.id} className="content-card" style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{s.title}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                                        by {s.user?.displayName || s.user?.username || 'Unknown'} • {s.category}
                                    </p>
                                </div>
                                <span style={{
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: `${getStatusColor(s.status)} 20`,
                                    color: getStatusColor(s.status)
                                }}>
                                    {s.status.toUpperCase()}
                                </span>
                            </div>

                            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, maxHeight: '100px', overflow: 'hidden' }}>
                                {s.body.substring(0, 300)}{s.body.length > 300 ? '...' : ''}
                            </p>

                            {s.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button className="btn-primary" onClick={() => handleApprove(s.id)} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                        ✅ Approve
                                    </button>
                                    <button className="btn-danger" onClick={() => setRejectId(s.id)} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                        ❌ Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Reject Modal */}
                {rejectId && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
                    }}>
                        <div className="content-card" style={{ padding: '1.5rem', maxWidth: '400px', width: '100%' }}>
                            <h3 style={{ margin: '0 0 1rem' }}>Reject Submission</h3>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for rejection (optional)..."
                                rows={4}
                                style={{ width: '100%', marginBottom: '1rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-danger" onClick={handleReject} style={{ flex: 1 }}>
                                    Confirm Reject
                                </button>
                                <button className="btn-ghost" onClick={() => { setRejectId(null); setRejectReason(''); }} style={{ flex: 1 }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default AdminSubmissions;
