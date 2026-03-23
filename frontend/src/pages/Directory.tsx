import React, { useState, useEffect } from 'react';

import BottomNav from '../components/BottomNav';
import { directoryService, type DirectoryListing } from '../services/directory.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

import './Directory.css';

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
        <div className="directory-page page-container">
            <header className="page-header directory-header">
                <h1>Local Directory</h1>
                <p>Trusted recommendations from local moms</p>
            </header>

            <div className="category-filter-container">
                <div className="category-scroll">
                    {['All', 'Childcare', 'Healthcare', 'Activities', 'Services'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategory(cat === 'All' ? '' : cat)}
                            className={`category-btn ${category === cat || (cat === 'All' && !category) ? 'active' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <main className="page-content directory-content">
                {loading ? (
                    <div className="directory-loading">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} height={120} borderRadius="12px" />
                        ))}
                    </div>
                ) : listings.length > 0 ? (
                    <div className="listings-grid">
                        {listings.map(listing => (
                            <div key={listing.id} className="content-card listing-card">
                                <div className="listing-header">
                                    <h3 className="listing-name">{listing.name}</h3>
                                    <div className="listing-rating">
                                        ⭐ {listing.averageRating?.toFixed(1) || 'New'} ({listing.reviewCount || 0})
                                    </div>
                                </div>
                                <span className="listing-category-tag">
                                    {listing.category}
                                </span>
                                {listing.description && (
                                    <p className="listing-description">
                                        {listing.description}
                                    </p>
                                )}
                                {listing.address && (
                                    <div className="listing-address">
                                        📍 {listing.address}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state-card directory-empty">
                        <div className="empty-icon">📖</div>
                        <h3>No listings found</h3>
                        <p>There are no directory listings in this category.</p>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default Directory;
