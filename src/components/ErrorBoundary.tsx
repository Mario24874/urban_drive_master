import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — catches unhandled render errors in the component tree.
 * Prevents the entire app from crashing due to a single failing chunk.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-black/80 p-6">
          <div className="max-w-sm w-full text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                {import.meta.env.DEV && this.state.error
                  ? this.state.error.message
                  : 'An unexpected error occurred. Please try refreshing.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-border text-muted-foreground hover:bg-white/10"
              >
                Reload app
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
