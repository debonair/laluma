import { Component, type ErrorInfo, type ReactNode } from 'react';
import './ErrorBoundary.css';

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
                <div className="error-page">
                    <div className="content-card error-card">
                        <div className="error-icon">🚧</div>
                        <h1 className="error-title">
                            Oops, something went wrong.
                        </h1>
                        <p className="error-message">
                            We encountered an unexpected error. You can try reloading the page, or return to the home screen.
                        </p>

                        {/* Optional: Show error message in development */}
                        {this.state.error && (
                            <div className="error-details">
                                <p className="error-stack">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="error-actions">
                            <button className="btn-primary" onClick={this.handleReload}>
                                Reload Page
                            </button>
                            <button className="btn-secondary" onClick={this.handleGoHome}>
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
