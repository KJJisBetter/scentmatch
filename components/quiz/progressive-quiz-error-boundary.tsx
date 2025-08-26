'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { getProgressiveSessionManager } from '@/lib/quiz/progressive-session-manager';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
  canRecover: boolean;
}

/**
 * Progressive Quiz Error Boundary
 * 
 * Provides graceful error handling for the quiz conversion flow with:
 * - Session preservation during errors
 * - Progressive recovery options based on quiz state
 * - User-friendly error messages that don't break the flow
 * - Analytics tracking for error optimization
 */
export class ProgressiveQuizErrorBoundary extends Component<Props, State> {
  private sessionManager = typeof window !== 'undefined' ? getProgressiveSessionManager() : null;

  public state: State = {
    hasError: false,
    errorId: '',
    canRecover: true
  };

  public static override getDerivedStateFromError(error: Error): State {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Determine if error is recoverable based on type
    const canRecover = !error.message.includes('ChunkLoadError') && 
                      !error.message.includes('NetworkError') &&
                      !error.message.includes('TypeError: Failed to fetch');

    return {
      hasError: true,
      error,
      errorId,
      canRecover
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track error for optimization
    this.trackError(error, errorInfo);

    // Preserve session data if possible
    if (this.sessionManager) {
      this.sessionManager.trackEngagement({
        type: 'error_occurred',
        value: {
          error_message: error.message,
          error_stack: error.stack?.slice(0, 500), // Truncated for storage
          error_id: this.state.errorId,
          component_stack: errorInfo.componentStack?.slice(0, 500)
        },
        context: 'error_boundary'
      });
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('Progressive Quiz Error:', {
      error,
      errorInfo,
      errorId: this.state.errorId,
      sessionData: this.getSessionSummary()
    });
  }

  private trackError = (error: Error, errorInfo: ErrorInfo) => {
    // Track in analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'quiz_error', {
        error_message: error.message,
        error_id: this.state.errorId,
        component_stack: errorInfo.componentStack?.slice(0, 100),
        can_recover: this.state.canRecover,
        session_valid: this.sessionManager?.isSessionValid() || false
      });
    }
  };

  private getSessionSummary = () => {
    if (!this.sessionManager) return null;

    return {
      session_valid: this.sessionManager.isSessionValid(),
      engagement_score: this.sessionManager.getEngagementScore(),
      time_spent: this.sessionManager.getTimeSpentMinutes()
    };
  };

  private handleRetry = () => {
    // Track recovery attempt
    if (this.sessionManager) {
      this.sessionManager.trackEngagement({
        type: 'error_recovery_attempted',
        value: {
          error_id: this.state.errorId,
          recovery_method: 'retry'
        },
        context: 'error_recovery'
      });
    }

    this.setState({
      hasError: false,
      error: undefined,
      errorId: '',
      canRecover: true
    });
  };

  private handleRestart = () => {
    // Track restart attempt
    if (this.sessionManager) {
      this.sessionManager.trackEngagement({
        type: 'error_recovery_attempted',
        value: {
          error_id: this.state.errorId,
          recovery_method: 'restart'
        },
        context: 'error_recovery'
      });
    }

    // Navigate back to quiz start
    window.location.href = '/quiz';
  };

  private handleGoHome = () => {
    // Track home navigation
    if (this.sessionManager) {
      this.sessionManager.trackEngagement({
        type: 'error_recovery_attempted',
        value: {
          error_id: this.state.errorId,
          recovery_method: 'go_home'
        },
        context: 'error_recovery'
      });
    }

    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const sessionSummary = this.getSessionSummary();
      const hasProgressToSave = sessionSummary?.engagement_score && sessionSummary.engagement_score > 0.2;

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 flex items-center justify-center p-4">
          <Card className="max-w-lg mx-auto">
            <CardContent className="text-center py-8">
              <div className="mb-6">
                <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Oops! Something went wrong
                </h2>
                <p className="text-muted-foreground mb-4">
                  {this.state.canRecover 
                    ? "We encountered a temporary issue, but don't worry - your progress is safe!"
                    : "We're experiencing technical difficulties. Let's get you back on track."
                  }
                </p>

                {hasProgressToSave && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-700">
                      ✅ Your quiz progress and preferences are automatically saved
                    </p>
                  </div>
                )}

                <div className="text-xs text-muted-foreground bg-gray-50 rounded p-2 mb-6">
                  Error ID: {this.state.errorId}
                </div>
              </div>

              <div className="space-y-3">
                {this.state.canRecover && (
                  <Button
                    onClick={this.handleRetry}
                    size="lg"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}

                <Button
                  onClick={this.handleRestart}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Restart Quiz
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                >
                  Go to Homepage
                </Button>
              </div>

              {sessionSummary && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <div className="font-medium">Time Spent</div>
                      <div>{sessionSummary.time_spent} minutes</div>
                    </div>
                    <div>
                      <div className="font-medium">Progress</div>
                      <div>{Math.round((sessionSummary.engagement_score || 0) * 100)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping quiz components with error boundary
 */
export function withProgressiveErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ProgressiveQuizErrorBoundary fallback={errorFallback} onError={onError}>
      <Component {...props} />
    </ProgressiveQuizErrorBoundary>
  );

  WrappedComponent.displayName = `withProgressiveErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Lightweight error boundary for specific quiz steps
 */
export function QuizStepErrorBoundary({ 
  children, 
  stepName,
  onStepError
}: { 
  children: ReactNode; 
  stepName: string;
  onStepError?: (error: Error) => void;
}) {
  return (
    <ProgressiveQuizErrorBoundary
      onError={(error, errorInfo) => {
        console.error(`Quiz step error (${stepName}):`, error);
        onStepError?.(error);
      }}
      fallback={
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-6">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Step Loading Issue</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We're having trouble loading this quiz step.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              size="sm"
              variant="outline"
            >
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      }
    >
      {children}
    </ProgressiveQuizErrorBoundary>
  );
}