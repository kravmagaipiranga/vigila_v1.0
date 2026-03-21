import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Algo deu errado</h1>
            <p className="text-zinc-400 mb-6">
              Ocorreu um erro inesperado. Por favor, tente recarregar o aplicativo.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Recarregar
            </button>
            {this.state.error && (
              <pre className="mt-8 p-4 bg-zinc-900 text-xs text-zinc-500 rounded overflow-auto text-left">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
