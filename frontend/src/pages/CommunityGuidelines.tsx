import React, { useEffect, useState } from 'react';
import { communityGuidelinesService, type CommunityGuidelines } from '../services/communityGuidelines.service';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';

const CommunityGuidelinesPage: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [guidelines, setGuidelines] = useState<CommunityGuidelines | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGuidelines = async () => {
            try {
                setLoading(true);
                const data = await communityGuidelinesService.getCurrent();
                setGuidelines(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching community guidelines:', err);
                setError('Failed to load community guidelines');
            } finally {
                setLoading(false);
            }
        };

        fetchGuidelines();
    }, []);

    if (loading) {
        return (
            <div className="container" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                <Skeleton height={40} borderRadius="8px" style={{ marginBottom: '1rem' }} />
                <Skeleton height={200} borderRadius="8px" />
                <Skeleton height={200} borderRadius="8px" style={{ marginTop: '1rem' }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#fee2e2',
                    borderRadius: '8px',
                    color: '#991b1b'
                }}>
                    <h2>Unable to Load Guidelines</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!guidelines) {
        return (
            <div className="container" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '8px'
                }}>
                    <h2>No Community Guidelines Available</h2>
                    <p>Please check back later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Community Guidelines
                </h1>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Version {guidelines.version} • Last updated{' '}
                    {new Date(guidelines.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </header>

            <article style={{
                lineHeight: '1.7',
                color: '#374151'
            }}>
                {/* Render markdown content as simple HTML */}
                <div
                    style={{ whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{
                        __html: guidelines.content
                            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                            .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*)\*/g, '<em>$1</em>')
                            .replace(/\n/g, '<br />')
                    }}
                />
            </article>

            <footer style={{
                marginTop: '3rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                color: '#6b7280'
            }}>
                <p>
                    By using Luma, you agree to follow these guidelines.
                    {isAuthenticated && ' Contact our support team if you have any questions.'}
                </p>
            </footer>
        </div>
    );
};

export default CommunityGuidelinesPage;
