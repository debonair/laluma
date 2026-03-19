import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';

const SignIn: React.FC = () => {
    const { signIn, isAuthenticated, isLoading, error, clearError } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        if (!username.trim() || !password) {
            setLocalError('Please enter your username and password.');
            return;
        }

        setSubmitting(true);
        try {
            await signIn(username.trim(), password);
            navigate('/');
        } catch {
            // Error is set in AuthContext; also capture locally
            setLocalError('');
        } finally {
            setSubmitting(false);
        }
    };

    const displayError = localError || error;

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Logo / Branding */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div className="glass-card" style={{
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        margin: '0 auto 1.5rem',
                        padding: 0
                    }}>
                        🌸
                    </div>
                    <h1>Welcome back</h1>
                    <p style={{ marginTop: '0.5rem' }}>
                        Sign in to your Luma account
                    </p>
                </div>

                {/* Error */}
                {displayError && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.75rem',
                        padding: '0.75rem 1rem',
                        color: '#ef4444',
                        fontSize: '0.9rem',
                        marginBottom: '1.25rem',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        {displayError}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor="signin-username">Username</label>
                        <input
                            id="signin-username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Your username"
                            autoComplete="username"
                            autoFocus
                            disabled={submitting || isLoading}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label htmlFor="signin-password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="signin-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Your password"
                                autoComplete="current-password"
                                disabled={submitting || isLoading}
                                style={{ paddingRight: '3rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)',
                                    fontSize: '1.1rem',
                                    padding: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        disabled={submitting || isLoading}
                    >
                        {submitting ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    Don't have an account? <Link to="/signup">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default SignIn;
