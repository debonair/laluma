import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';

const CreateGroup: React.FC = () => {
    const { createGroup } = useGroup();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && description) {
            setIsSubmitting(true);
            setError(null);
            try {
                await createGroup(name, description);
                navigate('/groups');
            } catch (err: any) {
                console.error("Failed to create group:", err);
                setError(err.message || "Failed to create group. Please try again.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="btn-link" style={{ marginRight: '1rem' }}>
                    ←
                </button>
                <h1>Create New Group</h1>
            </div>

            <main className="page-content">
                <form onSubmit={handleSubmit} className="auth-form">
                    {/* Error */}
                    {error && (
                        <div style={{
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            borderRadius: '10px',
                            padding: '0.75rem 1rem',
                            color: '#ff4444',
                            fontSize: '0.9rem',
                            marginBottom: '1.25rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">Group Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. Morning Yoga Moms"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={4}
                            placeholder="What is this group about?"
                            style={{ width: '100%', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '1rem' }}
                            disabled={isSubmitting}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Group'}
                    </button>
                </form>
            </main>
            <div style={{ height: '60px' }}></div>
            <BottomNav />
        </div>
    );
};

export default CreateGroup;
