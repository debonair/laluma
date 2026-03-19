import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Plus } from 'lucide-react';
import Header from '../components/Header';

const Groups: React.FC = () => {
    const { groups, userGroups, joinGroup, isLoading, refreshGroups, error, clearError } = useGroup();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [nearMe, setNearMe] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    React.useEffect(() => {
        clearError();
    }, [clearError]);

    const isMember = (groupId: string) => userGroups.some(g => g.id === groupId);

    const filteredGroups = activeTab === 'my-groups'
        ? userGroups
        : groups.filter(g => !isMember(g.id));

    const displayedGroups = filteredGroups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleJoin = async (e: React.MouseEvent, groupId: string) => {
        e.stopPropagation();
        await joinGroup(groupId);
    };

    const handleApplyFilters = () => {
        if (nearMe) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setIsLocating(false);
                    refreshGroups({
                        city: cityFilter || undefined,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        radius: 50 // default to 50km
                    });
                },
                (error) => {
                    console.error("Error getting location", error);
                    setIsLocating(false);
                    // Fallback to just city
                    refreshGroups({ city: cityFilter || undefined });
                }
            );
        } else {
            refreshGroups({ city: cityFilter || undefined });
        }
    };

    return (
        <div className="page-container">
            <Header 
                title="Community Groups" 
                subtitle="Join groups to discover content and members"
                rightAction={
                    <button
                        onClick={() => navigate('/groups/create')}
                        className="icon-btn"
                        title="Create Group"
                    >
                        <Plus size={24} />
                    </button>
                }
            />

            <main className="page-content">
                {error && (
                    <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                    }}>
                        <span>{error}</span>
                        <button 
                            onClick={clearError}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#991b1b' }}
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Search Bar */}
                <div className="search-pill">
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        onClick={() => setActiveTab('my-groups')}
                        className={`tab-button ${activeTab === 'my-groups' ? 'active' : ''}`}
                    >
                        My Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`tab-button ${activeTab === 'discover' ? 'active' : ''}`}
                    >
                        Discover
                    </button>
                </div>

                {/* Geography Filters (Only on Discover) */}
                {activeTab === 'discover' && (
                    <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="City (e.g. Austin)"
                                className="input-field"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button
                                onClick={() => setNearMe(!nearMe)}
                                className={nearMe ? 'btn-secondary' : 'btn-outline'}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span>📍</span> {nearMe ? 'Near Me Active' : 'Near Me'}
                            </button>
                        </div>
                        <button
                            onClick={handleApplyFilters}
                            disabled={isLocating}
                            className="btn-primary"
                            style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                        >
                            {isLocating ? 'Locating...' : 'Search Location'}
                        </button>
                    </div>
                )}

                {/* Group List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {isLoading ? (
                        <>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="content-card skeleton" style={{ height: '100px', width: '100%', padding: 0 }}></div>
                            ))}
                        </>
                    ) : displayedGroups.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                            {activeTab === 'my-groups'
                                ? "You haven't joined any groups yet. Check the 'Discover' tab!"
                                : "No new groups found."}
                        </p>
                    ) : (
                        displayedGroups.map(group => (
                            <div
                                key={group.id}
                                className="content-card"
                                onClick={() => navigate(`/groups/${group.id}`)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    padding: '1rem'
                                }}
                            >
                                <div style={{ fontSize: '2rem', flexShrink: 0 }}>
                                    {group.image_emoji || '👥'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{group.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {group.description}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {group.member_count} members
                                        </p>
                                        {(group.city) && (
                                            <span className="badge">
                                                📍 {group.city}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {activeTab === 'discover' ? (
                                    <button
                                        className="btn-primary"
                                        onClick={(e) => handleJoin(e, group.id)}
                                        style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                    >
                                        Join
                                    </button>
                                ) : (
                                    activeTab === 'my-groups' && ( // Only show leave if needed, or maybe just view
                                        <div style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '1.2rem' }}>
                                            ›
                                        </div>
                                    )
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default Groups;
