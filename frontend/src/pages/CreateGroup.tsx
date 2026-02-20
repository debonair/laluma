import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useNavigate } from 'react-router-dom';

const CreateGroup: React.FC = () => {
    const { createGroup } = useGroup();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && description) {
            createGroup(name, description);
            navigate('/groups');
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
                    <div className="form-group">
                        <label htmlFor="name">Group Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g. Morning Yoga Moms"
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
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }}>
                        Create Group
                    </button>
                </form>
            </main>
        </div>
    );
};

export default CreateGroup;
