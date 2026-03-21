import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center bg-obsidiana p-6 text-center">
          <div className="max-w-md w-full bg-ardosia border border-alerta/20 rounded-[40px] p-8 shadow-2xl shadow-alerta/5">
            <div className="w-20 h-20 bg-alerta/10 rounded-3xl flex items-center justify-center text-alerta mx-auto mb-6">
              <ShieldAlert size={40} strokeWidth={2.5} />
            </div>
            
            <h1 className="text-2xl font-black text-pergaminho italic tracking-tighter uppercase mb-2">
              Protocolo de Erro
            </h1>
            
            <p className="text-pergaminho/60 text-sm font-medium mb-8">
              Ocorreu uma falha inesperada no sistema. Nossos protocolos de segurança recomendam reiniciar o aplicativo.
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-alerta text-pergaminho rounded-2xl font-black uppercase italic tracking-tighter hover:opacity-90 transition-all shadow-lg shadow-alerta/20"
            >
              <RefreshCw size={18} />
              Reiniciar Sistema
            </button>
            
            {this.state.error && (
              <div className="mt-8 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-ouro/40 mb-2">Log de Erro:</p>
                <pre className="p-4 bg-obsidiana/50 border border-white/5 text-[10px] font-mono text-pergaminho/30 rounded-xl overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
