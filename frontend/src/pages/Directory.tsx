import React, { useState, useEffect } from 'react';

import BottomNav from '../components/BottomNav';
import { directoryService, type DirectoryListing } from '../services/directory.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const Directory: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [listings, setListings] = useState<DirectoryListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<string>('');

    useEffect(() => {
        const fetchListings = async () => {
            setLoading(true);
            try {
                const params: any = {};
                if (user?.location && !(user.location as any).anywhere) {
                    params.latitude = (user.location as any).latitude;
                    params.longitude = (user.location as any).longitude;
                    params.radius = (user.location as any).radius || 50;
                }
                if (category) {
                    params.category = category;
                }
                const res = await directoryService.getListings(params);
                setListings(res.listings);
            } catch (err: any) {
                addToast(err.message || 'Failed to fetch directory listings', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [user, category, addToast]);

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-color)' }}>
            <header className="page-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-color)', zIndex: 10 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Local Directory</h1>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Trusted recommendations from local moms</p>
            </header>

            <div style={{ padding: '1rem 1rem 0 1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {['All', 'Childcare', 'Healthcare', 'Activities', 'Services'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat === 'All' ? '' : cat)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '100px',
                                border: '1px solid var(--border-color)',
                                background: category === cat || (cat === 'All' && !category) ? 'var(--primary-color)' : 'var(--card-bg)',
                                color: category === cat || (cat === 'All' && !category) ? 'white' : 'var(--text-primary)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <main className="page-content" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} height={120} borderRadius="12px" />
                        ))}
                    </div>
                ) : listings.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {listings.map(listing => (
                            <div key={listing.id} className="content-card" style={{ padding: '1rem', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{listing.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '100px', fontSize: '0.85rem' }}>
                                        ⭐ {listing.averageRating?.toFixed(1) || 'New'} ({listing.reviewCount || 0})
                                    </div>
                                </div>
                                <span style={{ display: 'inline-block', padding: '0.1rem 0.5rem', backgroundColor: 'var(--primary-color)', color: 'white', opacity: 0.8, borderRadius: '4px', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                    {listing.category}
                                </span>
                                {listing.description && (
                                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {listing.description}
                                    </p>
                                )}
                                {listing.address && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        📍 {listing.address}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state-card" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
                        <h3>No listings found</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>There are no directory listings in this category.</p>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default Directory;
