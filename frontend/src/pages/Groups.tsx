import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const Groups: React.FC = () => {
    const { groups, userGroups, joinGroup, isLoading } = useGroup();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
    const [searchTerm, setSearchTerm] = useState('');

    const isMember = (groupId: string) => userGroups.some(g => g.id === groupId);

    const filteredGroups = activeTab === 'my-groups'
        ? userGroups
        : groups.filter(g => !isMember(g.id));

    const displayedGroups = filteredGroups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleJoin = (e: React.MouseEvent, groupId: string) => {
        e.stopPropagation();
        joinGroup(groupId);
    };

    // const handleLeave = (e: React.MouseEvent, groupId: string) => {
    //     e.stopPropagation();
    //     leaveGroup(groupId);
    // };

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Community Groups</h1>
                <button
                    onClick={() => navigate('/groups/create')}
                    className="btn-link"
                    style={{ fontSize: '1.5rem', padding: '0 0.5rem' }}
                >
                    +
                </button>
            </div>

            <main className="page-content">
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
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setActiveTab('my-groups')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderBottom: activeTab === 'my-groups' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            color: activeTab === 'my-groups' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        My Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderBottom: activeTab === 'discover' ? '2px solid var(--primary-color)' : '2px solid transparent',
                            color: activeTab === 'discover' ? 'var(--primary-color)' : 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Discover
                    </button>
                </div>

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
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {group.member_count} members
                                    </p>
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

                {/* Spacer for bottom nav */}
                <div style={{ height: '60px' }}></div>
            </main>

            <BottomNav />
        </div>
    );
};

export default Groups;
