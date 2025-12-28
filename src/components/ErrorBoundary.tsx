import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const isSupabaseError = this.state.error?.message?.includes('SUPABASE') || 
                             this.state.error?.message?.includes('environment variable');

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">
                {isSupabaseError ? 'Database Configuration Error' : 'Application Error'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSupabaseError ? (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">Supabase Configuration Issue</h3>
                    <p className="text-red-700 text-sm mb-3">
                      The application is configured to use Supabase database, but the configuration is invalid or missing.
                    </p>
                    <div className="bg-white rounded border p-3 font-mono text-sm text-red-600">
                      {this.state.error?.message}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Solutions:</h4>
                    <ul className="text-blue-700 text-sm space-y-2">
                      <li className="flex items-start">
                        <span className="font-bold mr-2">1.</span>
                        <span>Check environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">2.</span>
                        <span>Verify Supabase project is active and accessible</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-bold mr-2">3.</span>
                        <span>Check network connection to Supabase servers</span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => window.location.reload()} 
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Retry Connection
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Supabase Dashboard
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Error Details</h3>
                    <div className="bg-white rounded border p-3 font-mono text-sm text-gray-600">
                      {this.state.error?.message || 'Unknown error occurred'}
                    </div>
                  </div>

                  <Button 
                    onClick={() => window.location.reload()} 
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload Application
                  </Button>
                </div>
              )}

              <div className="text-center text-sm text-gray-500 pt-4 border-t">
                <p>If the problem persists, please contact the system administrator.</p>
                <p className="mt-1">
                  <strong>Error ID:</strong> {Date.now().toString(36)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;