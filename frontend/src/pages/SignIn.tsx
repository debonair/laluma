import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';

import './Auth.css';

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
                <div className="auth-header">
                    <div className="auth-logo">
                        🌸
                    </div>
                    <h1>Welcome back</h1>
                    <p>
                        Sign in to your Luma account
                    </p>
                </div>

                {/* Error */}
                {displayError && (
                    <div className="auth-error">
                        {displayError}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
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

                    <div className="form-group">
                        <label htmlFor="signin-password">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                id="signin-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Your password"
                                autoComplete="current-password"
                                disabled={submitting || isLoading}
                                className="password-input"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary auth-submit-btn"
                        disabled={submitting || isLoading}
                    >
                        {submitting ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default SignIn;
