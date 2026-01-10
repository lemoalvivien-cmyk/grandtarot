import React from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle } from 'lucide-react';

/**
 * ErrorBoundary - Global error handler
 * Catches React errors + logs to AuditLog (non-blocking)
 * Shows friendly error page instead of white screen
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      currentPage: 'unknown',
      userId: 'anonymous'
    };
  }

  async componentDidMount() {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        this.setState({ userId: user.email });
      }
    } catch (e) {
      // Ignore auth errors
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      currentPage: window.location.pathname
    });

    // Log to AuditLog (non-blocking)
    this.logError(error, errorInfo);
  }

  logError = async (error, errorInfo) => {
    try {
      const stackTruncated = (error.stack || '').split('\n').slice(0, 5).join('\n');
      
      await base44.entities.AuditLog.create({
        actor_user_id: this.state.userId,
        actor_role: 'user',
        action: 'error_caught',
        entity_name: 'ErrorBoundary',
        entity_id: 'frontend',
        payload_summary: `Frontend error: ${error.message}`,
        payload_data: {
          errorMessage: error.message,
          page: this.state.currentPage,
          componentStack: errorInfo?.componentStack?.slice(0, 200)
        },
        severity: 'warning',
        status: 'failed'
      }).catch(() => {}); // Ignore if fails
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl" />
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto relative" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-red-200 mb-3">
              Oops! Something went wrong
            </h1>
            <p className="text-slate-400 mb-6">
              We've logged this error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-left mb-6">
                <p className="text-xs text-red-300 font-mono break-words">
                  {this.state.error?.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-violet-600 hover:from-amber-400 hover:to-violet-500 text-white font-medium rounded-lg transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}