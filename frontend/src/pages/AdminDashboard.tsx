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

import './AdminDashboard.css';

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
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-content">
                    <h1>Admin Dashboard</h1>
                    <p>Platform Overview & Management</p>
                </div>
            </header>

            <main className="admin-content">
                {error && (
                    <div className="alert-error">
                        {error}
                    </div>
                )}

                <section className="admin-section">
                    <h2>Platform Metrics</h2>
                    <div className="metrics-grid">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="metric-card skeleton-metric" />
                            ))
                        ) : stats ? (
                            <>
                                <div className="metric-card">
                                    <div className="metric-value">{stats.totalUsers}</div>
                                    <div className="metric-label">Total Users</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value">{stats.totalGroups}</div>
                                    <div className="metric-label">Active Groups</div>
                                </div>
                                <div className={`metric-card ${stats.pendingSubmissions > 0 ? 'pending' : ''}`}>
                                    <div className="metric-value">{stats.pendingSubmissions}</div>
                                    <div className="metric-label">Pending Subs</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value">{stats.activeContent}</div>
                                    <div className="metric-label">Live Content</div>
                                </div>
                            </>
                        ) : null}
                    </div>
                </section>

                <section className="admin-section">
                    <h2>Quick Actions</h2>
                    <div className="actions-list">
                        <div
                            className={`action-card ${stats && stats.pendingSubmissions > 0 ? 'urgent' : ''}`}
                            onClick={() => navigate('/admin/submissions')}
                        >
                            <div className="action-content">
                                <div className="action-icon">📨</div>
                                <div className="action-text">
                                    <h4>Review Submissions</h4>
                                    <p>Moderate user-submitted content</p>
                                </div>
                            </div>
                            <div className="action-arrow">→</div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate('/admin/content')}
                        >
                            <div className="action-content">
                                <div className="action-icon">📚</div>
                                <div className="action-text">
                                    <h4>Manage Content</h4>
                                    <p>Edit or delete live platform content</p>
                                </div>
                            </div>
                            <div className="action-arrow">→</div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate('/admin/brand-inquiries')}
                        >
                            <div className="action-content">
                                <div className="action-icon">🤝</div>
                                <div className="action-text">
                                    <h4>Brand Inquiries</h4>
                                    <p>Review partnership requests & provision accounts</p>
                                </div>
                            </div>
                            <div className="action-arrow">→</div>
                        </div>

                        <div
                            className="action-card"
                            onClick={() => navigate('/admin/editorial-review')}
                        >
                            <div className="action-content">
                                <div className="action-icon">🖋️</div>
                                <div className="action-text">
                                    <h4>Editorial Bridge</h4>
                                    <p>Moderate and publish professional brand content</p>
                                </div>
                            </div>
                            <div className="action-arrow">→</div>
                        </div>
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
};

export default AdminDashboard;
