import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';

const passwordStrength = (pw: string): { label: string; color: string; pct: number } => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Weak', color: '#ff4444', pct: 25 };
    if (score === 2) return { label: 'Fair', color: '#ff9900', pct: 50 };
    if (score === 3) return { label: 'Good', color: '#44cc88', pct: 75 };
    return { label: 'Strong', color: '#00cc66', pct: 100 };
};

import './Auth.css';

const SignUp: React.FC = () => {
    const { signUp, isAuthenticated, isLoading, error, clearError, user } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');

    if (isAuthenticated) {
        if (user && !user.hasCompletedOnboarding) {
            return <Navigate to="/onboarding" replace />;
        }
        return <Navigate to="/" replace />;
    }

    const strength = password ? passwordStrength(password) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        setLocalError('');

        if (!username.trim() || !email.trim() || !password || !confirmPassword) {
            setLocalError('Please fill in all fields.');
            return;
        }
        if (username.trim().length < 3) {
            setLocalError('Username must be at least 3 characters.');
            return;
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
            setLocalError('Username can only contain letters, numbers, _ and -');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setLocalError('Please enter a valid email address.');
            return;
        }
        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        try {
            await signUp(username.trim(), email.trim(), password);
            // New user -> go to welcome then trust ritual
            navigate('/welcome');
        } catch {
            // Error set in AuthContext
        } finally {
            setSubmitting(false);
        }
    };

    const displayError = localError || error;

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Branding */}
                <div className="auth-header">
                    <div className="auth-logo">
                        🌸
                    </div>
                    <h1>Join Luma</h1>
                    <p>Create an account to connect with the community</p>
                </div>

                {/* Error */}
                {displayError && (
                    <div className="auth-error">
                        {displayError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Username */}
                    <div className="form-group">
                        <label htmlFor="signup-username">Username</label>
                        <input
                            id="signup-username"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="Choose a username"
                            autoComplete="username"
                            autoFocus
                            disabled={submitting || isLoading}
                        />
                        <span className="field-hint">
                            Letters, numbers, _ and - only
                        </span>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label htmlFor="signup-email">Email</label>
                        <input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            autoComplete="email"
                            disabled={submitting || isLoading}
                        />
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label htmlFor="signup-password">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
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
                        {/* Strength meter */}
                        {strength && (
                            <div className="strength-meter">
                                <div className="strength-bar-container">
                                    <div
                                        className="strength-bar"
                                        style={{
                                            width: `${strength.pct}%`,
                                            background: strength.color
                                        }}
                                    />
                                </div>
                                <span className="strength-label" style={{ color: strength.color }}>
                                    {strength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label htmlFor="signup-confirm">Confirm Password</label>
                        <input
                            id="signup-confirm"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                            disabled={submitting || isLoading}
                            className={confirmPassword && confirmPassword !== password ? 'input-error' : ''}
                        />
                        {confirmPassword && confirmPassword !== password && (
                            <span className="field-error">
                                Passwords don't match
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary auth-submit-btn"
                        disabled={submitting || isLoading}
                    >
                        {submitting ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/signin">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
