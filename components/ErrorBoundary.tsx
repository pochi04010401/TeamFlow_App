'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="card p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-danger/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-accent-danger" />
            </div>
            <h3 className="text-lg font-semibold text-dark-100 mb-2">
              エラーが発生しました
            </h3>
            <p className="text-dark-400 text-sm mb-4">
              {this.state.error?.message || 'データの読み込み中に問題が発生しました'}
            </p>
            <button
              onClick={this.handleRetry}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              再試行
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 関数コンポーネント版のエラー表示
export function ErrorDisplay({ 
  message, 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="card p-6 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-danger/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-accent-danger" />
        </div>
        <h3 className="text-lg font-semibold text-dark-100 mb-2">
          エラーが発生しました
        </h3>
        <p className="text-dark-400 text-sm mb-4">
          {message || 'データの読み込み中に問題が発生しました'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            再試行
          </button>
        )}
      </div>
    </div>
  );
}
