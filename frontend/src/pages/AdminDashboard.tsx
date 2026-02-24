import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { SERVER_URL } from '../services/api';

interface AdminStats {
    totalUsers: number;
    totalGroups: number;
    pendingSubmissions: number;
    activeContent: number;
}

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${SERVER_URL}/api/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch stats');
                }

                const data = await response.json();
                setStats(data.stats);
            } catch (err) {
                console.error('Error fetching admin stats:', err);
                setError('Failed to load dashboard metrics.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="page-container" style={{ background: 'var(--bg-color)' }}>
            <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                <h1>Admin Dashboard</h1>
                <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                    Platform Overview & Management
                </p>
            </div>

            <main className="page-content" style={{ padding: '1.5rem 1rem' }}>
                {error && (
                    <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', color: '#B91C1C', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Platform Metrics</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="content-card skeleton" style={{ height: '90px' }} />
                            ))
                        ) : stats ? (
                            <>
                                <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>{stats.totalUsers}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Users</div>
                                </div>
                                <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>{stats.totalGroups}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Groups</div>
                                </div>
                                <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: stats.pendingSubmissions > 0 ? '#FEF3C7' : undefined, border: stats.pendingSubmissions > 0 ? '1px solid #F59E0B' : undefined }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.pendingSubmissions > 0 ? '#D97706' : 'var(--primary-color)' }}>{stats.pendingSubmissions}</div>
                                    <div style={{ fontSize: '0.8rem', color: stats.pendingSubmissions > 0 ? '#B45309' : 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>Pending Subs</div>
                                </div>
                                <div className="content-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-color)' }}>{stats.activeContent}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>Live Content</div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </section>

                <section>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Quick Actions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div
                            className="content-card"
                            style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s', ...(stats && stats.pendingSubmissions > 0 ? { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' } : {}) }}
                            onClick={() => navigate('/admin/submissions')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '1.5rem' }}>📨</div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>Review Submissions</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Moderate user-submitted content</div>
                                </div>
                            </div>
                            <div style={{ color: 'var(--primary-color)' }}>→</div>
                        </div>

                        <div
                            className="content-card"
                            style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => navigate('/admin/content')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '1.5rem' }}>📚</div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>Manage Content</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Edit or delete live platform content</div>
                                </div>
                            </div>
                            <div style={{ color: 'var(--primary-color)' }}>→</div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
};

export default AdminDashboard;
