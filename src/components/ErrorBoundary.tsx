import React, { Component } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900">Une erreur est survenue</h2>
              <p className="text-sm text-stone-500 mt-1">
                L'application a rencontré un problème inattendu lors du chargement.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-stone-50 p-3 rounded-lg text-left overflow-x-auto border border-stone-200">
                <p className="font-mono text-xs text-red-600 font-medium break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white font-medium text-sm rounded-xl hover:bg-green-700 transition shadow-md active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}

export default ErrorBoundary;
