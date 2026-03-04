import React, { useEffect, useState } from 'react';
import { communityGuidelinesService, type CommunityGuidelines, type GuidelinesPaginatedResponse } from '../../services/communityGuidelines.service';
import { useToast } from '../../context/ToastContext';
import Skeleton from '../../components/Skeleton';

const AdminCommunityGuidelines: React.FC = () => {
    const { addToast } = useToast();
    const [guidelinesList, setGuidelinesList] = useState<GuidelinesPaginatedResponse | null>(null);
    const [currentGuidelines, setCurrentGuidelines] = useState<CommunityGuidelines | null>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    useEffect(() => {
        fetchGuidelines();
    }, []);

    const fetchGuidelines = async () => {
        try {
            setLoading(true);
            const [listData, currentData] = await Promise.all([
                communityGuidelinesService.getAll({ page: 1, limit: 20 }),
                communityGuidelinesService.getCurrent().catch(() => null),
            ]);
            setGuidelinesList(listData);
            setCurrentGuidelines(currentData);
            if (currentData) {
                setContent(currentData.content);
                setSelectedVersionId(currentData.id);
            }
        } catch (err) {
            console.error('Error fetching guidelines:', err);
            addToast('Failed to load community guidelines', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!content.trim()) {
            addToast('Content cannot be empty', 'error');
            return;
        }

        try {
            setSaving(true);
            const newVersion = await communityGuidelinesService.create(content);
            setCurrentGuidelines(newVersion);
            addToast('Community guidelines published successfully!', 'success');
            fetchGuidelines();
        } catch (err) {
            console.error('Error publishing guidelines:', err);
            addToast('Failed to publish guidelines', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleVersionSelect = async (versionId: string) => {
        try {
            const version = await communityGuidelinesService.getById(versionId);
            setContent(version.content);
            setSelectedVersionId(versionId);
        } catch (err) {
            console.error('Error fetching version:', err);
            addToast('Failed to load version', 'error');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div style={{ padding: '1rem' }}>
                <Skeleton height={40} borderRadius="8px" style={{ marginBottom: '1rem' }} />
                <Skeleton height={300} borderRadius="8px" style={{ marginBottom: '1rem' }} />
                <Skeleton height={100} borderRadius="8px" />
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                    Community Guidelines
                </h1>
                <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                    Create, edit, and publish community guidelines for all members
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
                {/* Main Editor */}
                <div>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        padding: '1rem',
                        marginBottom: '1rem'
                    }}>
                        <label style={{
                            display: 'block',
                            fontWeight: '600',
                            marginBottom: '0.5rem'
                        }}>
                            Guidelines Content (Markdown Supported)
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your community guidelines here...&#10;&#10;Use Markdown for formatting:&#10;# Heading&#10;## Subheading&#10;**bold** *italic*"
                            style={{
                                width: '100%',
                                minHeight: '300px',
                                padding: '0.75rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                                resize: 'vertical',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => fetchGuidelines()}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                            }}
                        >
                            Refresh
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={saving || !content.trim()}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                opacity: saving ? 0.7 : 1,
                            }}
                        >
                            {saving ? 'Publishing...' : 'Publish New Version'}
                        </button>
                    </div>
                </div>

                {/* Version History Sidebar */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    padding: '1rem',
                    height: 'fit-content',
                }}>
                    <h3 style={{
                        fontWeight: '600',
                        marginBottom: '1rem',
                        fontSize: '1rem'
                    }}>
                        Version History
                    </h3>

                    {!guidelinesList?.data.length ? (
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            No versions published yet
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {guidelinesList.data.map((version) => (
                                <button
                                    key={version.id}
                                    onClick={() => handleVersionSelect(version.id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '0.75rem',
                                        border: selectedVersionId === version.id
                                            ? '2px solid #2563eb'
                                            : '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        backgroundColor: selectedVersionId === version.id
                                            ? '#eff6ff'
                                            : 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '0.875rem',
                                        color: '#111827'
                                    }}>
                                        Version {version.version}
                                        {version.id === currentGuidelines?.id && (
                                            <span style={{
                                                marginLeft: '0.5rem',
                                                fontSize: '0.75rem',
                                                color: '#059669',
                                                fontWeight: 'normal'
                                            }}>
                                                (Current)
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: '#6b7280',
                                        marginTop: '0.25rem'
                                    }}>
                                        {formatDate(version.publishedAt)}
                                    </div>
                                    {version.creator && (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: '#6b7280'
                                        }}>
                                            by {version.creator.displayName || version.creator.username}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {guidelinesList && guidelinesList.totalPages > 1 && (
                        <div style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid #e5e7eb',
                            fontSize: '0.875rem',
                            color: '#6b7280'
                        }}>
                            Page {guidelinesList.page} of {guidelinesList.totalPages}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCommunityGuidelines;
