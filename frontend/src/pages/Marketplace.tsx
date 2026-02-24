import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { marketplaceService, type MarketplaceItem } from '../services/marketplace.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const Marketplace: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<string>('');

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                // If user has location, use it for geofencing, else just fetch
                const params: any = {};
                if (user?.location && !(user.location as any).anywhere) {
                    params.latitude = (user.location as any).latitude;
                    params.longitude = (user.location as any).longitude;
                    params.radius = (user.location as any).radius || 50;
                }
                if (category) {
                    params.category = category;
                }
                const res = await marketplaceService.getItems(params);
                setItems(res.items);
            } catch (err: any) {
                addToast(err.message || 'Failed to fetch items', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [user, category, addToast]);

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
            <header className="page-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-color)', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Marketplace</h1>
                <button onClick={() => navigate('/marketplace/new')} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                    +
                </button>
            </header>

            <div style={{ padding: '1rem 1rem 0 1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {['All', 'Gear', 'Clothes', 'Toys', 'Free'].map(cat => (
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} height={180} borderRadius="12px" />
                        ))}
                    </div>
                ) : items.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {items.map(item => (
                            <div key={item.id} className="content-card" style={{ padding: '0.75rem', cursor: 'pointer' }}>
                                <div style={{ height: '120px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem' }}>
                                    {item.category === 'Toys' ? '🧸' : item.category === 'Clothes' ? '👕' : '📦'}
                                </div>
                                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                                        {item.price === 0 ? 'Free' : `$${item.price}`}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.condition}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state-card" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                        <h3>No items found</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>There are no marketplace items in this category near you.</p>
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default Marketplace;
