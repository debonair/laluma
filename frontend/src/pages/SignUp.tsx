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
            // New user → go to onboarding
            navigate('/onboarding');
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
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #ff6b9d 0%, #c44dff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.75rem',
                        margin: '0 auto 1rem',
                        boxShadow: '0 4px 16px rgba(196, 77, 255, 0.3)'
                    }}>
                        🌸
                    </div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>Join Luma</h1>
                    <p className="auth-subtitle" style={{ marginTop: '0.5rem' }}>
                        Your community of mothers awaits
                    </p>
                </div>

                {/* Error */}
                {displayError && (
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
                        {displayError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    {/* Username */}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                            Letters, numbers, _ and - only
                        </span>
                    </div>

                    {/* Email */}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
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
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label htmlFor="signup-password">Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="signup-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 8 characters"
                                autoComplete="new-password"
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
                        {/* Strength meter */}
                        {strength && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <div style={{
                                    height: 4,
                                    borderRadius: 2,
                                    background: 'var(--border-color)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${strength.pct}%`,
                                        background: strength.color,
                                        transition: 'width 0.3s ease, background 0.3s ease',
                                        borderRadius: 2
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 500 }}>
                                    {strength.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label htmlFor="signup-confirm">Confirm Password</label>
                        <input
                            id="signup-confirm"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                            disabled={submitting || isLoading}
                            style={{
                                borderColor: confirmPassword && confirmPassword !== password
                                    ? '#ff4444' : undefined
                            }}
                        />
                        {confirmPassword && confirmPassword !== password && (
                            <span style={{ fontSize: '0.75rem', color: '#ff4444', marginTop: '0.25rem', display: 'block' }}>
                                Passwords don't match
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '1rem', padding: '0.85rem' }}
                        disabled={submitting || isLoading}
                    >
                        {submitting ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    Already have an account? <Link to="/signin">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;
