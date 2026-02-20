import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, type UserSearchResult } from '../services/user.service';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

const Search: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Debounced search effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length === 0) {
                setResults([]);
                setHasSearched(false);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const users = await userService.searchUsers(query);
                setResults(users);
                setHasSearched(true);
            } catch (error) {
                console.error('Failed to search users:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
            <header className="page-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-color)', zIndex: 10 }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Discover Users</h1>
                <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px', fontSize: '1.2rem' }}>🔍</div>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or username..."
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 40px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--card-bg)',
                            fontSize: '1rem',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                        }}
                    />
                </div>
            </header>

            <main className="page-content" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '0 1rem' }}>
                    {isSearching ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Searching...</div>
                    ) : hasSearched && results.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🤷‍♀️</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>No mothers found</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Try searching for a different name.
                            </p>
                        </div>
                    ) : (
                        <div style={{ paddingTop: '1rem' }}>
                            {results.map(resultUser => {
                                // Don't show ourselves in search results clearly
                                if (resultUser.id === user?.id) return null;

                                return (
                                    <div
                                        key={resultUser.id}
                                        onClick={() => navigate(`/users/${resultUser.id}`)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            marginBottom: '0.5rem',
                                            borderRadius: '12px',
                                            backgroundColor: 'var(--card-bg)',
                                            border: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s, box-shadow 0.1s',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <div
                                            style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--primary-color)',
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '1.2rem',
                                                marginRight: '1rem',
                                                flexShrink: 0,
                                                backgroundImage: resultUser.profile_image_url ? `url(${resultUser.profile_image_url})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            {!resultUser.profile_image_url && (resultUser.display_name || resultUser.username).charAt(0).toUpperCase()}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {resultUser.display_name || resultUser.username}
                                            </h4>
                                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                @{resultUser.username}
                                                {resultUser.motherhood_stage && (
                                                    <span style={{ marginLeft: '0.5rem', padding: '2px 6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                        {resultUser.motherhood_stage}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        <div style={{ color: 'var(--primary-color)', marginLeft: '1rem' }}>
                                            ›
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div style={{ height: '80px' }} />
            </main>

            <BottomNav />
        </div>
    );
};

export default Search;
