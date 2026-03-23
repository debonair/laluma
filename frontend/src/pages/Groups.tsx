import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { Plus } from 'lucide-react';
import Header from '../components/Header';

import './Groups.css';

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
                        radius: 50
                    });
                },
                (error) => {
                    console.error("Error getting location", error);
                    setIsLocating(false);
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
                    <div className="groups-error-banner">
                        <span>{error}</span>
                        <button onClick={clearError} className="icon-btn groups-error-close">×</button>
                    </div>
                )}

                <div className="search-pill">
                    <span className="groups-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

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

                {activeTab === 'discover' && (
                    <div className="card groups-filter-card">
                        <div className="groups-filter-row">
                            <input
                                type="text"
                                placeholder="City (e.g. Austin)"
                                className="input-field groups-city-input"
                                value={cityFilter}
                                onChange={(e) => setCityFilter(e.target.value)}
                            />
                            <button
                                onClick={() => setNearMe(!nearMe)}
                                className={nearMe ? 'btn-secondary groups-near-me-btn' : 'btn-ghost groups-near-me-btn'}
                            >
                                <span>📍</span> {nearMe ? 'Near Me Active' : 'Near Me'}
                            </button>
                        </div>
                        <button
                            onClick={handleApplyFilters}
                            disabled={isLocating}
                            className="btn-primary groups-search-btn"
                        >
                            {isLocating ? 'Locating...' : 'Search Location'}
                        </button>
                    </div>
                )}

                <div className="groups-list">
                    {isLoading ? (
                        <>
                            {[1, 2, 3].map(i => (
                                <div key={i} className="content-card skeleton groups-skeleton-item"></div>
                            ))}
                        </>
                    ) : displayedGroups.length === 0 ? (
                        <p className="groups-empty-state">
                            {activeTab === 'my-groups'
                                ? "You haven't joined any groups yet. Check the 'Discover' tab!"
                                : "No new groups found."}
                        </p>
                    ) : (
                        displayedGroups.map(group => (
                            <div
                                key={group.id}
                                className="content-card group-item-card"
                                onClick={() => navigate(`/groups/${group.id}`)}
                            >
                                <div className="group-item-emoji">
                                    {group.image_emoji || '👥'}
                                </div>
                                <div className="group-item-info">
                                    <h3 className="group-item-name">{group.name}</h3>
                                    <p className="group-item-description">
                                        {group.description}
                                    </p>
                                    <div className="group-item-meta">
                                        <p className="group-item-members">
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
                                        className="btn-primary group-join-btn"
                                        onClick={(e) => handleJoin(e, group.id)}
                                    >
                                        Join
                                    </button>
                                ) : (
                                    activeTab === 'my-groups' && (
                                        <div className="group-item-arrow">
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
