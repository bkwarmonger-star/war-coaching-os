import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{ backgroundColor: "var(--black)", color: "var(--white)" }}
          className="flex items-center justify-center min-h-screen p-8"
        >
          <div className="text-center max-w-md">
            <h1 className="font-bebas text-4xl mb-4" style={{ color: "var(--red)" }}>
              ERROR
            </h1>
            <p className="font-rajdhani mb-4" style={{ color: "var(--muted)" }}>
              Something went wrong. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ backgroundColor: "var(--gold)", color: "#000" }}
              className="font-oswald font-bold uppercase tracking-wider px-6 py-3 rounded hover:bg-[var(--gold-bright)] transition-all"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
