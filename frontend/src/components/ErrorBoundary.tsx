import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Here you could also log the error to an error reporting service
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="page-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
                    <div className="content-card" style={{ maxWidth: '500px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚧</div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                            Oops, something went wrong.
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>
                            We encountered an unexpected error. You can try reloading the page, or return to the home screen.
                        </p>

                        {/* Optional: Show error message in development */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div style={{ textAlign: 'left', background: '#f871711a', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #f871714d', overflowX: 'auto' }}>
                                <p style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: '0.8rem', margin: 0 }}>
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn-primary" onClick={this.handleReload} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                                Reload Page
                            </button>
                            <button className="btn-secondary" onClick={this.handleGoHome} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                                Go to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
